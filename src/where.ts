import { SPOTS, type Spot } from "./data/spots";
import { GUIDES } from "./data/guides";
import { j, marineTrust } from "./lib";

export type SpotType = "pier" | "beach" | "rocks" | "estuary" | "lake" | "river";
const TZ = "Australia/Melbourne";
// Land-based type for each spot (boat-only marks and sanctuaries are left out).
const TYPE: Record<string, SpotType> = {
  "safety-beach": "beach", "werribee-jetties": "beach", "werribee-south": "beach", "altona-ramp": "beach",
  "warmies-wall": "rocks", "newport-warmies": "rocks", "schnapper-point": "rocks",
  "patterson-shore": "estuary", "patterson-river": "estuary", "yarra-docklands": "estuary", "yarra-southbank": "estuary",
  "yarra-herring": "estuary", "maribyrnong-footscray": "estuary", "maribyrnong-anglers": "estuary", "maribyrnong-ramp": "estuary",
  "martha-cove": "estuary", "webb-dock-rocks": "rocks", "hampton-groynes": "rocks", "williamstown-rocks": "rocks", "sandringham-breakwater": "rocks", "north-road-rocks-choc": "rocks", "williamstown-beach-rocks-choc": "rocks", "spotswood-bank-choc": "river", "francis-st-lookout-choc": "river", "albert-park-lake": "lake", "yarra-bend": "river", "st-helens": "rocks",
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

export type Raw = { t: string[]; wind: number[]; gust: number[]; dir: number[]; wave: (number | null)[]; rain?: number[]; pop?: number[] };
const CK = "rc-where-v5";
type SpotWx = { at: number; data: Record<string, Raw>; stale?: boolean };
/** Last saved spot forecast (up to 12 h old) for an instant first paint; null if none. */
export function peekSpotWeather(): SpotWx | null {
  try { const c = JSON.parse(localStorage.getItem(CK) || "null"); if (c && Date.now() - c.at < 12 * 3600000) return { ...c, stale: Date.now() - c.at > 30 * 60000 }; } catch { /* ignore */ }
  return null;
}
let inflight: Promise<SpotWx> | null = null;
export async function getSpotWeather(): Promise<SpotWx> {
  let c: SpotWx | null = null;
  try { c = JSON.parse(localStorage.getItem(CK) || "null"); } catch { /* ignore */ }
  if (c && Date.now() - c.at < 30 * 60000) return c;
  if (!inflight) inflight = fetchSpots().finally(() => { inflight = null; });
  try { return await inflight; }
  catch (e) { if (c && Date.now() - c.at < 12 * 3600000) return { ...c, stale: true }; throw e; }
}
async function fetchSpots(): Promise<{ at: number; data: Record<string, Raw> }> {
  const data: Record<string, Raw> = {};
  for (let i = 0; i < LAND.length; i += 25) {
    const b = LAND.slice(i, i + 25);
    const la = b.map((s) => s.lat).join(","), lo = b.map((s) => s.lon).join(",");
    const w = j(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,precipitation_probability&wind_speed_unit=kn&timezone=${TZ}&forecast_days=7`);
    const m = j(`https://marine-api.open-meteo.com/v1/marine?latitude=${la}&longitude=${lo}&hourly=wave_height&timezone=${TZ}&forecast_days=7`, 2, 12000).catch(() => null);
    const [wd, md] = await Promise.all([w, m]);
    const W = Array.isArray(wd) ? wd : [wd]; const M = md ? (Array.isArray(md) ? md : [md]) : [];
    b.forEach((s, k) => {
      const h = W[k].hourly, mh = M[k]?.hourly; const tr = marineTrust(s.lat, s.lon, M[k]?.latitude, M[k]?.longitude);
      data[s.id] = { t: h.time, wind: h.wind_speed_10m, gust: h.wind_gusts_10m, dir: h.wind_direction_10m, rain: h.precipitation, pop: h.precipitation_probability, wave: tr.waves && !s.info?.fresh ? mh?.wave_height ?? [] : [] };
    });
  }
  const out = { at: Date.now(), data };
  try { localStorage.setItem(CK, JSON.stringify(out)); } catch { /* full */ }
  return out;
}

export const diff = (a: number, b: number) => { const d = Math.abs(((a - b) % 360 + 360) % 360); return d > 180 ? 360 - d : d; };
export const WINDNAME: Record<string, string> = { N: "northerly", NE: "north-easterly", E: "easterly", SE: "south-easterly", S: "southerly", SW: "south-westerly", W: "westerly", NW: "north-westerly" };
export const c8 = (d: number) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(((d % 360) + 360) % 360 / 45) % 8];
const SHORT: Record<string, string> = { "king-george-whiting": "whiting", calamari: "squid", "australian-salmon": "salmon", "sand-flathead": "flathead", "black-bream": "bream", "silver-trevally": "trevally", "yellowtail-kingfish": "kingfish", "gummy-shark": "gummy shark", "elephant-fish": "elephant fish", "estuary-perch": "estuary perch" };
export const short = (s: string) => SHORT[s] ?? s.replace(/-/g, " ");

/** 0 = out of season, 1 = year-round / quieter, 2 = in season, 3 = the main run. Source: VFA peak-season tables (see data/guides.ts). */
export const seasonVal = (slug: string, m: number) => {
  const g = GUIDES.find((x) => x.slug === slug); if (!g) return 0;
  return g.run?.includes(m) ? 3 : g.best.includes(m) ? 2 : g.yearRound ? 1 : 0;
};

/** Fish at this spot that are in season this month (VFA peak tables), best first. Occasional catches are left out. */
export function inSeasonHere(s: LandSpot, m: number) {
  const hot = new Set(s.info?.hot ?? []);
  return [...new Set(s.species)].map((x) => ({ x, v: seasonVal(x, m), hot: hot.has(x) })).filter((o) => (o.v >= 2 || (o.v === 1 && o.hot)) && !s.occ?.includes(o.x))
    .sort((a, b) => (b.v + (b.hot ? 1 : 0)) - (a.v + (a.hot ? 1 : 0))).slice(0, 3);
}

export const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
export type { Spot };
/** The app spot a place IS: chosen with "Show conditions here" (same name) or a map tap within 300 m of it. */
export function spotAt(p: { name: string; lat: number; lon: number }): LandSpot | undefined {
  return ALL_LAND.find((s) => s.name === p.name) ?? ALL_LAND.map((s) => ({ s, d: km(p, s) })).filter((x) => x.d <= 0.3).sort((a, b) => a.d - b.d)[0]?.s;
}
/** "Ferguson Street Pier (Williamstown)" → "Ferguson Street Pier, Williamstown" (no double brackets next to a distance). */
export const spotLabel = (name: string) => name.replace(/\s*\(([^)]+)\)\s*$/, ", $1");
/** "Distance from …" wording that reads well for map taps ("Near Williamstown" → "your map spot near Williamstown"). */
export const fromTxt = (name: string) => /^Near /.test(name) ? `your map spot ${name.replace(/^Near/, "near")}` : /^\d+ km from /.test(name) ? `your map spot (${name})` : name;
/** Offline friendly name for a point on the map: the nearest fishing spot in the app (never raw coordinates). */
export function nearName(p: { lat: number; lon: number }) {
  const n = ALL_LAND.map((s) => ({ s, d: km(p, s) })).sort((a, b) => a.d - b.d)[0];
  if (!n) return "Chosen map spot";
  return n.d < 2 ? `Near ${n.s.name}` : `${Math.round(n.d)} km from ${n.s.name}`;
}
