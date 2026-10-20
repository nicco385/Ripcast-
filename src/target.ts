// "Target a fish": ranks land-based spots for one species over the next 24 hours, using only data the app
// already has – Open-Meteo wind/gusts/waves per spot, the bundled BOM tide tables, sun times and the moon.
// The preferences below restate what our species guides already say (VFA Go Fishing pages, FishingMad,
// Compleat Angler, Pelican's Pick) plus widely shared angler knowledge, labelled as such. Points are coarse on
// purpose: the app shows words ("Good", "Poor") and reasons, never a fake-precise number.
import * as SunCalc from "suncalc";
import { GUIDES } from "./data/guides";
import { SPECIES } from "./data/species";
import { type LandSpot, type Raw, LAND, seasonVal, diff, c8, WINDNAME, km } from "./where";
import { solunar, nearNewFull, fmt, type Period } from "./astro";
import { nearestStation, eventsBetween, clock, type Station } from "./tides";

const TZ = "Australia/Melbourne", H = 3600000;
type WindPref = "calm" | "mid" | "stir";
type TidePref = "high" | "rising" | "change";
export type Profile = {
  slug: string; name: string; wind: WindPref; clear?: boolean;
  /** points for daylight, dawn/dusk (±75 min of sunrise/sunset) and night */
  light: { day: number; dd: number; night: number }; nightPier?: boolean;
  tide: TidePref[]; moonBig?: boolean; afterRain?: boolean;
  tip: string; why: string;
};
// Species that have at least two land-based spots in the app.
export const PROFILES: Profile[] = [
  { slug: "snapper", name: "Snapper", wind: "stir", light: { day: -2, dd: 12, night: 10 }, tide: ["high", "change"],
    tip: "Running sinker rig, 4/0–6/0 circle hook, fresh pilchard, squid or silver whiting. A little berley helps.",
    why: "VFA: morning or late afternoon, a few hours either side of high tide. Anglers report windy days help from the shore (snapper move into the shallows when it is rough), and evenings and after dark suit bigger fish." },
  { slug: "king-george-whiting", name: "King George whiting", wind: "calm", light: { day: 5, dd: 10, night: 2 }, tide: ["high"],
    tip: "Light paternoster or small running sinker, size 4–6 hook, fresh pipi or bass yabby. Cast to sand patches between weed.",
    why: "VFA: morning or late afternoon, a few hours either side of high tide, onto sand patches between weed. Light gear and calm water make the light bites easier to feel." },
  { slug: "calamari", name: "Squid (calamari)", wind: "calm", clear: true, light: { day: 4, dd: 10, night: 0 }, nightPier: true, tide: ["rising"],
    tip: "Size 2.5–3.5 prawn-style jig. Cast, let it sink, then lift and let it fall. Clear water; pier lights at night.",
    why: "VFA: day or night under pier lights; the run-in (rising) tide is best. Squid hunt by sight, so clear water matters – strong onshore wind and heavy rain cloud the water." },
  { slug: "garfish", name: "Garfish", wind: "calm", clear: true, light: { day: 10, dd: 5, night: -12 }, tide: ["rising"],
    tip: "Small float with a split-shot, size 10–12 long-shank hook, tiny bits of pipi, prawn or maggot. Keep a steady berley trail.",
    why: "VFA: any time of day on the run-in (rising) tide, with a float rig. Berley is often the difference (Compleat Angler). Garfish feed near the surface, so calm, clear water and light winds suit them and make the float easy to watch." },
  { slug: "australian-salmon", name: "Australian salmon", wind: "stir", light: { day: 4, dd: 12, night: -8 }, tide: ["high"],
    tip: "Metal slug cast out and wound back fast, or a paternoster with pilchard or whitebait. Watch for diving birds.",
    why: "VFA: morning or late afternoon, a few hours either side of high tide. Salmon are active fish that don't mind a bit of breeze and chop." },
  { slug: "sand-flathead", name: "Sand flathead", wind: "mid", light: { day: 8, dd: 6, night: -6 }, tide: ["high"],
    tip: "Paternoster rig or a soft plastic dragged slowly over sand. Pilchard, whitebait, prawn or squid on a 2/0–4/0 hook.",
    why: "VFA: can be caught through the day, a few hours either side of high tide, over sand." },
  { slug: "black-bream", name: "Black bream", wind: "calm", light: { day: 2, dd: 10, night: 6 }, tide: ["high"],
    tip: "Light gear, small ball sinker, size 2–6 hook. Bass yabby, prawn, sandworm or scrub worm close to structure.",
    why: "VFA: morning or late afternoon, a few hours either side of high tide. Bream are shy, so quiet, calmer conditions and light line help." },
  { slug: "silver-trevally", name: "Silver trevally", wind: "mid", light: { day: 5, dd: 8, night: 0 }, tide: ["high"],
    tip: "Float or paternoster close to the pylons, size 2–2/0 hook, pipi, pilchard or squid. A little berley brings them up.",
    why: "VFA: morning or late afternoon, a few hours either side of high tide, close to pylons and structure." },
  { slug: "mulloway", name: "Mulloway", wind: "stir", light: { day: -6, dd: 10, night: 12 }, tide: ["change"], afterRain: true,
    tip: "Running sinker rig, 6/0–8/0 hook, big fresh bait (squid, fish fillet). Be patient – they are a rare catch.",
    why: "No VFA season. Local anglers report most mulloway at night, on tide changes and after rain (FishingMad). A rough guide only." },
  { slug: "estuary-perch", name: "Estuary perch", wind: "calm", light: { day: 0, dd: 12, night: 6 }, tide: ["change"],
    tip: "Small soft plastic or shallow lure cast to timber and rock edges, or a prawn or yabby on a size 2–6 hook.",
    why: "FishingMad: perch are more active in the warmer months and the best surface bites come on warm, calm evenings. No official season." },
  { slug: "gummy-shark", name: "Gummy shark", wind: "stir", light: { day: -10, dd: 6, night: 14 }, tide: ["rising"], moonBig: true,
    tip: "Running sinker or paternoster, strong trace, 6/0–8/0 circle hook, fresh oily bait (salmon, pilchard, squid).",
    why: "VFA: night, around the full and new moon, on a rising tide." },
  { slug: "leatherjacket", name: "Leatherjacket", wind: "mid", light: { day: 6, dd: 4, night: -4 }, tide: [],
    tip: "Small long-shank hook (size 6–8), small bits of pipi or squid, close to the pier pylons.",
    why: "VFA: any time of day; tide is not important." },
  { slug: "redfin", name: "Redfin", wind: "calm", light: { day: 4, dd: 8, night: -4 }, tide: [],
    tip: "Small soft plastics, blades or spinners near snags, or a worm on a light running sinker. Don't release them – they're a pest.",
    why: "Anytime; dawn and dusk are good (FishingMad). Freshwater – no tides." },
];
export const profile = (slug: string) => PROFILES.find((p) => p.slug === slug);
export const spotsFor = (slug: string) => LAND.filter((s) => s.species.includes(slug));

