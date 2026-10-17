import * as SunCalc from "suncalc";
import { SPOTS, type Spot } from "./data/spots";
import { GUIDES } from "./data/guides";
import { j, compass, fmtLocal, marineTrust, solunar } from "./lib";
import { nearestStation, eventsBetween, clock } from "./tides";

export type SpotType = "pier" | "beach" | "rocks" | "estuary" | "lake" | "river";
const TZ = "Australia/Melbourne";
// Land-based type for each spot (boat-only marks and sanctuaries are left out).
const TYPE: Record<string, SpotType> = {
  "safety-beach": "beach", "werribee-jetties": "beach", "werribee-south": "beach", "altona-ramp": "beach",
  "warmies-wall": "rocks", "newport-warmies": "rocks", "schnapper-point": "rocks",
  "patterson-shore": "estuary", "patterson-river": "estuary", "yarra-docklands": "estuary", "yarra-southbank": "estuary",
  "yarra-herring": "estuary", "maribyrnong-footscray": "estuary", "maribyrnong-anglers": "estuary", "maribyrnong-ramp": "estuary",
  "martha-cove": "estuary", "albert-park-lake": "lake", "yarra-bend": "river",
};
const DEG: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
const isLand = (s: Spot) => !s.noTake && (s.kind === "pier" || s.kind === "shore");
/** Every land-based place, including temporarily closed ones. */
export const ALL_LAND = SPOTS.filter(isLand).map((s) => ({
  ...s, type: (TYPE[s.id] ?? (s.kind === "pier" ? "pier" : "beach")) as SpotType,
  // direction the shore looks out to (the water side) = middle of its exposed directions
  facing: s.exposedTo.length ? (Math.atan2(s.exposedTo.reduce((a, d) => a + Math.sin(DEG[d] * Math.PI / 180), 0), s.exposedTo.reduce((a, d) => a + Math.cos(DEG[d] * Math.PI / 180), 0)) * 180 / Math.PI + 360) % 360 : null as number | null,
}));
export type LandSpot = (typeof ALL_LAND)[number];
/** Places that can be ranked (not closed). */
export const LAND = ALL_LAND.filter((s) => !s.info?.status?.closed);

type Raw = { t: string[]; wind: number[]; gust: number[]; dir: number[]; wave: (number | null)[] };
const CK = "rc-where-v3";
export async function getSpotWeather(): Promise<{ at: number; data: Record<string, Raw>; stale?: boolean }> {
  let c: { at: number; data: Record<string, Raw> } | null = null;
  try { c = JSON.parse(localStorage.getItem(CK) || "null"); } catch { /* ignore */ }
  if (c && Date.now() - c.at < 30 * 60000) return c;
  try { return await fetchSpots(); }
  catch (e) { if (c && Date.now() - c.at < 6 * 3600000) return { ...c, stale: true }; throw e; }
}
async function fetchSpots(): Promise<{ at: number; data: Record<string, Raw> }> {
  const data: Record<string, Raw> = {};
  for (let i = 0; i < LAND.length; i += 25) {
    const b = LAND.slice(i, i + 25);
    const la = b.map((s) => s.lat).join(","), lo = b.map((s) => s.lon).join(",");
    const w = j(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=${TZ}&forecast_days=2`);
    const m = j(`https://marine-api.open-meteo.com/v1/marine?latitude=${la}&longitude=${lo}&hourly=wave_height&timezone=${TZ}&forecast_days=2`, 2, 12000).catch(() => null);
    const [wd, md] = await Promise.all([w, m]);
    const W = Array.isArray(wd) ? wd : [wd]; const M = md ? (Array.isArray(md) ? md : [md]) : [];
    b.forEach((s, k) => {
      const h = W[k].hourly, mh = M[k]?.hourly; const tr = marineTrust(s.lat, s.lon, M[k]?.latitude, M[k]?.longitude);
      data[s.id] = { t: h.time, wind: h.wind_speed_10m, gust: h.wind_gusts_10m, dir: h.wind_direction_10m, wave: tr.waves && !s.info?.fresh ? mh?.wave_height ?? [] : [] };
    });
  }
  const out = { at: Date.now(), data };
  try { localStorage.setItem(CK, JSON.stringify(out)); } catch { /* full */ }
  return out;
}

const diff = (a: number, b: number) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };
const WINDNAME: Record<string, string> = { N: "northerly", NE: "north-easterly", E: "easterly", SE: "south-easterly", S: "southerly", SW: "south-westerly", W: "westerly", NW: "north-westerly" };
const c8 = (d: number) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((d % 360) + 360) % 360 / 45) % 8];
const SHORT: Record<string, string> = { "king-george-whiting": "whiting", calamari: "squid", "australian-salmon": "salmon", "sand-flathead": "flathead", "black-bream": "bream", "silver-trevally": "trevally", "yellowtail-kingfish": "kingfish", "gummy-shark": "gummy shark", "elephant-fish": "elephant fish", "estuary-perch": "estuary perch" };
export const short = (s: string) => SHORT[s] ?? s.replace(/-/g, " ");

