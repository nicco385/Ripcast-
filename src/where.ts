import * as SunCalc from "suncalc";
import { SPOTS, type Spot } from "./data/spots";
import { compass, fmtLocal, hhmm, solunar } from "./lib";

export type SpotType = "pier" | "beach" | "rocks" | "estuary";
const TZ = "Australia/Melbourne";
// Land-based type for each spot (boat-only marks and sanctuaries are left out).
const TYPE: Record<string, SpotType> = {
  "safety-beach": "beach", "werribee-jetties": "beach", "werribee-south": "beach", "altona-ramp": "beach",
  "warmies-wall": "rocks", "newport-warmies": "rocks", "schnapper-point": "rocks",
  "patterson-shore": "estuary", "patterson-river": "estuary", "yarra-docklands": "estuary", "yarra-southbank": "estuary",
  "yarra-herring": "estuary", "maribyrnong-footscray": "estuary", "maribyrnong-anglers": "estuary", "maribyrnong-ramp": "estuary",
  "martha-cove": "estuary",
};
const DEG: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
export const LAND = SPOTS.filter((s) => !s.noTake && s.kind !== "mark" && s.kind !== "sanctuary").map((s) => ({
  ...s, type: (TYPE[s.id] ?? (s.kind === "pier" ? "pier" : "beach")) as SpotType,
  // direction the shore looks out to (the water side) = middle of its exposed directions
  facing: s.exposedTo.length ? DEG[s.exposedTo[0]] : null as number | null,
}));
export type LandSpot = (typeof LAND)[number];

