import { useMemo, useState } from "react";
import { TIDE_STATIONS } from "./data/tides";
import { type Station, nearestStation, stationById, eventsBetween, tideNow, clock, dayKey, distKm, TIDE_END } from "./tides";
import { type Place } from "./lib";
import { fromTxt } from "./where";
import * as SunCalc from "suncalc";
import { dayStart, dayEnd } from "./astro";
import { Ext } from "./ui";

const TZ = "Australia/Melbourne";
const BOM_URL = "http://www.bom.gov.au/australia/tides/";
export const BOM_CREDIT = "Tide times and heights: Bureau of Meteorology tide predictions (Victorian ports), © Commonwealth of Australia. Based on Bureau of Meteorology information that has subsequently been modified (reformatted into this app).";
export const BOM_DISCLAIMER = "Predictions are a guide only. Real water levels also depend on wind and air pressure, and the Bureau does not guarantee them. Do not use them for navigation or safety decisions – check bom.gov.au before boating or crossing bars.";
const dayLabel = (key: string, todayKey: string) => {
  const d = new Date(key + "T12:00:00Z"), t = new Date(todayKey + "T12:00:00Z");
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  const base = d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" });
  return diff === 0 ? `Today · ${base}` : diff === 1 ? `Tomorrow · ${base}` : base;
};
const short = (n: string) => n.replace(/ \(.*\)/, "");

/** Tide chart for the local day (midnight to midnight) with sunrise, sunset and a marker for now. */
export function DayCurve({ st, now, place }: { st: Station; now: number; place: Place }) {
  const W = 340, H = 130, key = dayKey(now, TZ), from = dayStart(key, TZ), to = dayEnd(key, TZ), N = 144;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) { const t = from + ((to - from) * i) / N; const n = tideNow(st, t); if (n) pts.push([i, n.m]); }
  if (pts.length < 10) return null;
  const lo = Math.min(...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1])), span = Math.max(0.3, hi - lo);
  const x = (t: number) => ((t - from) / (to - from)) * W, y = (m: number) => 22 + (1 - (m - lo) / span) * (H - 52);
  const d = pts.map((p, k) => `${k ? "L" : "M"}${((p[0] / N) * W).toFixed(1)} ${y(p[1]).toFixed(1)}`).join("");
  const sun = SunCalc.getTimes(new Date(from + 12 * 3600000), place.lat, place.lon), sr = sun.sunrise?.getTime(), ss = sun.sunset?.getTime();
  const nm = tideNow(st, now), ev = eventsBetween(st, from, to).filter((e) => e.t >= from && e.t < to);
  return <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tide chart for today with sunrise, sunset and now">
    {sr && ss && <><rect x="0" y="6" width={x(sr)} height={H - 28} fill="#00000033" /><rect x={x(ss)} y="6" width={W - x(ss)} height={H - 28} fill="#00000033" />
      <text x={x(sr)} y="12" textAnchor="middle" fontSize="10" fill="#f6c453">☀↑ {clock(sr, TZ).replace(" ", "")}</text>
      <text x={x(ss)} y="12" textAnchor="middle" fontSize="10" fill="#f6c453">☀↓ {clock(ss, TZ).replace(" ", "")}</text>
      <line x1={x(sr)} x2={x(sr)} y1="16" y2={H - 22} stroke="#f6c45366" /><line x1={x(ss)} x2={x(ss)} y1="16" y2={H - 22} stroke="#f6c45366" /></>}
    <path d={`${d}L${W} ${H - 22}L0 ${H - 22}Z`} fill="#86a39222" /><path d={d} fill="none" stroke="#b9c9c4" strokeWidth="2.5" />
    {ev.map((e) => <g key={e.t}><circle cx={x(e.t)} cy={y(e.m)} r="3.5" fill={e.type === "High" ? "#7fb2e5" : "#e57f7f"} /><text x={x(e.t)} y={e.type === "High" ? y(e.m) - 7 : y(e.m) + 15} textAnchor="middle" fontSize="10.5" fill="#cfe0da">{clock(e.t, TZ).replace(" ", "")}</text></g>)}
    {now >= from && now < to && <><line x1={x(now)} x2={x(now)} y1="16" y2={H - 22} stroke="#ff8a7a" strokeDasharray="3 3" />{nm && <circle cx={x(now)} cy={y(nm.m)} r="5" fill="#ff8a7a" />}<text x={Math.min(x(now) + 4, W - 26)} y={H - 26} fontSize="10.5" fill="#ff8a7a">now</text></>}
    {["12 am", "6 am", "12 pm", "6 pm", "12 am"].map((l, i) => <text key={i} x={(i / 4) * W} y={H - 6} fontSize="9.5" fill="#9fb4ae" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{l}</text>)}
  </svg>;
}