/** 0 = out of season, 1 = year-round / quieter, 2 = in season, 3 = the main run. Source: VFA peak-season tables (see data/guides.ts). */
export const seasonVal = (slug: string, m: number) => {
  const g = GUIDES.find((x) => x.slug === slug); if (!g) return 0;
  return g.run?.includes(m) ? 3 : g.best.includes(m) ? 2 : g.yearRound ? 1 : 0;
};

export type Rank = {
  spot: LandSpot; score: number; badge: "Good" | "OK" | "Poor"; reason: string; best: string; target: string[]; targetSlugs: string[];
  avoid: boolean; wind: number; gust: number; dirTxt: string; wave: number | null; hot: string[]; stationName: string | null;
};

export function rankSpot(s: LandSpot, r: Raw, mode: "now" | "today"): Rank {
  const now = fmtLocal(new Date(), TZ).slice(0, 13) + ":00";
  const today = now.slice(0, 10);
  const sun = SunCalc.getTimes(new Date(today + "T12:00:00+11:00"), s.lat, s.lon);
  const sr = fmtLocal(sun.sunrise!, TZ), ss = fmtLocal(sun.sunset!, TZ);
  let idx = r.t.map((t, i) => [t, i] as const).filter(([t]) => mode === "now" ? t === now : t.startsWith(today) && t >= sr.slice(0, 13) && t <= ss).map(([, i]) => i);
  if (!idx.length) idx = [Math.max(0, r.t.indexOf(now))];
  const wind = idx.reduce((a, i) => a + (r.wind[i] ?? 0), 0) / idx.length, gust = Math.max(...idx.map((i) => r.gust[i] ?? 0));
  const sx = idx.reduce((a, i) => a + Math.sin(r.dir[i] * Math.PI / 180), 0), cx = idx.reduce((a, i) => a + Math.cos(r.dir[i] * Math.PI / 180), 0);
  const dir = (Math.atan2(sx, cx) * 180 / Math.PI + 360) % 360;
  const wave = r.wave.length ? Math.max(...idx.map((i) => r.wave[i] ?? 0)) : null;
  const wn = WINDNAME[c8(dir)];
  const unknown = !!s.info?.noWind;
  const sheltered = !unknown && (s.facing == null || s.shelteredFrom.includes(c8(dir) as never));
  const rel = unknown ? "cross" : s.facing == null ? "sheltered" : diff(dir, s.facing) <= 50 ? "onshore" : diff(dir, s.facing) >= 125 ? "offshore" : "cross";
  let sc = 55; const bits: string[] = [];
  const light = wind < 8;
  if (light) { sc += 12; bits.push("Light winds"); }
  else if (unknown) { sc -= wind >= 20 ? 12 : 0; bits.push(`${wn[0].toUpperCase() + wn.slice(1)} ${Math.round(wind)} kn (check shelter on site)`); }
  else if (sheltered || rel === "offshore") { sc += wind < 18 ? 10 : 0; bits.push(`Sheltered from the ${wn}`); }
  else if (rel === "onshore") { sc -= wind >= 15 ? 22 : 6; bits.push(wind >= 15 ? `Blown straight in by the ${wn}` : `Light ${wn} blowing in`); }
  else { sc -= wind >= 15 ? 10 : 2; bits.push(`Cross-wind from the ${wn}`); }
  if (wind >= 20) sc -= 15;
  if (gust >= 30) { sc -= 12; bits.push(`gusts to ${Math.round(gust)} kn`); }
  const avoid = s.type === "rocks" && (wave ?? 0) >= 1.5 && !sheltered || (wave ?? 0) >= 2.5 && rel === "onshore" && s.type !== "estuary";
  if (avoid) { sc = Math.min(sc, 25); bits.push("big waves – stay off the rocks/edge"); }
  const m = Number(today.slice(5, 7));
  const hotSet = new Set(s.info?.hot ?? []);
  const tgt = [...new Set(s.species)].map((x) => ({ x, v: seasonVal(x, m), hot: hotSet.has(x) })).filter((o) => o.v >= 2 || (o.v === 1 && o.hot))
    .sort((a, b) => (b.v + (b.hot ? 1 : 0)) - (a.v + (a.hot ? 1 : 0))).slice(0, 3);
  // fish season matters about as much as wind: in-season species and VFA hot spots lift a spot
  sc += Math.min(20, tgt.reduce((a, o) => a + o.v * 2 + (o.hot ? 3 : 0), 0));
  if (!tgt.length) sc -= 6;
  if (rel === "onshore" && wind >= 8 && wind < 15 && tgt.some((o) => o.x === "snapper" || o.x === "australian-salmon")) sc += 4;
  sc = Math.max(0, Math.min(100, Math.round(sc)));
  const target = tgt.map((o) => short(o.x));
  const hot = tgt.filter((o) => o.hot).map((o) => short(o.x));
  const run = tgt.filter((o) => seasonVal(o.x, m) === 3).map((o) => short(o.x));
  const why = run.length ? `${run[0]} run season` : target.length ? `${target.slice(0, 2).join(" and ")} in season` : "quiet month for the usual fish";
  const reason = `${bits.join(", ")} · ${why}`;
  const st = s.info?.fresh ? null : nearestStation(s.lat, s.lon);
  return { spot: s, score: sc, badge: avoid ? "Poor" : sc >= 70 ? "Good" : sc >= 50 ? "OK" : "Poor", reason, best: bestTime(s, st?.station, sun.sunrise!, sun.sunset!, today, ss), target, targetSlugs: tgt.map((o) => o.x), avoid, wind, gust, dirTxt: compass(dir), wave, hot, stationName: st ? st.station.name : null };
}

