import * as SunCalc from "suncalc";

export type Place = { name: string; lat: number; lon: number };

export type Hour = {
  time: string; temp: number; code: number; wind: number; gust: number; dir: number;
  rainChance: number; rain: number; pressure: number;
  wave?: number | null; swell?: number | null; swellPeriod?: number | null; swellDir?: number | null;
  sea?: number | null; seaTemp?: number | null;
};
export type Day = {
  date: string; code: number; tMax: number; tMin: number; windMax: number; gustMax: number; dir: number;
  rainSum: number; rainChance: number; sunrise: string; sunset: string;
};
export type Forecast = {
  place: Place; fetchedAt: number; tz: string;
  now: { temp: number; feels: number; code: number; wind: number; gust: number; dir: number; pressure: number; rain: number; cloud: number; time: string };
  hours: Hour[]; days: Day[]; hasMarine: boolean; inBay?: boolean;
};


// Port Phillip Bay (incl. Corio Bay) outline, rough. Open-Meteo's wave model does not resolve waves inside the bay,
// and for many bay points it snaps to an ocean grid cell outside the Heads, so bay waves and those tides are not trustworthy.
const PPB: [number, number][] = [[-37.84,144.90],[-37.835,144.97],[-37.87,144.99],[-37.95,145.02],[-38.00,145.08],[-38.08,145.135],[-38.15,145.135],[-38.22,145.05],[-38.30,145.00],[-38.33,144.975],[-38.36,144.90],[-38.37,144.78],[-38.335,144.73],[-38.30,144.66],[-38.27,144.665],[-38.22,144.665],[-38.15,144.675],[-38.11,144.62],[-38.10,144.52],[-38.14,144.43],[-38.165,144.355],[-38.10,144.34],[-38.03,144.42],[-37.98,144.55],[-37.95,144.66],[-37.90,144.78],[-37.86,144.84]];
export function inBay(lat: number, lon: number, pad = 0) {
  let c = false;
  for (let i = 0, k = PPB.length - 1; i < PPB.length; k = i++) {
    const [yi, xi] = PPB[i], [yk, xk] = PPB[k];
    if ((yi > lat) !== (yk > lat) && lon < ((xk - xi) * (lat - yi)) / (yk - yi) + xi) c = !c;
  }
  if (c || !pad) return c;
  // also count points within ~pad km of the outline (rivers, piers on the shore)
  return PPB.some(([y, x]) => Math.hypot((y - lat) * 111, (x - lon) * 88) < pad);
}
/** Which marine fields can be trusted for a point, given the grid cell the marine API actually used. */
export function marineTrust(lat: number, lon: number, cellLat?: number, cellLon?: number) {
  if (cellLat == null || cellLon == null) return { waves: false, tide: false, temp: false };
  const snapKm = Math.hypot((cellLat - lat) * 111, (cellLon - lon) * 88);
  const bayPoint = inBay(lat, lon, 4), bayCell = inBay(cellLat, cellLon);
  return { waves: !bayPoint && snapKm < 12, tide: bayPoint ? bayCell : snapKm < 12, temp: snapKm < 25 && bayPoint === bayCell };
}

/** fetch JSON with a timeout and one retry after a short pause (flaky mobile data). */
export const j = async (u: string, tries = 2, timeoutMs = 15000): Promise<any> => {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const r = await fetch(u, { signal: ac.signal });
      if (r.ok) return await r.json();
      last = new Error(`Data service error (${r.status})`);
      if (r.status < 500 && r.status !== 429) break;
    } catch (e) { last = e; } finally { clearTimeout(t); }
    if (i < tries - 1) await new Promise((res) => setTimeout(res, 1500));
  }
  throw last instanceof Error ? last : new Error("Network error");
};