export type Factor = { pts: number; txt: string; kind: "wind" | "wave" | "light" | "tide" | "moon" | "season" | "spot" | "rain" };
export type Wx = Record<string, Raw> | null;
export type SpotPlan = {
  spot: LandSpot; score: number; verdict: Verdict; from: number; to: number; peak: number; factors: Factor[];
  avoid: boolean; dist: number | null; windTxt: string | null; tideTxt: string | null;
};
export type Verdict = "Great" | "Good" | "Fair" | "Poor";
export type Plan = { profile: Profile; verdict: Verdict; headline: string; spots: SpotPlan[]; notes: string[]; noWind: boolean; from: number; to: number };
export const verdictOf = (s: number): Verdict => s >= 85 ? "Great" : s >= 65 ? "Good" : s >= 50 ? "Fair" : "Poor";

// moon events hardly change across Melbourne (a few minutes), so one set per day for the whole region
const solCache = new Map<string, Period[]>();
const periodsFor = (day: string) => { let p = solCache.get(day); if (!p) { p = solunar(day, TZ, -38.0, 144.95); solCache.set(day, p); } return p; };
const sunCache = new Map<string, { sr: number; ss: number }>();
const sunFor = (day: string) => { let s = sunCache.get(day); if (!s) { const t = SunCalc.getTimes(new Date(day + "T02:00:00Z"), -38.0, 144.95); s = { sr: t.sunrise!.getTime(), ss: t.sunset!.getTime() }; sunCache.set(day, s); } return s; };
const keyOf = (t: number) => fmt(t, TZ).slice(0, 13) + ":00";
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function relWind(s: LandSpot, dir: number) {
  if (s.info?.noWind) return "unknown" as const;
  if (s.facing == null || s.shelteredFrom.includes(c8(dir) as never)) return "sheltered" as const;
  const d = diff(dir, s.facing); return d <= 50 ? "onshore" as const : d >= 125 ? "offshore" as const : "cross" as const;
}

