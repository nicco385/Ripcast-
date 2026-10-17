import { useMemo, useState } from "react";
import { TIDE_STATIONS } from "./data/tides";
import { type Station, nearestStation, stationById, eventsBetween, tideNow, tideStateText, clock, dayKey, distKm, TIDE_END } from "./tides";
import { type Place } from "./lib";
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

/** Small chart of the tide from 2 h ago to 22 h ahead, with a marker for now. */
function Curve({ st, now }: { st: Station; now: number }) {
  const W = 320, H = 96, from = now - 2 * 3600000, to = now + 22 * 3600000, N = 72;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) { const t = from + ((to - from) * i) / N; const n = tideNow(st, t); if (n) pts.push([i, n.m]); }
  if (pts.length < 10) return null;
  const lo = Math.min(...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1])), span = Math.max(0.3, hi - lo);
  const x = (i: number) => (i / N) * W, y = (m: number) => 14 + (1 - (m - lo) / span) * (H - 34);
  const d = pts.map((p, k) => `${k ? "L" : "M"}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join("");
  const nx = x(((now - from) / (to - from)) * N), nm = tideNow(st, now);
  const ev = eventsBetween(st, from, to);
  return <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tide chart for the next 24 hours">
    <path d={`${d}L${W} ${H}L0 ${H}Z`} fill="#86a39222" /><path d={d} fill="none" stroke="#b9c9c4" strokeWidth="2.5" />
    {ev.map((e) => { const i = ((e.t - from) / (to - from)) * N; return <g key={e.t}><circle cx={x(i)} cy={y(e.m)} r="3.5" fill="#d9b77e" /><text x={x(i)} y={e.type === "High" ? y(e.m) - 7 : y(e.m) + 15} textAnchor="middle" fontSize="10.5" fill="#cfe0da">{clock(e.t, TZ).replace(" ", "")}</text></g>; })}
    <line x1={nx} x2={nx} y1="4" y2={H - 4} stroke="#ff8a7a" strokeDasharray="3 3" />{nm && <circle cx={nx} cy={y(nm.m)} r="5" fill="#ff8a7a" />}
    <text x={nx + 4} y="12" fontSize="10.5" fill="#ff8a7a">now</text>
  </svg>;
}

export function TideCard({ place, onMore }: { place: Place; onMore: () => void }) {
  const now = Date.now();
  const hit = useMemo(() => nearestStation(place.lat, place.lon), [place.lat, place.lon]);
  const end = TIDE_END();
  if (now > end) return <section className="card"><h2>🌊 Tides</h2><p>The tide tables built into this app end on 31 December 2027. Please use the official Bureau of Meteorology tide tables.</p><Ext href={BOM_URL} cls="link">Official BOM tide tables ↗</Ext></section>;
  if (!hit) return <section className="card"><h2>🌊 Tides</h2><p className="muted">There is no official tide station within 40 km of {place.name}. Pick a pier, beach or river on the bay (try the Where tab) to see tide times.</p><button className="btn alt" onClick={onMore}>Choose another station</button></section>;
  const st = hit.station, state = tideStateText(st, now, TZ);
  const evs = eventsBetween(st, now, now + 30 * 3600000).slice(0, 4);
  const todayKey = dayKey(now, TZ);
  const inBay = st.lon > 144.4 && st.lon < 145.1 && st.lat > -38.4;
  return <section className="card">
    <h2>🌊 Tides – {short(st.name)}</h2>
    <p className="muted small">Official predictions for the nearest station, {Math.round(hit.km)} km from {place.name}. Melbourne time.</p>
    {state && <p className="tide-now"><b>{state.rising ? "⬆ Rising" : "⬇ Falling"}</b> · {state.m.toFixed(2)} m now{state.next ? <> · next {state.next.type.toLowerCase()} at <b>{clock(state.next.t, TZ)}</b></> : null}</p>}
    <Curve st={st} now={now} />
    {evs.map((t) => <div key={t.t} className="period"><b>{t.type === "High" ? "⬆ High" : "⬇ Low"} {clock(t.t, TZ)}</b><span>{dayKey(t.t, TZ) === todayKey ? "Today" : "Tomorrow"} · {t.m.toFixed(2)} m</span></div>)}
    {hit.km > 12 && <p className="muted small">This station is a fair way from your spot, so times can be out by a bit. Use the Tides page to pick a closer one.</p>}
    {inBay && <p className="muted small">Port Phillip Bay's tide is small (about 1 m) and arrives roughly 3 hours after the Heads. Strong winds and pressure changes can shift it by more than usual.</p>}
    <button className="btn" onClick={onMore}>Tides for the week & other places ›</button>
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
      <p className="muted small">Closest to {place.name} is first. Heights are in metres above the chart's lowest level. All times are Melbourne local time (including daylight saving).</p>
      {now > end && <div className="banner warn">The built-in tables end on 31 Dec 2027. Use the official BOM site.</div>}
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
