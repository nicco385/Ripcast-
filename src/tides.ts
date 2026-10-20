// Official tide predictions (Bureau of Meteorology) bundled with the app.
// Each station holds the real published high/low water times and heights; nothing is modelled.
import { TIDE_STATIONS, type TideStation } from "./data/tides";

export type TideEvent = { t: number; type: "High" | "Low"; m: number }; // t = epoch ms
export type Station = TideStation & { ev: { t: number; m: number }[] };

const b36 = (s: string, i: number) => parseInt(s.slice(i * 2, i * 2 + 2), 36);
const cache = new Map<string, Station>();
export function stationById(id: string): Station | undefined {
  const c = cache.get(id); if (c) return c;
  const s = TIDE_STATIONS.find((x) => x.id === id); if (!s) return undefined;
  const ev: { t: number; m: number }[] = []; let t = s.t0;
  for (let i = 0; i < s.n; i++) { if (i) t += b36(s.d, i - 1); ev.push({ t: t * 60000, m: (b36(s.h, i) - 100) / 100 }); }
  const st = { ...s, ev }; cache.set(id, st); return st;
}
export const TIDE_START = () => Math.min(...TIDE_STATIONS.map((s) => s.t0)) * 60000;
export const TIDE_END = () => { const s = stationById("williamstown")!; return s.ev[s.ev.length - 1].t; };

const rad = Math.PI / 180;
export const distKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const x = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};

/** Closest official station. Not used for inland places or places far from the bays. */
export function nearestStation(lat: number, lon: number): { station: Station; km: number } | null {
  let best: { s: TideStation; km: number } | null = null;
  for (const s of TIDE_STATIONS) { const km = distKm({ lat, lon }, s); if (!best || km < best.km) best = { s, km }; }
  if (!best || best.km > 40) return null;
  return { station: stationById(best.s.id)!, km: best.km };
}

/** Typed high/low events between two times (epoch ms). */
export function eventsBetween(st: Station, from: number, to: number): TideEvent[] {
  const out: TideEvent[] = [];
  const e = st.ev;
  let lo = 0, hi = e.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (e[mid].t < from) lo = mid + 1; else hi = mid; }
  for (let i = Math.max(1, lo); i < e.length - 1 && e[i].t <= to; i++) {
    const a = e[i - 1].m, b = e[i].m, c = e[i + 1].m;
    if (b > a && b >= c) out.push({ t: e[i].t, type: "High", m: b });
    else if (b < a && b <= c) out.push({ t: e[i].t, type: "Low", m: b });
  }
  return out;
}

/** Height now and whether the tide is rising or falling (smooth curve between the published turns). */
export function tideNow(st: Station, at: number) {
  const e = st.ev;
  let lo = 0, hi = e.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (e[mid].t <= at) lo = mid + 1; else hi = mid; }
  if (lo === 0 || lo >= e.length) return null;
  const a = e[lo - 1], b = e[lo];
  const f = (at - a.t) / (b.t - a.t);
  const m = a.m + (b.m - a.m) * (1 - Math.cos(Math.PI * f)) / 2;
  return { m, rising: b.m > a.m, frac: f, prev: a, next: b };
}

/** Plain-English state: "Rising – high at 3:12 pm". */
export function tideStateText(st: Station, at: number, tz: string) {
  const n = tideNow(st, at); if (!n) return null;
  const ev = eventsBetween(st, at, at + 14 * 3600000)[0];
  return { rising: n.rising, m: n.m, next: ev, text: ev ? `${n.rising ? "Rising" : "Falling"} – ${ev.type.toLowerCase()} tide at ${clock(ev.t, tz)}` : n.rising ? "Rising" : "Falling" };
}

const CLK = new Map<string, Intl.DateTimeFormat>();
export const clock = (t: number, tz: string) => (CLK.get(tz) ?? (CLK.set(tz, new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz })), CLK.get(tz)!)).format(t).replace(" am", " am").replace(" pm", " pm");
export const dayKey = (t: number, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(t);

/** Tide range over a typical day at this station – small ranges (like Williamstown) mean weak tide effects. */
export const rangeNote = (st: Station) => {
  const ev = st.ev.slice(0, 400).map((x) => x.m); return Math.max(...ev) - Math.min(...ev);
};
