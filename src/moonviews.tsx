import { useMemo, useState } from "react";
import * as SunCalc from "suncalc";
import { type Place, moonInfo } from "./lib";
import { solunar, moonDay, dayRating, bestTimes, dayStart, dayEnd, fmt, type Period, type TideEv } from "./astro";
import { nearestStation, eventsBetween, clock } from "./tides";

const TZ = "Australia/Melbourne";
const t12 = (ms: number | null) => (ms == null ? "–" : clock(ms, TZ));
const dur = (min: number | null) => (min == null ? "" : `${Math.floor(min / 60)} h ${min % 60} min`);
const dateKey = (add: number) => fmt(Date.now() + add * 86400000, TZ).slice(0, 10);
const label = (k: string, i: number) => i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Date(k + "T12:00:00Z").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", timeZone: "UTC" });
export const Fish = ({ n }: { n: number }) => <span className="fishrate" aria-label={`${n} out of 3`}>{[1, 2, 3].map((i) => <span key={i} style={{ opacity: i <= n ? 1 : 0.2 }}>🐟</span>)}</span>;
const WORD: Record<number, string> = { 3: "Very high", 2: "High", 1: "Moderate" };

function dayData(place: Place, key: string) {
  const periods = solunar(key, TZ, place.lat, place.lon), md = moonDay(key, TZ, place.lat, place.lon);
  const hit = nearestStation(place.lat, place.lon);
  const tides: TideEv[] = hit ? eventsBetween(hit.station, dayStart(key, TZ) - 3600000, dayEnd(key, TZ) + 3600000).map((e) => ({ t: e.t, type: e.type })) : [];
  const sun = SunCalc.getTimes(new Date(dayStart(key, TZ) + 12 * 3600000), place.lat, place.lon);
  return { periods, md, tides, rating: dayRating(periods), sr: sun.sunrise?.getTime() ?? null, ss: sun.sunset?.getTime() ?? null, station: hit?.station.name.replace(/ \(.*\)/, "") ?? null, moon: moonInfo(new Date(dayStart(key, TZ) + 12 * 3600000)) };
}

/** Today screen: a short summary with a button for the full moon and feeding-times screen. */
export function MoonCard({ place, onMore }: { place: Place; onMore: () => void }) {
  const key = dateKey(0), now = Date.now();
  const d = useMemo(() => dayData(place, key), [place.lat, place.lon, key]);
  const best = bestTimes(d.periods, d.tides, now);
  return <section className="card">
    <h2>🌙 Moon & feeding times</h2>
    <p className="rateline"><span className={`rate r-${d.rating}`}>{d.rating.toUpperCase()}</span> <span className="muted small">feeding-time rating today</span></p>
    {best.length > 0 ? <><p className="small"><b>Best times left today</b></p>
      {best.map((b) => <div key={b.p.tm} className={`period ${b.p.kind}`}><b>{t12(b.p.t0)} – {t12(b.p.t1)}</b><span><Fish n={b.p.rating} /> {b.why.slice(1).join(", ") || b.p.label}</span></div>)}</>
      : <p className="muted small">No more feeding times today – see tomorrow.</p>}
    <div className="grid">
      <div className="stat"><small>Moonrise</small><b>{t12(d.md.rise)}</b></div>
      <div className="stat"><small>Moonset</small><b>{t12(d.md.set)}</b></div>
      <div className="stat"><small>Moon</small><b>{d.moon.icon} {d.moon.pct}%</b><small>{d.moon.name}</small></div>
    </div>
    <p className="small">☀️ Sunrise {t12(d.sr)} · Sunset {t12(d.ss)}</p>
    <p className="muted small">Solunar is a traditional angling theory, not proven science – a guide only.</p>
    <button className="btn alt wide" onClick={onMore}>Moon, tide & feeding chart ›</button>
  </section>;
}

/** 24-hour chart: feeding-time bars (height = rating), sunrise/sunset, tide turns and now. */
function DayBars({ d, key0, now }: { d: ReturnType<typeof dayData>; key0: string; now: number }) {
  const W = 340, H = 150, from = dayStart(key0, TZ), to = dayEnd(key0, TZ), x = (t: number) => ((t - from) / (to - from)) * W, base = 112, unit = 26;
  return <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Feeding times today against sunrise and sunset">
    {d.sr && d.ss && <><rect x="0" y="6" width={x(d.sr)} height={base - 6} fill="#00000033" /><rect x={x(d.ss)} y="6" width={W - x(d.ss)} height={base - 6} fill="#00000033" />
      <text x={x(d.sr)} y="14" textAnchor="middle" fontSize="10" fill="#f6c453">☀↑ {t12(d.sr).replace(" ", "")}</text><text x={x(d.ss)} y="14" textAnchor="middle" fontSize="10" fill="#f6c453">☀↓ {t12(d.ss).replace(" ", "")}</text></>}
    {[1, 2, 3].map((r) => <g key={r}><line x1="0" x2={W} y1={base - r * unit} y2={base - r * unit} stroke="#ffffff14" /><text x="2" y={base - r * unit - 2} fontSize="8.5" fill="#9fb4ae">{"🐟".repeat(r)}</text></g>)}
    {d.periods.map((p) => <rect key={p.tm} x={x(p.t0)} width={Math.max(4, x(p.t1) - x(p.t0))} y={base - p.rating * unit} height={p.rating * unit} rx="4" fill={p.kind === "major" ? "#2f9e6b" : "#4a78c2"} opacity="0.9" />)}
    {d.tides.filter((e) => e.t >= from && e.t < to).map((e) => <g key={e.t}><circle cx={x(e.t)} cy={base + 9} r="3.5" fill={e.type === "High" ? "#7fb2e5" : "#e57f7f"} /><text x={x(e.t)} y={base + 22} fontSize="8.5" textAnchor="middle" fill="#cfe0da">{t12(e.t).replace(" ", "")}</text></g>)}
    {now >= from && now < to && <><line x1={x(now)} x2={x(now)} y1="18" y2={base} stroke="#ff8a7a" strokeDasharray="3 3" /><text x={Math.min(x(now) + 3, W - 22)} y="26" fontSize="10" fill="#ff8a7a">now</text></>}
    {["12 am", "6 am", "12 pm", "6 pm", "12 am"].map((l, i) => <text key={i} x={(i / 4) * W} y={H - 4} fontSize="9.5" fill="#9fb4ae" textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{l}</text>)}
  </svg>;
}