function windFactor(p: Profile, s: LandSpot, w: number, dir: number, prevMaxOn: number): Factor[] {
  const rel = relWind(s, dir), wn = WINDNAME[c8(dir)], kn = `${Math.round(w)} kn`, shel = rel === "sheltered" || rel === "offshore";
  const f = (pts: number, txt: string): Factor => ({ pts, txt, kind: "wind" });
  const out: Factor[] = [];
  if (p.wind === "stir") {
    if (w >= 25) out.push(f(shel ? -12 : -24, `${cap(wn)} ${kn} – too windy to fish comfortably or safely`));
    else if (w >= 20) out.push(f(shel ? 2 : rel === "onshore" ? -6 : -6, shel ? `Sheltered from a strong ${wn} (${kn})` : `Strong ${wn} (${kn}) – rough and hard to fish`));
    else if (w >= 10) out.push(rel === "onshore" ? f(16, `${cap(wn)} (${kn}) blowing in, stirring up the water`) : shel ? f(6, `Sheltered from the ${wn} (${kn})`) : f(4, `${cap(wn)} cross-wind (${kn})`));
    else if (w >= 6) out.push(rel === "onshore" ? f(10, `Light ${wn} blowing in (${kn})`) : f(6, `Light ${wn} (${kn})`));
    else out.push(f(0, `Calm (${kn}) – fine, though a bit of breeze often helps`));
    if (prevMaxOn >= 15 && w < 20 && !(rel === "onshore" && w >= 10)) out.push(f(8, "After a blow – the water should still be stirred up"));
  } else {
    const k = p.wind === "calm" ? 1 : 0.6;
    if (w < 6) out.push(f(p.wind === "calm" ? 18 : 12, `Light winds (${kn}) – calm water`));
    else if (w < 10) out.push(shel ? f(14 * k + (1 - k) * 10, `Sheltered from the light ${wn}`) : rel === "onshore" ? f(Math.round(2 * k + 6 * (1 - k)), `Light ${wn} blowing in (${kn})`) : f(8, `Light ${wn} (${kn})`));
    else if (w < 15) out.push(shel ? f(8, `Sheltered from the ${wn} (${kn})`) : rel === "onshore" ? f(Math.round(-16 * k), `${cap(wn)} ${kn} blowing in – choppy${p.clear ? ", dirty" : ""} water`) : f(Math.round(-8 * k), `${cap(wn)} cross-wind (${kn})`));
    else if (w < 20) out.push(shel ? f(0, `Sheltered, but a fresh ${wn} (${kn})`) : rel === "onshore" ? f(Math.round(-26 * k), `Fresh ${wn} (${kn}) blowing in – too rough`) : f(Math.round(-18 * k), `Fresh ${wn} (${kn}) – too windy`));
    else out.push(shel ? f(Math.round(-10 * k), `Sheltered from the ${wn}, but still strong (${kn})`) : f(Math.round(-32 * k), `Strong ${wn} (${kn}) – too windy`));
  }
  return out;
}

const lightOf = (t: number) => {
  const day = fmt(t, TZ).slice(0, 10), { sr, ss } = sunFor(day);
  if (Math.abs(t - sr) <= 75 * 60000) return { k: "dd" as const, txt: "Around sunrise" };
  if (Math.abs(t - ss) <= 75 * 60000) return { k: "dd" as const, txt: "Around sunset" };
  return t > sr && t < ss ? { k: "day" as const, txt: "Daylight" } : { k: "night" as const, txt: "After dark" };
};