/** Round dial: top = high tide, bottom = low tide, right side = falling, left side = rising. */
export function TideDial({ st, now }: { st: Station; now: number }) {
  const evs = eventsBetween(st, now - 16 * 3600000, now + 16 * 3600000);
  const prev = [...evs].reverse().find((e) => e.t <= now), next = evs.find((e) => e.t > now);
  if (!prev || !next) return null;
  const rising = next.type === "High", p = (now - prev.t) / (next.t - prev.t);
  const theta = rising ? 180 + 180 * p : 180 * p; // clockwise from the top
  const R = 70, C = 100, pt = (deg: number) => { const r = ((deg - 90) * Math.PI) / 180; return [C + R * Math.cos(r), C + R * Math.sin(r)]; };
  const start = rising ? 180 : 0, [x0, y0] = pt(start), [x1, y1] = pt(theta), [xe, ye] = pt(theta);
  const big = Math.abs(theta - start) > 180 ? 1 : 0, col = rising ? "#6fa8e6" : "#e57070";
  const hi = rising ? next : prev, lo = rising ? prev : next;
  const mins = Math.max(0, Math.round((next.t - now) / 60000)), hm = `${Math.floor(mins / 60) ? `${Math.floor(mins / 60)} h ` : ""}${mins % 60} min`;
  return <div className="dial">
    <svg viewBox="0 0 200 200" role="img" aria-label={`Tide is ${rising ? "rising" : "falling"}, ${hm} until ${next.type.toLowerCase()} tide`}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#ffffff22" strokeWidth="16" />
      <path d={`M${x0} ${y0}A${R} ${R} 0 ${big} 1 ${x1} ${y1}`} fill="none" stroke={col} strokeWidth="16" strokeLinecap="round" />
      <circle cx={xe} cy={ye} r="9" fill="#fff" stroke={col} strokeWidth="4" />
      <text x={C} y={C - 4} textAnchor="middle" fontSize="19" fontWeight="700" fill={col}>{rising ? "Rising" : "Falling"}</text>
      <text x={C} y={C + 16} textAnchor="middle" fontSize="11" fill="#cfe0da">{rising ? "⬆" : "⬇"} {hm} to {next.type.toLowerCase()}</text>
      <text x={C} y="14" textAnchor="middle" fontSize="12" fill="#9ec7f2" fontWeight="600">{rising ? "Next high" : "Last high"} {clock(hi.t, TZ)}</text>
      <text x={C} y="196" textAnchor="middle" fontSize="12" fill="#f2a1a1" fontWeight="600">{rising ? "Last low" : "Next low"} {clock(lo.t, TZ)}</text>
      <text x="4" y={C + 4} fontSize="11" fill="#9fb4ae">rising</text><text x="196" y={C + 4} textAnchor="end" fontSize="11" fill="#9fb4ae">falling</text>
    </svg>
    <p className="tide-now"><b>The water is {rising ? "rising" : "falling"}.</b> {hm} until {next.type.toLowerCase()} tide at <b>{clock(next.t, TZ)}</b>.</p>
  </div>;
}

/** One plain line for the Today screen: rising/falling and time to the next turn. */
function TideNow({ st, now }: { st: Parameters<typeof eventsBetween>[0]; now: number }) {
  const evs = eventsBetween(st, now - 16 * 3600000, now + 16 * 3600000);
  const prev = [...evs].reverse().find((e) => e.t <= now), next = evs.find((e) => e.t > now);
  if (!prev || !next) return null;
  const rising = next.type === "High", mins = Math.max(0, Math.round((next.t - now) / 60000));
  const hm = `${Math.floor(mins / 60) ? `${Math.floor(mins / 60)} h ` : ""}${mins % 60} min`;
  return <p className="tidenow"><span className="tidearrow">{rising ? "⬆" : "⬇"}</span> <b>{rising ? "Rising" : "Falling"}</b> – {next.type.toLowerCase()} tide at <b>{clock(next.t, TZ)}</b> ({hm})</p>;
}