const WHY: Record<Period["moonEvent"], string> = { overhead: "The moon is overhead (highest in the sky).", underfoot: "The moon is underfoot (directly below you, on the other side of the earth).", moonrise: "The moon rises.", moonset: "The moon sets." };

export function SolunarView({ place }: { place: Place }) {
  const [i, setI] = useState(0); const now = Date.now();
  const keys = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map(dateKey), []);
  const key = keys[i];
  const d = useMemo(() => dayData(place, key), [place.lat, place.lon, key]);
  const best = bestTimes(d.periods, d.tides, i === 0 ? now : null);
  return <>
    <section className="card">
      <h2>🌙 Moon & feeding times</h2>
      <p className="muted small">For {place.name}. Melbourne time. Worked out on your phone from the moon's position.</p>
      <div className="chips" role="group" aria-label="Day">{keys.map((k, n) => <button key={k} className={i === n ? "on" : ""} onClick={() => setI(n)}>{label(k, n)}</button>)}</div>
      <p className="rateline"><span className={`rate r-${d.rating}`}>{d.rating.toUpperCase()}</span> <span className="muted small">feeding-time rating</span></p>
      <DayBars d={d} key0={key} now={now} />
      <p className="muted small">Green bars = major periods, blue = minor. Taller = higher rating. Dots are {d.station ? `${d.station} tide turns` : "tides (no station nearby)"}.</p>
    </section>
    {best.length > 0 && <section className="card"><h3>⭐ Best times {i === 0 ? "left today" : "this day"}</h3>
      <p className="muted small">Picks the strongest feeding times, and puts extra weight on ones with a high tide in them (the VFA suggests fishing around high tide).</p>
      {best.map((b) => <div key={b.p.tm} className={`period ${b.p.kind}`}><b>{t12(b.p.t0)} – {t12(b.p.t1)}</b><span><Fish n={b.p.rating} /> {b.why.join(" · ")}</span></div>)}</section>}
    <section className="card"><h3>Feeding periods</h3>
      {d.periods.map((p) => <div key={p.tm} className="solrow"><div className="period-head"><b>{t12(p.t0)} – {t12(p.t1)}</b> <Fish n={p.rating} /></div>
        <div><b>{p.kind === "major" ? "Major" : "Minor"}</b> · {WORD[p.rating]} · {p.label}</div>
        <small className="muted">{WHY[p.moonEvent]} {p.sun ? `This lines up with ${p.sun}, which anglers rate higher.` : ""}</small></div>)}
      {d.periods.length === 0 && <p className="muted">No moon events fall on this day.</p>}
    </section>
    <section className="card"><h3>Moon today</h3>
      <div className="grid">
        <div className="stat"><small>Moonrise</small><b>{t12(d.md.rise)}</b></div><div className="stat"><small>Moonset</small><b>{t12(d.md.set)}</b></div>
        <div className="stat"><small>Overhead</small><b>{t12(d.md.transit)}</b></div><div className="stat"><small>Underfoot</small><b>{t12(d.md.underfoot)}</b></div>
        <div className="stat"><small>Moon</small><b>{d.moon.icon} {d.moon.pct}%</b><small>{d.moon.name}</small></div>
      </div>
      {d.md.visibleMin != null ? <p className="small">The moon is up for about <b>{dur(d.md.visibleMin)}</b> after it rises{d.md.nextSet ? ` (until moonset at ${t12(d.md.nextSet)}${new Date(d.md.nextSet) > new Date(dayEnd(key, TZ)) ? " the next morning" : ""})` : ""}.</p> : <p className="small muted">The moon does not rise on this calendar day.</p>}
    </section>
    <section className="card"><h3>How this works</h3>
      <p className="small"><b>Solunar is a traditional angling theory.</b> It says fish feed more when the moon is overhead or underfoot (major periods, about 2 hours) and when it rises or sets (minor periods, about 1 hour). There is no firm scientific proof, so treat it as a guide only – wind, tide, weather and the fish's season matter more.</p>
      <p className="small">Ratings of 1–3 fish: a major period starts at 2 and a minor at 1. Add 1 if it lines up with sunrise or sunset (within 30 minutes), and add 1 around a new or full moon (bigger tides). The day rating adds the periods up.</p>
      <p className="small">Moonrise, moonset and the overhead time are calculated from astronomy formulas and were checked against timeanddate.com for Melbourne (all within about 4 minutes). They change a little with your location.</p></section>
  </>;
}