/** Score one spot at one hour (t = start of the hour). */
export function scoreHour(p: Profile, s: LandSpot, r: Raw | undefined, t: number, extra: { rain24?: number | null } = {}) {
  const mid = t + H / 2, fs: Factor[] = []; let avoid = false, ceil = 100;
  // season (month-level, VFA peak tables)
  const g = GUIDES.find((x) => x.slug === p.slug)!, m = Number(fmt(t, TZ).slice(5, 7)), sv = seasonVal(p.slug, m);
  if (sv === 3) fs.push({ pts: 12, txt: "Main run season", kind: "season" });
  else if (sv === 2) fs.push({ pts: 8, txt: "In season (VFA)", kind: "season" });
  else if (sv === 0 && g.best.length) fs.push({ pts: -18, txt: "Out of its main season", kind: "season" });
  if (s.info?.hot?.includes(p.slug)) fs.push({ pts: 6, txt: "VFA hot spot", kind: "spot" });
  // wind and waves
  let windTxt: string | null = null;
  if (r) {
    const i = r.t.indexOf(keyOf(t));
    if (i >= 0 && r.wind[i] != null) {
      const w = r.wind[i], dir = r.dir[i], gust = r.gust[i] ?? 0;
      let prevMaxOn = 0;
      for (let k = Math.max(0, i - 18); k < i; k++) if (relWind(s, r.dir[k]) === "onshore") prevMaxOn = Math.max(prevMaxOn, r.wind[k]);
      fs.push(...windFactor(p, s, w, dir, prevMaxOn));
      // hard limits: light-line species in a strong wind, anything in a gale, are a poor bet however sheltered
      const relH = relWind(s, dir), shelH = relH === "sheltered" || relH === "offshore";
      if ((p.wind === "calm" && (w >= 20 || (w >= 15 && !shelH))) || (p.wind === "mid" && w >= 22) || w >= 25) ceil = 49;
      if (gust >= 30) fs.push({ pts: -10, txt: `Gusts to ${Math.round(gust)} kn`, kind: "wind" });
      windTxt = `${Math.round(w)} kn from the ${c8(dir)}`;
      const wave = r.wave.length ? r.wave[i] : null, rel = relWind(s, dir);
      if (wave != null && ((s.type === "rocks" && wave >= 1.5 && rel !== "sheltered") || (wave >= 2.5 && rel === "onshore" && s.type !== "estuary"))) { avoid = true; fs.push({ pts: -30, txt: `Big waves (${wave.toFixed(1)} m) – stay off the rocks and edges`, kind: "wave" }); }
      if (p.clear && rel === "onshore" && w >= 15) fs.push({ pts: -6, txt: "Rough water is usually murky – hard for sight feeders", kind: "wind" });
    }
  }
  // time of day
  const L = lightOf(mid);
  let lp = p.light[L.k]; let ltxt = L.txt;
  if (L.k === "night" && p.nightPier && s.kind === "pier") { lp = 8; ltxt = "After dark under the pier lights"; }
  fs.push({ pts: lp, txt: ltxt, kind: "light" });
  const hr = Number(fmt(t, TZ).slice(11, 13));
  if (hr >= 0 && hr < 4 && L.k === "night" && p.light.night < 10) fs.push({ pts: -4, txt: "Very late night", kind: "light" });
  // tide (BOM, nearest station)
  let tideTxt: string | null = null;
  const st: Station | undefined = s.info?.fresh ? undefined : nearestStation(s.lat, s.lon)?.station;
  if (st) {
    const ev = eventsBetween(st, mid - 8 * H, mid + 8 * H);
    const next = ev.find((e) => e.t > mid), prev = [...ev].reverse().find((e) => e.t <= mid);
    const hi = ev.filter((e) => e.type === "High").sort((a, b) => Math.abs(a.t - mid) - Math.abs(b.t - mid))[0];
    const near = ev.sort((a, b) => Math.abs(a.t - mid) - Math.abs(b.t - mid))[0];
    if (next) tideTxt = `${next.type === "High" ? "rising" : "falling"} – ${next.type.toLowerCase()} ${clock(next.t, TZ)}`;
    let tp = 0, tt = "";
    if (p.tide.includes("high") && hi && Math.abs(hi.t - mid) <= 3 * H) { tp = 8; tt = `Within 3 h of high tide (${clock(hi.t, TZ)})`; }
    if (p.tide.includes("rising") && next?.type === "High" && 7 > tp) { tp = 7; tt = `Rising tide – high at ${clock(next.t, TZ)}`; }
    if (p.tide.includes("change") && near && Math.abs(near.t - mid) <= 75 * 60000 && 6 > tp) { tp = 6; tt = `Tide change (${near.type.toLowerCase()} ${clock(near.t, TZ)})`; }
    if (!tp && p.tide.length && prev && next) { tp = -2; tt = p.tide.includes("rising") ? "Falling tide" : "Away from high tide"; }
    if (tt) fs.push({ pts: tp, txt: tt, kind: "tide" });
  }
  // moon
  const day = fmt(mid, TZ).slice(0, 10), per = periodsFor(day).find((q) => q.t0 < t + H && q.t1 > t);
  if (per) fs.push({ pts: per.rating * 2, txt: `${per.kind === "major" ? "Major" : "Minor"} solunar feeding time (traditional theory)`, kind: "moon" });
  if (p.moonBig && nearNewFull(mid)) fs.push({ pts: 8, txt: "Near the new or full moon", kind: "moon" });
  if (p.afterRain && extra.rain24 != null && extra.rain24 >= 5) fs.push({ pts: 6, txt: `After rain (${Math.round(extra.rain24)} mm in the last day)`, kind: "rain" });
  if (p.clear && extra.rain24 != null && extra.rain24 >= 10 && (s.type === "estuary" || s.type === "river")) fs.push({ pts: -6, txt: "Heavy rain – river water likely dirty", kind: "rain" });
  let score = 35 + fs.reduce((a, f) => a + f.pts, 0);
  if (avoid) score = Math.min(score, 25);
  score = Math.min(score, ceil);
  return { score: Math.max(0, Math.min(100, Math.round(score))), factors: fs, avoid, windTxt, tideTxt };
}