type Raw = { t: string[]; wind: number[]; gust: number[]; dir: number[]; wave: (number | null)[]; sea: (number | null)[] };
const CK = "rc-where-v1";
export async function getSpotWeather(): Promise<{ at: number; data: Record<string, Raw> }> {
  try { const c = JSON.parse(localStorage.getItem(CK) || "null"); if (c && Date.now() - c.at < 30 * 60000) return c; } catch { /* ignore */ }
  const data: Record<string, Raw> = {};
  for (let i = 0; i < LAND.length; i += 25) {
    const b = LAND.slice(i, i + 25);
    const la = b.map((s) => s.lat).join(","), lo = b.map((s) => s.lon).join(",");
    const w = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kn&timezone=${TZ}&forecast_days=2`).then((r) => { if (!r.ok) throw new Error(`Weather ${r.status}`); return r.json(); });
    const m = fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${la}&longitude=${lo}&hourly=wave_height,sea_level_height_msl&timezone=${TZ}&forecast_days=2`).then((r) => r.ok ? r.json() : null).catch(() => null);
    const [wd, md] = await Promise.all([w, m]);
    const W = Array.isArray(wd) ? wd : [wd]; const M = md ? (Array.isArray(md) ? md : [md]) : [];
    b.forEach((s, k) => {
      const h = W[k].hourly, mh = M[k]?.hourly;
      data[s.id] = { t: h.time, wind: h.wind_speed_10m, gust: h.wind_gusts_10m, dir: h.wind_direction_10m, wave: mh?.wave_height ?? [], sea: mh?.sea_level_height_msl ?? [] };
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

// Simple month guide (Port Phillip, Western Port, Surf Coast – land-based). 1 = Jan.
export const BITING: { fish: string; months: number[]; peak?: number[]; note: string; slug?: string }[] = [
  { fish: "Snapper", slug: "snapper", months: [9, 10, 11, 12, 1, 2, 3], peak: [10, 11, 12], note: "Spring run Oct–Dec. Piers and beaches on dusk/night, best in rough weather." },
  { fish: "King George whiting", slug: "king-george-whiting", months: [11, 12, 1, 2, 3, 4, 5], peak: [12, 1, 2, 3, 4], note: "Summer–autumn over sand and weed. Calm, clear water." },
  { fish: "Squid (calamari)", slug: "calamari", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], peak: [9, 10, 11], note: "All year, best in spring. Piers over weed, clear water, dawn and dusk." },
  { fish: "Garfish", slug: "garfish", months: [7, 8, 9, 10, 11, 12, 1, 2, 3], peak: [8, 9, 10], note: "Late winter–spring around piers. Float and small bait, burley helps." },
  { fish: "Australian salmon", slug: "australian-salmon", months: [5, 6, 7, 8, 9, 10, 11], peak: [7, 8, 9, 10], note: "Late winter–spring on surf beaches and piers. Likes a bit of wave." },
  { fish: "Flathead", slug: "sand-flathead", months: [9, 10, 11, 12, 1, 2, 3, 4], peak: [11, 12, 1, 2, 3], note: "Spring–autumn on sandy bottom. Easy fish for beginners." },
  { fish: "Black bream", slug: "black-bream", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "All year in rivers and estuaries. Run-out tide and low light." },
  { fish: "Mulloway", slug: "mulloway", months: [11, 12, 1, 2, 3, 4], peak: [12, 1, 2, 3], note: "Summer–autumn in western estuaries (Werribee, Barwon). Night, tide changes." },
  { fish: "Silver trevally", slug: "silver-trevally", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "All year around pier pylons and rock walls." },
  { fish: "Gummy shark", slug: "gummy-shark", months: [10, 11, 12, 1, 2, 3, 4], note: "Warmer months at night, deeper piers and surf beaches." },
  { fish: "Murray cod", months: [12, 1, 2, 3, 4, 5, 6, 7, 8], note: "Freshwater only. CLOSED SEASON 1 Sep – 30 Nov – no fishing for cod." },
];
export const inSeason = (m: number) => BITING.filter((b) => b.months.includes(m));
const seasonVal = (slug: string, m: number) => { const b = BITING.find((x) => x.slug === slug); return !b ? 1 : b.peak?.includes(m) ? 3 : b.months.includes(m) ? 2 : 0; };

export type Rank = { spot: LandSpot; score: number; badge: "Good" | "OK" | "Poor"; reason: string; best: string; target: string[]; avoid: boolean; wind: number; gust: number; dirTxt: string; wave: number | null };

export function rankSpot(s: LandSpot, r: Raw, mode: "now" | "today"): Rank {
  const now = fmtLocal(new Date(), TZ).slice(0, 13) + ":00";
  const today = now.slice(0, 10);
  const sun = SunCalc.getTimes(new Date(today + "T12:00:00+11:00"), s.lat, s.lon);
  const sr = fmtLocal(sun.sunrise!, TZ), ss = fmtLocal(sun.sunset!, TZ);
  let idx = r.t.map((t, i) => [t, i] as const).filter(([t]) => mode === "now" ? t === now : t.startsWith(today) && t >= sr.slice(0, 13) && t <= ss).map(([, i]) => i);
  if (!idx.length) idx = [Math.max(0, r.t.indexOf(now))];
  const avg = (a: (number | null)[]) => { const v = idx.map((i) => a[i]).filter((x): x is number => x != null); return v.length ? v.reduce((p, c) => p + c, 0) / v.length : null; };
  const wind = avg(r.wind) ?? 0, gust = Math.max(...idx.map((i) => r.gust[i] ?? 0));
  // average wind direction (vector mean)
  const sx = idx.reduce((a, i) => a + Math.sin(r.dir[i] * Math.PI / 180), 0), cx = idx.reduce((a, i) => a + Math.cos(r.dir[i] * Math.PI / 180), 0);
  const dir = (Math.atan2(sx, cx) * 180 / Math.PI + 360) % 360;
  const wave = r.wave.length ? Math.max(...idx.map((i) => r.wave[i] ?? 0)) : null;
  const wn = WINDNAME[c8(dir)];
  const sheltered = s.facing == null || s.shelteredFrom.includes(c8(dir) as never);
  const rel = s.facing == null ? "sheltered" : diff(dir, s.facing) <= 50 ? "onshore" : diff(dir, s.facing) >= 125 ? "offshore" : "cross";
  let sc = 55; const bits: string[] = [];
  const light = wind < 8;
  if (light) { sc += 12; bits.push("Light winds"); }
  else if (sheltered || rel === "offshore") { sc += wind < 18 ? 10 : 0; bits.push(`Sheltered from the ${wn}`); }
  else if (rel === "onshore") { sc -= wind >= 15 ? 22 : 6; bits.push(wind >= 15 ? `Blown straight in by the ${wn}` : `Light ${wn} blowing in`); }
  else { sc -= wind >= 15 ? 10 : 2; bits.push(`Cross-wind from the ${wn}`); }
  if (wind >= 20) sc -= 15;
  if (gust >= 30) { sc -= 12; bits.push(`gusts to ${Math.round(gust)} kn`); }
  const avoid = s.type === "rocks" && (wave ?? 0) >= 1.5 && !sheltered || (wave ?? 0) >= 2.5 && rel === "onshore" && s.type !== "estuary";
  if (avoid) { sc = Math.min(sc, 25); bits.push("big waves – stay off the rocks/edge"); }
  else if (rel === "offshore" || light || sheltered) bits.push(s.type === "estuary" ? "calm water" : "clear water");
  else if (rel === "onshore" && wind < 15) bits.push("a bit of stir – good for salmon & snapper");
  const m = Number(today.slice(5, 7));
  const tgt = [...new Set(s.species)].map((x) => ({ x, v: seasonVal(x, m) })).filter((o) => o.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
  sc += Math.min(18, tgt.reduce((a, o) => a + o.v * 2, 0));
  if (rel === "onshore" && wind >= 8 && wind < 15 && tgt.some((o) => o.x === "snapper" || o.x === "australian-salmon")) sc += 5;
  sc = Math.max(0, Math.min(100, Math.round(sc)));
  const target = tgt.map((o) => short(o.x));
  const reason = `${bits.join(", ")}${target.length ? `, good for ${target.slice(0, 2).join(" and ")}` : ""}`;
  return { spot: s, score: sc, badge: avoid ? "Poor" : sc >= 70 ? "Good" : sc >= 50 ? "OK" : "Poor", reason, best: bestTime(s, r, today, sr, ss), target, avoid, wind, gust, dirTxt: compass(dir), wave };
}

const mins = (t: string) => Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16));
function bestTime(s: LandSpot, r: Raw, today: string, sr: string, ss: string) {
  const ch: { t: string; type: string }[] = [];
  for (let i = 1; i < r.sea.length - 1; i++) {
    const a = r.sea[i - 1], b = r.sea[i], c = r.sea[i + 1];
    if (a == null || b == null || c == null || !r.t[i].startsWith(today)) continue;
    if (b > a && b >= c) ch.push({ t: r.t[i], type: "high" }); if (b < a && b <= c) ch.push({ t: r.t[i], type: "low" });
  }
  const opts = [{ k: "dawn", t: sr }, { k: "dusk", t: ss }];
  let best: { k: string; t: string; tide?: { t: string; type: string }; gap: number } | null = null;
  for (const o of opts) for (const c of ch) { const g = Math.abs(mins(c.t) - mins(o.t)); if (!best || g < best.gap) best = { ...o, tide: c, gap: g }; }
  if (best && best.gap <= 150) return `${best.k === "dawn" ? "Dawn" : "Dusk"} – ${best.k === "dawn" ? hhmm(sr) : hhmm(ss)}, with the ${best.tide!.type} tide change about ${hhmm(best.tide!.t).replace(":00", "")}`;
  const maj = solunar(today, TZ, s.lat, s.lon).find((p) => p.kind === "major" && p.mid.startsWith(today));
  if (ch.length) return `Around the ${ch[0].type} tide change about ${hhmm(ch[0].t).replace(":00", "")}, or dusk (${hhmm(ss)})`;
  return maj ? `Dusk (${hhmm(ss)}) or feeding time ${hhmm(maj.start)}–${hhmm(maj.end)}` : `Dawn (${hhmm(sr)}) or dusk (${hhmm(ss)})`;
}

export const km = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const R = 6371, dLa = (b.lat - a.lat) * Math.PI / 180, dLo = (b.lon - a.lon) * Math.PI / 180;
  const x = Math.sin(dLa / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
export type { Spot };