function bestTime(s: LandSpot, st: ReturnType<typeof nearestStation> extends infer R ? (R extends { station: infer S } ? S : never) | undefined : never, sunrise: Date, sunset: Date, today: string, ssLocal: string) {
  const lt = (d: Date) => clock(d.getTime(), TZ);
  if (st) {
    const hi = eventsBetween(st, sunrise.getTime() - 3 * 3600000, sunset.getTime() + 3 * 3600000).filter((e) => e.type === "High");
    // VFA: a few hours either side of high tide, around dawn or dusk
    let best: { k: string; at: Date; hi: { t: number } ; gap: number } | null = null;
    for (const [k, at] of [["Dawn", sunrise], ["Dusk", sunset]] as const) for (const h of hi) { const g = Math.abs(h.t - at.getTime()); if (!best || g < best.gap) best = { k, at, hi: h, gap: g }; }
    if (best && best.gap <= 3 * 3600000) return `${best.k} (${lt(best.at)}) – high tide ${clock(best.hi.t, TZ)} at ${st.name.replace(/ \(.*\)/, "")}`;
    if (hi.length) return `Around high tide, ${clock(hi[0].t, TZ)} (${st.name.replace(/ \(.*\)/, "")}), or dusk (${lt(sunset)})`;
  }
  const maj = solunar(today, TZ, s.lat, s.lon).find((p) => p.kind === "major" && p.mid.startsWith(today));
  void ssLocal;
  return maj ? `Dusk (${lt(sunset)}) or the moon's feeding time` : `Dawn (${lt(sunrise)}) or dusk (${lt(sunset)})`;
}

export const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
export type { Spot };