const periodWord = (t: number, now: number) => {
  const d = fmt(t, TZ), today = fmt(now, TZ).slice(0, 10), h = Number(d.slice(11, 13)), tom = d.slice(0, 10) > today;
  if (h >= 20 || h < 4) return tom && h >= 4 ? "tomorrow night" : "tonight";
  if (h < 11) return tom ? "tomorrow morning" : "this morning";
  if (h < 16) return tom ? "tomorrow afternoon" : "this afternoon";
  return tom ? "tomorrow evening" : "this evening";
};
export const spanTxt = (a: number, b: number) => { const x = clock(a, TZ), y = clock(b, TZ); return x.slice(-2) === y.slice(-2) ? `${x.replace(/:00| am| pm/g, "")}–${y.replace(":00", "")}` : `${x.replace(":00", "")}–${y.replace(":00", "")}`; };
const joinAnd = (a: string[]) => a.length <= 1 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;

/** Rank spots for one species between `from` and `to` (default: the next 24 hours). */
export function planSpecies(slug: string, wx: Wx, o: { now?: number; from?: number; to?: number; origin?: { lat: number; lon: number } | null; maxKm?: number; rain24?: number | null } = {}): Plan | null {
  const p = profile(slug); if (!p) return null;
  const now = o.now ?? Date.now(), from = Math.floor((o.from ?? now) / H) * H, to = o.to ?? from + 24 * H;
  let spots = spotsFor(slug);
  if (o.origin && o.maxKm) { const near = spots.filter((s) => km(o.origin!, s) <= o.maxKm!); if (near.length) spots = near; }
  const noWind = !wx;
  const plans: SpotPlan[] = spots.map((s) => {
    const r = wx?.[s.id];
    const hrs: { t: number; v: ReturnType<typeof scoreHour> }[] = [];
    for (let t = from; t < to; t += H) hrs.push({ t, v: scoreHour(p, s, r, t, { rain24: o.rain24 }) });
    let bi = 0; hrs.forEach((h, i) => { if (h.v.score > hrs[bi].v.score) bi = i; });
    const best = hrs[bi].v.score; let a = bi, b = bi;
    while (a > 0 && b - a < 3 && hrs[a - 1].v.score >= best - 4) a--;
    while (b < hrs.length - 1 && b - a < 3 && hrs[b + 1].v.score >= best - 4) b++;
    const v = hrs[bi].v;
    return { spot: s, score: best, verdict: verdictOf(best), from: hrs[a].t, to: hrs[b].t + H, peak: hrs[bi].t, factors: v.factors, avoid: v.avoid, dist: o.origin ? km(o.origin, s) : null, windTxt: v.windTxt, tideTxt: v.tideTxt };
  }).sort((x, y) => y.score - x.score || (x.dist ?? 0) - (y.dist ?? 0));
  if (!plans.length) return null;
  const top = plans[0]; let verdict = top.verdict;
  if (noWind && (verdict === "Great" || verdict === "Good")) verdict = "Fair";
  const when = periodWord(top.peak, now), name = p.name.replace(" (calamari)", "").toLowerCase().replace("king george", "King George").replace("australian", "Australian");
  const cond = (pl: SpotPlan, sign: 1 | -1) => pl.factors.filter((f) => f.kind !== "season" && f.kind !== "spot" && Math.sign(f.pts) === sign).sort((x, y) => sign * (y.pts - x.pts))[0];
  const goodF = cond(top, 1), badF = cond(top, -1);
  const good2 = top.factors.filter((f) => f.kind !== "season" && f.kind !== "spot" && f.pts >= 6).sort((x, y) => y.pts - x.pts).slice(0, 2);
  const names = plans.filter((x) => x.verdict === top.verdict || x.score >= top.score - 8).slice(0, 3).map((x) => x.spot.name);
  const lower = (s?: Factor) => s ? (s.txt[0].toLowerCase() + s.txt.slice(1)).replace(/ – /g, ", ") : "";
  const windMed = (() => { const w = plans.map((x) => x.factors.filter((f) => f.kind === "wind" && f.pts < -10).length).filter(Boolean).length; return w / plans.length; })();
  const season = top.factors.find((f) => f.kind === "season" && f.pts < 0);
  let headline: string;
  if (verdict === "Great" || verdict === "Good") headline = `${verdict} ${when} to target ${name} – ${good2.map((f) => lower(f).replace(/^around sun/, "change of light around sun")).join(", ") || lower(goodF) || "conditions suit them"}. Best at ${joinAnd(names)}.`;
  else if (verdict === "Fair") headline = `Fair ${when} for ${name}${season ? " – out of its main season" : noWind ? " – no wind forecast, so check before you go" : badF ? ` – ${lower(badF)}` : goodF ? ` – ${lower(goodF)}` : ""}. Best bet: ${top.spot.name}, ${spanTxt(top.from, top.to)}.`;
  else {
    const why = season ? "it's out of its main season" : windMed >= 0.6 ? "too windy at most spots" : lower(badF) || "conditions don't suit them";
    const shel = top.factors.some((f) => /^Sheltered/.test(f.txt));
    headline = top.score < 35 || (windMed >= 0.6 && top.factors.some((f) => f.kind === "wind" && f.pts <= -12)) ? `Poor ${when} for ${name} – ${why}. Best to wait for a better day.` : `Poor ${when} for ${name} – ${why}. ${shel ? `If you go, try sheltered ${top.spot.name}` : `Least-bad option: ${top.spot.name}`} (${spanTxt(top.from, top.to)}).`;
  }
  const notes: string[] = [];
  if (noWind) notes.push("No wind forecast right now (offline or the weather service is down), so this uses only the tide, time of day, moon and season. Check the wind before you go.");
  if (season) notes.push(`${p.name} are out of their main season this month (${GUIDES.find((g) => g.slug === slug)!.seasonText.replace(/\.$/, "")}).`);
  return { profile: p, verdict, headline, spots: plans, notes, noWind, from, to };
}