export async function getForecast(place: Place): Promise<Forecast> {
  const { lat, lon } = place;
  const w = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,precipitation,cloud_cover` +
    `&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,precipitation,pressure_msl` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,precipitation_sum,precipitation_probability_max,sunrise,sunset` +
    `&wind_speed_unit=kn&timezone=auto&forecast_days=7&past_days=1`;
  const m = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
    `&hourly=wave_height,swell_wave_height,swell_wave_period,swell_wave_direction,sea_level_height_msl,sea_surface_temperature&timezone=auto&forecast_days=7&past_days=1`;
  const [wd, md] = await Promise.all([j(w), j(m, 2, 12000).catch(() => null)]);
  const H = wd.hourly, mh = md?.hourly;
  const tr = marineTrust(lat, lon, md?.latitude, md?.longitude);
  const midx = new Map<string, number>((mh?.time ?? []).map((t: string, i: number) => [t, i]));
  const hours: Hour[] = H.time.map((t: string, i: number) => {
    const k = midx.get(t);
    const g = (a?: (number | null)[]) => (k == null || !a ? null : a[k]);
    return {
      time: t, temp: H.temperature_2m[i], code: H.weather_code[i], wind: H.wind_speed_10m[i], gust: H.wind_gusts_10m[i],
      dir: H.wind_direction_10m[i], rainChance: H.precipitation_probability[i] ?? 0, rain: H.precipitation[i] ?? 0, pressure: H.pressure_msl[i],
      wave: tr.waves ? g(mh?.wave_height) : null, swell: tr.waves ? g(mh?.swell_wave_height) : null, swellPeriod: tr.waves ? g(mh?.swell_wave_period) : null, swellDir: tr.waves ? g(mh?.swell_wave_direction) : null,
      sea: tr.tide ? g(mh?.sea_level_height_msl) : null, seaTemp: tr.temp ? g(mh?.sea_surface_temperature) : null,
    };
  });
  const D = wd.daily;
  const days: Day[] = D.time.map((d: string, i: number) => ({
    date: d, code: D.weather_code[i], tMax: D.temperature_2m_max[i], tMin: D.temperature_2m_min[i], windMax: D.wind_speed_10m_max[i],
    gustMax: D.wind_gusts_10m_max[i], dir: D.wind_direction_10m_dominant[i], rainSum: D.precipitation_sum[i] ?? 0,
    rainChance: D.precipitation_probability_max[i] ?? 0, sunrise: D.sunrise[i], sunset: D.sunset[i],
  })).slice(1); // drop yesterday
  const c = wd.current;
  return {
    place, fetchedAt: Date.now(), tz: wd.timezone,
    now: { temp: c.temperature_2m, feels: c.apparent_temperature, code: c.weather_code, wind: c.wind_speed_10m, gust: c.wind_gusts_10m, dir: c.wind_direction_10m, pressure: c.pressure_msl, rain: c.precipitation, cloud: c.cloud_cover, time: c.time },
    hours, days, hasMarine: hours.some((h) => h.wave != null || h.sea != null || h.seaTemp != null), inBay: inBay(lat, lon, 4),
  };
}

export async function searchPlaces(q: string): Promise<Place[]> {
  const base = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en`;
  let d = await j(base + "&countryCode=AU"); // Australian places first
  if (!d.results?.length) d = await j(base);
  return (d.results ?? []).map((r: any) => ({ name: [r.name, r.admin1, r.country_code === "AU" ? "" : r.country].filter(Boolean).join(", "), lat: r.latitude, lon: r.longitude }));
}

// --- helpers ---
export const DIRS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export const compass = (d: number) => DIRS[Math.round(((d % 360) + 360) % 360 / 22.5) % 16];
export const kmh = (kn: number) => Math.round(kn * 1.852);
// Open-Meteo local times are "YYYY-MM-DDTHH:MM" in the place's zone; treat as wall-clock strings.
export const hhmm = (t: string) => { const [h, m] = t.slice(11, 16).split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`; };
export const dayName = (d: string, i: number) => i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(d + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });

