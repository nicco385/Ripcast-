import { useEffect, useMemo, useState } from "react";
import { getSpotWeather } from "./where";
import { AREAS } from "./data/spotinfo";
import { PROFILES, planSpecies, bestTargets, sessionWindow, spotsFor, spanTxt, type Plan, type SpotPlan, type Verdict } from "./target";
import { seasonVal } from "./where";
import { SpThumb, load, save } from "./ui";
import type { Place } from "./lib";

type Wx = Awaited<ReturnType<typeof getSpotWeather>>;
const ICON: Record<Verdict, string> = { Great: "🔥", Good: "👍", Fair: "👌", Poor: "👎" };
const VB = ({ v }: { v: Verdict }) => <span className={`badge v-${v}`}>{ICON[v]} {v}</span>;
const LIST = PROFILES.filter((p) => spotsFor(p.slug).length >= 2);
const m = () => new Date().getMonth() + 1;

function useWx() {
  const [wx, setWx] = useState<Wx | null>(null); const [failed, setFailed] = useState(false);
  useEffect(() => { let live = true; getSpotWeather().then((w) => live && setWx(w)).catch(() => live && setFailed(true)); return () => { live = false; }; }, []);
  return { wx, failed, loading: !wx && !failed };
}

/** Step 1: pick a fish. */
export function TargetPicker({ onPick }: { onPick: (slug: string) => void }) {
  const list = useMemo(() => [...LIST].sort((a, b) => seasonVal(b.slug, m()) - seasonVal(a.slug, m())), []);
  return <>
    <section className="card"><h2>🎯 Target a fish</h2>
      <p>Pick the fish you want to catch. The app checks the wind, waves, tide, time of day, moon and season at every spot it knows, and tells you where and when to go in the next 24 hours.</p></section>
    <div className="tgrid">{list.map((p) => { const v = seasonVal(p.slug, m());
      return <button key={p.slug} className="card tpick" onClick={() => onPick(p.slug)}><SpThumb name={p.name} size={140} /><b>{p.name}</b><small>{v === 3 ? "🔥 main run now" : v === 2 ? "In season" : v === 1 ? "All year" : "Quiet month"}</small></button>; })}</div>
  </>;
}