/** Rain in the last 24 h from the cached Today forecast, when it is for a Melbourne-area place. */
export function rainLast24(f: { hours: { time: string; rain: number }[]; place: { lat: number; lon: number } } | null, now = Date.now()) {
  if (!f || Math.abs(f.place.lat + 38) > 1 || Math.abs(f.place.lon - 145) > 1.2) return null;
  const end = keyOf(now), start = keyOf(now - 24 * H);
  const h = f.hours.filter((x) => x.time > start && x.time <= end); return h.length >= 12 ? h.reduce((a, x) => a + (x.rain ?? 0), 0) : null;
}

/** Best targets for a session window (e.g. tonight): one line per species, best first. */
export function bestTargets(wx: Wx, from: number, to: number, o: { now?: number; rain24?: number | null; n?: number } = {}) {
  return PROFILES.filter((p) => spotsFor(p.slug).length >= 2)
    .map((p) => planSpecies(p.slug, wx, { now: o.now, from, to, rain24: o.rain24 })!).filter(Boolean)
    .filter((pl) => !pl.notes.some((n) => n.includes("out of their main season")))
    .sort((a, b) => b.spots[0].score - a.spots[0].score).slice(0, o.n ?? 3);
}
/** The evening session if it is still ahead, otherwise tomorrow morning. */
export function sessionWindow(now = Date.now()) {
  const today = fmt(now, TZ).slice(0, 10), { ss } = sunFor(today);
  if (now < ss + 3 * H) return { label: "Tonight", from: Math.max(now, ss - 2 * H), to: ss + 4 * H };
  const tm = fmt(now + 12 * H, TZ).slice(0, 10), { sr } = sunFor(tm);
  return { label: "Tomorrow morning", from: Math.max(now, sr - 2 * H), to: sr + 4 * H };
}
export const speciesName = (slug: string) => SPECIES.find((s) => s.slug === slug)?.name ?? slug;