export function weatherText(c: number): [string, string] {
  if (c === 0) return ["☀️", "Clear"]; if (c <= 2) return ["⛅", "Partly cloudy"]; if (c === 3) return ["☁️", "Cloudy"];
  if (c <= 48) return ["🌫️", "Fog"]; if (c <= 57) return ["🌦️", "Drizzle"]; if (c <= 67) return ["🌧️", "Rain"];
  if (c <= 77) return ["🌨️", "Snow"]; if (c <= 82) return ["🌦️", "Showers"]; return ["⛈️", "Thunderstorms"];
}

// --- local wall-clock time for a place (by timezone) ---
export function localNowKey(tz: string) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour").replace("24", "00")}:00`;
}
export const fmtLocal = (d: Date, tz: string) => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour").replace("24", "00")}:${g("minute")}`;
};
// UTC instant for local midnight of a date in tz (approx via offset at noon)
function localMidnight(date: string, tz: string) {
  const noon = new Date(date + "T12:00:00Z");
  const loc = fmtLocal(noon, tz);
  const offMin = (new Date(loc + ":00Z").getTime() - noon.getTime()) / 60000;
  return new Date(new Date(date + "T00:00:00Z").getTime() - offMin * 60000);
}

// --- moon & solunar (computed on the device with SunCalc) ---
export function moonInfo(date: Date) {
  const il = SunCalc.getMoonIllumination(date);
  const p = il.phase;
  const name = p < 0.03 || p > 0.97 ? "New moon" : p < 0.22 ? "Waxing crescent" : p < 0.28 ? "First quarter" : p < 0.47 ? "Waxing gibbous" : p < 0.53 ? "Full moon" : p < 0.72 ? "Waning gibbous" : p < 0.78 ? "Last quarter" : "Waning crescent";
  const icon = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"][Math.round(p * 8) % 8];
  return { phase: p, pct: Math.round(il.fraction * 100), name, icon };
}

export type Period = { kind: "major" | "minor"; label: string; start: string; end: string; mid: string };
export function solunar(date: string, tz: string, lat: number, lon: number): Period[] {
  const t0 = localMidnight(date, tz).getTime();
  const step = 5 * 60000; const alts: number[] = [];
  for (let i = 0; i <= 288; i++) alts.push(SunCalc.getMoonPosition(new Date(t0 + i * step), lat, lon).altitude);
  const out: Period[] = [];
  const add = (i: number, kind: Period["kind"], label: string) => {
    const mid = t0 + i * step, half = (kind === "major" ? 60 : 30) * 60000;
    out.push({ kind, label, mid: fmtLocal(new Date(mid), tz), start: fmtLocal(new Date(mid - half), tz), end: fmtLocal(new Date(mid + half), tz) });
  };
  for (let i = 1; i < alts.length - 1; i++) {
    if (alts[i] > alts[i - 1] && alts[i] >= alts[i + 1]) add(i, "major", "Moon overhead");
    if (alts[i] < alts[i - 1] && alts[i] <= alts[i + 1]) add(i, "major", "Moon underfoot");
    if (alts[i - 1] < 0 && alts[i] >= 0) add(i, "minor", "Moonrise");
    if (alts[i - 1] > 0 && alts[i] <= 0) add(i, "minor", "Moonset");
  }
  return out.sort((a, b) => a.mid.localeCompare(b.mid));
}