const fmtDist = (d: number | null) => d == null ? "" : `${d < 10 ? d.toFixed(1) : Math.round(d)} km away`;
function SpotCard({ s, i, onSpot }: { s: SpotPlan; i: number; onSpot: (id: string) => void }) {
  const pos = s.factors.filter((f) => f.pts > 0 && f.kind !== "season").sort((a, b) => b.pts - a.pts).slice(0, 3);
  const neg = s.factors.filter((f) => f.pts < 0).sort((a, b) => a.pts - b.pts).slice(0, 2);
  return <section className={`card wcard tspot`}>
    <div className="row"><h3>{i + 1}. {s.spot.name}</h3><VB v={s.verdict} /></div>
    <p className="muted small">{s.spot.info ? AREAS[s.spot.info.area].name : ""}{s.dist != null ? ` · ${fmtDist(s.dist)}` : ""}</p>
    <p className="big-txt">⏰ <b>Best {spanTxt(s.from, s.to)}</b></p>
    <p className="small muted">{[s.windTxt && `Wind then: ${s.windTxt}`, s.tideTxt && `Tide: ${s.tideTxt}`].filter(Boolean).join(" · ")}</p>
    <ul className="why">{pos.map((f) => <li key={f.txt} className="pos">✅ {f.txt}</li>)}{neg.map((f) => <li key={f.txt} className="neg">⚠️ {f.txt}</li>)}</ul>
    <div className="row btns"><button className="btn alt" onClick={() => onSpot(s.spot.id)}>Spot guide ›</button>
      <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${s.spot.lat},${s.spot.lon}`} target="_blank" rel="noreferrer">🚗 Directions</a></div>
  </section>;
}

/** Step 2: where and when to go for that fish. */
export function TargetView({ slug, place, rain24, onSpot, onSpecies }: { slug: string; place: Place; rain24: number | null; onSpot: (id: string) => void; onSpecies: (slug: string) => void }) {
  const { wx, failed, loading } = useWx();
  const [maxKm, setMaxKm] = useState<number>(() => load("rc-where-km", 0));
  useEffect(() => save("rc-where-km", maxKm), [maxKm]);
  const plan: Plan | null = useMemo(() => loading ? null : planSpecies(slug, wx?.data ?? null, { origin: place, maxKm, rain24 }), [slug, wx, loading, place.lat, place.lon, maxKm, rain24]);
  const p = PROFILES.find((x) => x.slug === slug);
  if (!p) return <div className="card">That fish can't be targeted yet.</div>;
  return <>
    <section className="card thero">
      <div className="row"><SpThumb name={p.name} size={110} /><div><p className="muted small">Target</p><h2 style={{ margin: 0 }}>{p.name}</h2></div></div>
      {loading && <><p className="muted small">Checking the wind at every spot…</p><div className="skel line" /><div className="skel line short" /></>}
      {plan && <><div className="verdict"><VB v={plan.verdict} /></div><p className="headline">{plan.headline}</p>
        <p className="muted small">Looking at the next 24 hours{wx?.stale ? " (using the last saved wind forecast)" : ""}. Melbourne time.</p></>}
      <div className="seg" role="group" aria-label="Distance">{[0, 30, 60].map((k) => <button key={k} className={maxKm === k ? "on" : ""} onClick={() => setMaxKm(k)}>{k ? `Within ${k} km` : "Any distance"}</button>)}</div>
      <p className="muted small">Distance from {place.name}.</p>
    </section>
    {failed && <div className="banner warn">Can't get the wind forecast right now, so spots are ranked on tide, time, moon and season only.</div>}
    {plan?.notes.map((n) => <div key={n} className="banner">{n}</div>)}
    {plan?.spots.slice(0, 5).map((s, i) => <SpotCard key={s.spot.id} s={s} i={i} onSpot={onSpot} />)}
    <section className="card"><h3>🪝 Quick rig & bait</h3><p className="big-txt">{p.tip}</p>
      <p className="small"><b>Why these times:</b> {p.why}</p>
      <button className="btn alt wide" onClick={() => onSpecies(slug)}>Full {p.name} guide ›</button></section>
    <p className="muted small center">A guide, not a promise. It is built from the VFA's advice and common angler knowledge, using forecast wind and waves, official BOM tides and the moon. Solunar feeding times are a traditional theory. Always check conditions when you get there and stay safe near the water.</p>
  </>;
}

/** Today screen: the evening (or next morning) session's best fish to chase. */
export function TargetsCard({ rain24, onOpen, onPick }: { rain24: number | null; onOpen: () => void; onPick: (slug: string) => void }) {
  const { wx, loading } = useWx();
  const win = useMemo(() => sessionWindow(), []);
  const list = useMemo(() => loading ? [] : bestTargets(wx?.data ?? null, win.from, win.to, { rain24 }), [wx, loading, win, rain24]);
  return <section className="card"><h2>🎯 {win.label}'s best targets</h2>
    {loading && <><div className="skel line" /><div className="skel line short" /></>}
    {list.map((pl) => { const s = pl.spots[0];
      return <button key={pl.profile.slug} className="item tline" onClick={() => onPick(pl.profile.slug)}>
        <SpThumb name={pl.profile.name} size={64} /><span className="grow"><b>{pl.profile.name}</b> <VB v={pl.verdict} /><small className="block">{s.spot.name} · {spanTxt(s.from, s.to)}</small></span><span className="chev">›</span></button>; })}
    {!loading && !wx && <p className="muted small">No wind forecast right now – based on tide, time and season only.</p>}
    <button className="btn alt wide" onClick={onOpen}>🎯 Target a fish ›</button>
  </section>;
}