export function TideCard({ place, onMore, compact }: { place: Place; onMore: () => void; compact?: boolean }) {
  const now = Date.now();
  const hit = useMemo(() => nearestStation(place.lat, place.lon), [place.lat, place.lon]);
  const end = TIDE_END();
  if (now > end) return <section className="card"><h2>🌊 Tides</h2><p>The tide tables built into this app end on 31 December 2027. Please use the official Bureau of Meteorology tide tables.</p><Ext href={BOM_URL} cls="link">Official BOM tide tables ↗</Ext></section>;
  if (!hit) return <section className="card"><h2>🌊 Tides</h2><p className="muted">There is no official tide station within 40 km of {fromTxt(place.name)}. Pick a pier, beach or river on the bay (try the Where tab) to see tide times.</p><button className="btn alt" onClick={onMore}>Choose another station</button></section>;
  const st = hit.station;
  const evs = eventsBetween(st, now, now + 30 * 3600000).slice(0, 4);
  const todayKey = dayKey(now, TZ);
  const inBay = st.lon > 144.4 && st.lon < 145.1 && st.lat > -38.4;
  return <section className="card">
    <h2>🌊 Tides – {short(st.name)}</h2>
    <p className="muted small">{compact ? `Official BOM times · ${Math.round(hit.km)} km from ${fromTxt(place.name)}` : `Official predictions for the nearest station, ${Math.round(hit.km)} km from ${fromTxt(place.name)}. Melbourne time.`}</p>
    {compact ? <TideNow st={st} now={now} /> : <TideDial st={st} now={now} />}
    {end - now < 60 * 86400000 && <div className="banner warn">The tide tables built into this app end on 31 December 2027 ({Math.ceil((end - now) / 86400000)} days left). An app update will be needed after that.</div>}
    {!compact && <DayCurve st={st} now={now} place={place} />}
    {!compact && evs.map((t) => <div key={t.t} className="period"><b>{t.type === "High" ? "⬆ High" : "⬇ Low"} {clock(t.t, TZ)}</b><span>{dayKey(t.t, TZ) === todayKey ? "Today" : "Tomorrow"} · {t.m.toFixed(2)} m</span></div>)}
    {compact && <p className="small muted">Then: {evs.slice(1, 4).map((t) => `${t.type.toLowerCase()} ${clock(t.t, TZ)}`).join(" · ")}</p>}
    {hit.km > 12 && <p className="muted small">This station is a fair way from your spot, so times can be out by a bit. Use the Tides page to pick a closer one.</p>}
    {inBay && !compact && <p className="muted small">Port Phillip Bay's tide is small (about 1 m) and arrives roughly 3 hours after the Heads. Strong winds and pressure changes can shift it by more than usual.</p>}
    <button className="btn" onClick={onMore}>{compact ? "Tide graph, week & other places ›" : "Tides for the week & other places ›"}</button>
  </section>;
}

export function TidesView({ place }: { place: Place }) {
  const near = useMemo(() => TIDE_STATIONS.map((s) => ({ s, km: distKm(place, s) })).sort((a, b) => a.km - b.km), [place.lat, place.lon]);
  const [id, setId] = useState(near[0].s.id);
  const st = stationById(id)!, now = Date.now(), todayKey = dayKey(now, TZ);
  const days = useMemo(() => {
    const evs = eventsBetween(st, now - 26 * 3600000, now + 8 * 86400000);
    const m = new Map<string, typeof evs>();
    for (const e of evs) { const k = dayKey(e.t, TZ); if (k >= todayKey) m.set(k, [...(m.get(k) ?? []), e]); }
    return [...m.entries()].slice(0, 8);
  }, [id, todayKey]);
  const end = TIDE_END();
  return <>
    <section className="card">
      <h2>🌊 Tide times</h2>
      <label>Place<select value={id} onChange={(e) => setId(e.target.value)}>{near.map(({ s, km }) => <option key={s.id} value={s.id}>{short(s.name)} · {Math.round(km)} km</option>)}</select></label>
      <p className="muted small">Closest to {fromTxt(place.name)} is first. Heights are in metres above the chart's lowest level. All times are Melbourne local time (including daylight saving).</p>
      {now > end ? <div className="banner warn">The built-in tables end on 31 Dec 2027. Use the official BOM site.</div>
        : end - now < 60 * 86400000 ? <div className="banner warn">The built-in tables end on 31 Dec 2027 ({Math.ceil((end - now) / 86400000)} days left).</div> : null}
      <DayCurve st={st} now={now} place={place} />
    </section>
    {days.map(([k, evs]) => <section key={k} className="card"><h3>{dayLabel(k, todayKey)}</h3>
      {evs.map((e) => <div key={e.t} className="period"><b>{e.type === "High" ? "⬆ High" : "⬇ Low"} {clock(e.t, TZ)}</b><span>{e.m.toFixed(2)} m</span></div>)}</section>)}
    <section className="card">
      <h3>How accurate is this?</h3>
      <p className="small">These are the Bureau of Meteorology's own published predictions for {TIDE_STATIONS.length} Victorian ports, stored in the app so they work without signal. The app's times match the BOM tables exactly; it does not guess or model them. They run from October 2026 to the end of 2027.</p>
      <p className="small"><b>Port Phillip Bay is different from the coast.</b> Its tide is small – about 1 m – and arrives about 3 hours after the Heads. Williamstown, St Kilda and Geelong are all different from each other, so pick the closest station. Strong winds and pressure changes can push the real water level off the prediction.</p>
      <p className="small">Rivers: the Yarra and Maribyrnong tides run a little later than the bay as you go upstream.</p>
      <p className="muted small">{BOM_CREDIT}</p><p className="muted small">{BOM_DISCLAIMER}</p>
      <Ext href={BOM_URL} cls="link">Official BOM tide tables ↗</Ext>
    </section>
  </>;
}