// --- fishing score ---
export type Score = { score: number; label: string; reasons: string[] };
export function scoreDay(f: Forecast, dayIdx: number): Score {
  const d = f.days[dayIdx];
  const hrs = f.hours.filter((h) => h.time.startsWith(d.date));
  const reasons: string[] = []; let s = 50;
  // wind (daylight average)
  const day = hrs.filter((h) => h.time >= d.sunrise.slice(0, 13) && h.time <= d.sunset);
  const avgWind = day.length ? day.reduce((a, h) => a + h.wind, 0) / day.length : d.windMax;
  if (avgWind < 8) { s += 15; reasons.push("👍 Light winds – easy fishing"); }
  else if (avgWind < 13) { s += 5; reasons.push("👌 Moderate breeze"); }
  else if (avgWind < 18) { s -= 10; reasons.push("👎 Fresh wind – choose a sheltered spot"); }
  else { s -= 25; reasons.push("⚠️ Strong wind – tough and possibly unsafe"); }
  if (d.gustMax >= 30) { s -= 10; reasons.push(`⚠️ Gusts up to ${Math.round(d.gustMax)} kn`); }
  // pressure trend over the day
  const p0 = hrs[6]?.pressure, p1 = hrs[18]?.pressure;
  if (p0 && p1) {
    const dp = p1 - p0;
    if (dp > 1.5) { s += 8; reasons.push("👍 Pressure rising – anglers often rate this a good sign"); }
    else if (dp < -3) { s -= 5; reasons.push("👎 Pressure dropping fast (weather change coming)"); }
    else if (dp < -1) { s += 5; reasons.push("👍 Pressure easing slightly – often a good bite before a change"); }
    else { s += 3; reasons.push("👌 Steady pressure"); }
  }
  // moon
  const mi = moonInfo(new Date(d.date + "T12:00:00"));
  const nearNF = Math.min(mi.phase, 1 - mi.phase, Math.abs(mi.phase - 0.5));
  if (nearNF < 0.07) { s += 10; reasons.push(`👍 ${mi.name} – bigger tides (often a stronger bite)`); }
  else if (nearNF > 0.18) { s -= 3; reasons.push(`${mi.name} – smaller tides`); }
  // solunar overlapping dawn/dusk
  const per = solunar(d.date, f.tz, f.place.lat, f.place.lon);
  const near = (a: string, b: string) => Math.abs(toMin(a) - toMin(b)) <= 90;
  if (per.some((p) => near(p.mid, d.sunrise) || near(p.mid, d.sunset))) { s += 8; reasons.push("👍 A feeding time lines up with sunrise or sunset"); }
  // rain
  if (d.rainSum > 10) { s -= 8; reasons.push(`🌧️ Heavy rain expected (${Math.round(d.rainSum)} mm)`); }
  else if (d.rainSum > 2) { s -= 2; reasons.push(`🌦️ Some rain (${d.rainSum.toFixed(1)} mm)`); }
  // swell
  const maxWave = Math.max(0, ...hrs.map((h) => h.wave ?? 0));
  if (maxWave > 2.5) { s -= 10; reasons.push(`🌊 Big seas (${maxWave.toFixed(1)} m) – stay off exposed rocks`); }
  s = Math.max(0, Math.min(100, Math.round(s)));
  const label = s >= 75 ? "Great" : s >= 60 ? "Good" : s >= 45 ? "Fair" : "Poor";
  return { score: s, label, reasons };
}
const toMin = (t: string) => new Date(t.slice(0, 16) + ":00Z").getTime() / 60000;

export function safety(f: Forecast): string[] {
  const out: string[] = [];
  const n = f.now;
  if (n.gust >= 34) out.push(`Gale-force gusts right now (${Math.round(n.gust)} kn / ${kmh(n.gust)} km/h). Don't go out in a boat.`);
  else if (n.wind >= 20 || n.gust >= 28) out.push(`Fresh to strong wind now (${Math.round(n.wind)} kn, gusts ${Math.round(n.gust)} kn). Small boats and kayaks should stay in.`);
  const next = f.hours.filter((h) => h.time >= localNowKey(f.tz)).slice(0, 12);
  const big = next.find((h) => h.gust >= 30);
  if (big && !out.length) out.push(`Gusts up to ${Math.round(big.gust)} kn expected around ${hhmm(big.time)}. Plan to be back before then.`);
  if (next.some((h) => h.code >= 95)) out.push("Thunderstorms possible – get off the water if you hear thunder.");
  const w = Math.max(0, ...next.map((h) => h.wave ?? 0));
  if (w >= 2.5) out.push(`Waves up to ${w.toFixed(1)} m – keep well back from rock ledges and wear a life jacket.`);
  return out;
}
