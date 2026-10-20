// Moon times and solunar feeding periods, computed on the device (SunCalc positions + our own rise/set search).
// Validated against timeanddate.com for Melbourne (see README / release notes). Solunar is a traditional angling
// theory with no firm scientific proof – the app labels it as a guide only.
import * as SunCalc from "suncalc";

const MIN = 60000;
/** "YYYY-MM-DDTHH:mm" in the given time zone. */
const FMT = new Map<string, Intl.DateTimeFormat>();
export function fmt(d: Date | number, tz: string) {
  let f = FMT.get(tz); if (!f) { f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); FMT.set(tz, f); }
  const p = f.formatToParts(new Date(d));
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
}
/** Start of a local calendar day (YYYY-MM-DD) as a timestamp. */
export function dayStart(date: string, tz: string) {
  const noon = new Date(date + "T12:00:00Z").getTime();
  const off = new Date(fmt(noon, tz) + ":00Z").getTime() - noon;
  let t = new Date(date + "T00:00:00Z").getTime() - off;
  // DST changes inside the day: correct once more
  const off2 = new Date(fmt(t, tz) + ":00Z").getTime() - t;
  t = new Date(date + "T00:00:00Z").getTime() - off2;
  return t;
}
export const dayEnd = (date: string, tz: string) => { const d = new Date(date + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); return dayStart(d.toISOString().slice(0, 10), tz); };

const HC = (0.133 * Math.PI) / 180; // same horizon allowance SunCalc uses for the moon
export type MoonDay = {
  rise: number | null; set: number | null; transit: number | null; underfoot: number | null;
  /** Moon above the horizon from today's moonrise to the next moonset, in minutes. */
  visibleMin: number | null; nextSet: number | null;
};
/** Moonrise, moonset, upper transit (moon overhead) and lower transit (moon underfoot) inside one local day. */
export function moonDay(date: string, tz: string, lat: number, lon: number): MoonDay {
  const t0 = dayStart(date, tz), t1 = dayEnd(date, tz), step = 2 * MIN, end = t1 + 30 * 3600000;
  const alt = (t: number) => SunCalc.getMoonPosition(new Date(t), lat, lon).altitude - HC;
  const ts: number[] = [], al: number[] = [];
  for (let t = t0 - step; t <= end; t += step) { ts.push(t); al.push(alt(t)); }
  const rises: number[] = [], sets: number[] = [], tr: number[] = [], uf: number[] = [];
  for (let i = 1; i < ts.length - 1; i++) {
    if (al[i - 1] < 0 && al[i] >= 0) rises.push(ts[i - 1] + (step * -al[i - 1]) / (al[i] - al[i - 1]));
    if (al[i - 1] >= 0 && al[i] < 0) sets.push(ts[i - 1] + (step * al[i - 1]) / (al[i - 1] - al[i]));
    if (al[i] > al[i - 1] && al[i] >= al[i + 1]) { const d = al[i - 1] - 2 * al[i] + al[i + 1]; tr.push(ts[i] + (step * 0.5 * (al[i - 1] - al[i + 1])) / d); }
    if (al[i] < al[i - 1] && al[i] <= al[i + 1]) { const d = al[i - 1] - 2 * al[i] + al[i + 1]; uf.push(ts[i] + (step * 0.5 * (al[i - 1] - al[i + 1])) / d); }
  }
  const inDay = (a: number[]) => a.find((x) => x >= t0 && x < t1) ?? null;
  const rise = inDay(rises), set = inDay(sets);
  const nextSet = rise != null ? sets.find((x) => x > rise) ?? null : null;
  return { rise, set, transit: inDay(tr), underfoot: inDay(uf), visibleMin: rise != null && nextSet != null ? Math.round((nextSet - rise) / MIN) : null, nextSet };
}

export type Period = {
  kind: "major" | "minor"; label: string; start: string; end: string; mid: string;
  t0: number; t1: number; tm: number; rating: 1 | 2 | 3; sun: "sunrise" | "sunset" | null; moonEvent: "overhead" | "underfoot" | "moonrise" | "moonset";
};
/** Is the moon near new or full (bigger tides, which anglers rate higher)? */
export const nearNewFull = (ms: number) => { const ph = SunCalc.getMoonIllumination(new Date(ms)).phase; return Math.min(ph, 1 - ph, Math.abs(ph - 0.5)) <= 0.068; };

export function solunar(date: string, tz: string, lat: number, lon: number): Period[] {
  const md = moonDay(date, tz, lat, lon);
  const noon = new Date(dayStart(date, tz) + 12 * 3600000);
  const sun = SunCalc.getTimes(noon, lat, lon);
  const sr = sun.sunrise!.getTime(), ss = sun.sunset!.getTime();
  const nf = nearNewFull(noon.getTime());
  const out: Period[] = [];
  const add = (tm: number | null, kind: Period["kind"], label: string, moonEvent: Period["moonEvent"]) => {
    if (tm == null) return;
    const half = (kind === "major" ? 60 : 30) * MIN, t0 = tm - half, t1 = tm + half;
    const hit = (s: number) => t0 <= s + 30 * MIN && t1 >= s - 30 * MIN;
    const sunHit = hit(sr) ? "sunrise" : hit(ss) ? "sunset" : null;
    const rating = Math.min(3, (kind === "major" ? 2 : 1) + (sunHit ? 1 : 0) + (nf ? 1 : 0)) as 1 | 2 | 3;
    out.push({ kind, label, mid: fmt(tm, tz), start: fmt(t0, tz), end: fmt(t1, tz), t0, t1, tm, rating, sun: sunHit, moonEvent });
  };
  add(md.transit, "major", "Moon overhead", "overhead");
  add(md.underfoot, "major", "Moon underfoot", "underfoot");
  add(md.rise, "minor", "Moonrise", "moonrise");
  add(md.set, "minor", "Moonset", "moonset");
  return out.sort((a, b) => a.tm - b.tm);
}

export type DayRating = "Low" | "Fair" | "Good" | "High";
export function dayRating(p: Period[]): DayRating {
  const pts = p.reduce((a, x) => a + (x.rating - 1), 0);
  return pts >= 4 ? "High" : pts >= 2 ? "Good" : pts >= 1 ? "Fair" : "Low";
}

export type TideEv = { t: number; type: "High" | "Low" };
