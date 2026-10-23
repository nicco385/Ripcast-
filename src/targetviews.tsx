import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getSpotWeather, peekSpotWeather, km, fromTxt, spotAt, spotLabel, type LandSpot } from "./where";
import { isOcc } from "./data/spots";
import { AREAS } from "./data/spotinfo";
import { PROFILES, planSpecies, dayOutlook, spotsFor, spanTxt, nearSpots, NEAR_KM, betterNearby, type Plan, type SpotPlan, type Verdict, type DayOutlook } from "./target";
import { fmt } from "./astro";
import { seasonVal } from "./where";
import { SpThumb, load, save } from "./ui";
import { FACILITIES } from "./data/facilities";
import type { Place } from "./lib";

type Wx = Awaited<ReturnType<typeof getSpotWeather>>;
const ICON: Record<Verdict, string> = { Great: "🔥", Good: "👍", Fair: "👌", Poor: "👎" };
const VB = ({ v }: { v: Verdict }) => <span className={`badge v-${v}`}>{ICON[v]} {v}</span>;
const LIST = PROFILES.filter((p) => spotsFor(p.slug).length >= 2);
const m = () => new Date().getMonth() + 1;

/** Spot forecast: the saved copy straight away (instant first paint), then a fresh one in the background. */
export function useWx() {
  const [wx, setWx] = useState<Wx | null>(() => peekSpotWeather()); const [failed, setFailed] = useState(false);
  useEffect(() => { let live = true; getSpotWeather().then((w) => live && setWx(w)).catch(() => live && setFailed(true)); return () => { live = false; }; }, []);
  return { wx, failed, loading: !wx && !failed };
}

export { VB };
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
/** Rock grounds are unlit and slippery: if the best time is after dark and we can't confirm lights, say so. */
const nightNote = (s?: SpotPlan) => s && s.spot.type === "rocks" && s.factors.some((f) => f.kind === "light" && /after dark/i.test(f.txt)) && FACILITIES[s.spot.id]?.lights.has !== "yes"
  ? "🔦 Best time is after dark, and this is rock with no confirmed lights – take a headlamp and a mate, and stay well back from the edge." : null;
function SpotCard({ s, i, onSpot, label }: { s: SpotPlan; i: number; onSpot: (id: string) => void; label?: string }) {
  const pos = s.factors.filter((f) => f.pts > 0 && f.kind !== "season").sort((a, b) => b.pts - a.pts).slice(0, 3);
  const neg = s.factors.filter((f) => f.pts < 0).sort((a, b) => a.pts - b.pts).slice(0, 2);
  return <section className={`card wcard tspot`}>
    <div className="row"><h3>{label ?? `${i + 1}.`} {s.spot.name}</h3><VB v={s.verdict} /></div>
    <p className="muted small">{s.spot.info ? AREAS[s.spot.info.area].name : ""}{s.dist != null ? ` · ${fmtDist(s.dist)}` : ""}</p>
    <p className="big-txt">⏰ <b>Best {spanTxt(s.from, s.to)}</b></p>
    <p className="small muted">{[s.windTxt && `Wind then: ${s.windTxt}`, s.tideTxt && `Tide: ${s.tideTxt}`].filter(Boolean).join(" · ")}</p>
    {nightNote(s) && <p className="small neg">{nightNote(s)}</p>}
    <ul className="why">{pos.map((f) => <li key={f.txt} className="pos">✅ {f.txt}</li>)}{neg.map((f) => <li key={f.txt} className="neg">⚠️ {f.txt}</li>)}</ul>
    <div className="row btns"><button className="btn alt" onClick={() => onSpot(s.spot.id)}>Spot guide ›</button>
      <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${s.spot.lat},${s.spot.lon}`} target="_blank" rel="noreferrer">🚗 Directions</a></div>
  </section>;
}

/** Step 2: where and when to go for that fish. */
export function TargetView({ slug, place, rain24, onSpot, onSpecies }: { slug: string; place: Place; rain24: number | null; onSpot: (id: string) => void; onSpecies: (slug: string) => void }) {
  const { wx, failed, loading } = useWx();
  const here = useMemo(() => spotAt(place), [place.name, place.lat, place.lon]);
  // "Nearby" (default) uses the same spots as Today, so "Why, and other spots" matches the Today pick
  const [maxKm, setMaxKm] = useState<number>(() => load("rc-target-km", NEAR_KM));
  useEffect(() => save("rc-target-km", maxKm), [maxKm]);
  const { plan, wide } = useMemo(() => {
    if (loading) return { plan: null as Plan | null, wide: false };
    const o = { origin: place, rain24 };
    if (!maxKm) return { plan: planSpecies(slug, wx?.data ?? null, o), wide: false };
    const near = planSpecies(slug, wx?.data ?? null, { ...o, within: new Set(nearSpots(place, maxKm).map((s) => s.id)) });
    return near ? { plan: near, wide: false } : { plan: planSpecies(slug, wx?.data ?? null, o), wide: true };
  }, [slug, wx, loading, place.lat, place.lon, maxKm, rain24]);
  const p = PROFILES.find((x) => x.slug === slug);
  if (!p) return <div className="card">That fish can't be targeted yet.</div>;
  return <>
    <section className="card thero">
      <div className="row"><SpThumb name={p.name} size={110} /><div><p className="muted small">Target</p><h2 style={{ margin: 0 }}>{p.name}</h2></div></div>
      {loading && <><p className="muted small">Checking the wind at every spot…</p><div className="skel line" /><div className="skel line short" /></>}
      {plan && <><div className="verdict"><VB v={plan.verdict} /></div><p className="headline">{plan.headline}</p>
        <p className="muted small">Looking at the next 24 hours{wx?.stale ? " (using the last saved wind forecast)" : ""}. Melbourne time.</p></>}
      <div className="seg" role="group" aria-label="Distance">{[NEAR_KM, 60, 0].map((k) => <button key={k} className={maxKm === k ? "on" : ""} onClick={() => setMaxKm(k)}>{k === NEAR_KM ? `Nearby (${k} km)` : k ? `Within ${k} km` : "Any distance"}</button>)}</div>
      <p className="muted small">Distance from {fromTxt(place.name)}{maxKm ? " – by road, so spots across the bay or the Heads don't count as near" : ""}.</p>
      {wide && <div className="banner warn">No {p.name.toLowerCase()} spots within {maxKm} km of here, so this shows the best spots anywhere.</div>}
    </section>
    {failed && <div className="banner warn">Can't get the wind forecast right now, so spots are ranked on tide, time, moon and season only.</div>}
    {plan?.notes.map((n) => <div key={n} className="banner">{n}</div>)}
    {(() => { if (!plan) return null;
      // started from a known spot: that spot first, then the other spots
      const mine = here && plan.spots.find((x) => x.spot.id === here.id);
      if (!here) return plan.spots.slice(0, 5).map((s, i) => <SpotCard key={s.spot.id} s={s} i={i} onSpot={onSpot} />);
      const rest = plan.spots.filter((x) => x.spot.id !== here.id).slice(0, 4);
      return <>
        {mine ? <><h3 className="sechead">At your spot{isOcc(here, slug) ? " (only an occasional catch here)" : ""}</h3><SpotCard s={mine} i={0} label="📍" onSpot={onSpot} /></>
          : <div className="banner">{here.name} isn't a known spot for {p.name.toLowerCase()}{here.info?.status?.closed ? " (and it's closed)" : ""}, so here are the best spots nearby.</div>}
        {rest.length > 0 && <h3 className="sechead">{mine ? "Other spots" : "Best spots"}</h3>}
        {rest.map((s, i) => <SpotCard key={s.spot.id} s={s} i={i} onSpot={onSpot} />)}</>;
    })()}
    <section className="card"><h3>🪝 Quick rig & bait</h3><p className="big-txt">{p.tip}</p>
      <p className="small"><b>Why these times:</b> {p.why}</p>
      <button className="btn alt wide" onClick={() => onSpecies(slug)}>Full {p.name} guide ›</button></section>
    <p className="muted small center">A guide, not a promise. It is built from the VFA's advice and common angler knowledge, using forecast wind and waves, official BOM tides and the moon. Solunar feeding times are a traditional theory. Always check conditions when you get there and stay safe near the water.</p>
  </>;
}

const fishName = (n: string) => n.toLowerCase().replace("king george", "King George").replace("australian", "Australian").replace(/^./, (c) => c.toUpperCase());
const reasons = (pl: Plan) => pl.spots[0].factors.filter((f) => f.pts > 0 && f.kind !== "season").sort((a, b) => b.pts - a.pts).slice(0, 2).map((f) => f.txt.replace(/^./, (c) => c.toLowerCase())).join(", ");

/** Today screen hero: one rating for today from the same engine as Target a fish, with the best bets.
 *  If the chosen place IS a known spot, the hero is about that spot first, with better nearby options below. */
export function FishingToday({ place, rain24, onOpen, onPick }: { place: Place; rain24: number | null; onOpen: () => void; onPick: (slug: string) => void }) {
  const { wx, loading } = useWx();
  const [out, setOut] = useState<DayOutlook | null>(null);
  const [area, setArea] = useState<DayOutlook | null>(null);
  const here = useMemo(() => spotAt(place), [place.name, place.lat, place.lon]);
  const day = fmt(Date.now(), "Australia/Melbourne").slice(0, 10);
  // work it out just after the first paint so the screen appears instantly
  useEffect(() => { if (loading) return; const id = setTimeout(() => {
    const w = wx?.data ?? null;
    setOut(dayOutlook(w, day, { origin: place, rain24, only: here, n: 3 }));
    setArea(here ? dayOutlook(w, day, { origin: place, rain24, n: 8 }) : null);
  }, 0); return () => clearTimeout(id); }, [wx, loading, place.lat, place.lon, rain24, day, here]);
  const foot = <><button className="btn alt wide" onClick={onOpen}>🎯 Target a different fish ›</button>
    <p className="muted small">Rated on wind, waves, rain, tide, time, moon and season{here ? "" : ` at spots within about ${NEAR_KM} km by road (not across the bay or the Heads)`} – the same engine as everywhere else in the app. A guide only.</p></>;
  const rain = out && (out.showery ? <p className="small">🌧️ Rain is likely for much of the day.</p> : out.damp ? <p className="small">🌦️ Some rain about – pick a dry window.</p> : null);
  const noWind = out?.noWind && <p className="muted small">No wind forecast right now – this uses tide, time, moon and season only.</p>;
  if (here) return <SpotToday here={here} place={place} out={out} area={area} rain={rain} noWind={noWind} foot={foot} onPick={onPick} />;
  const top = out?.plans[0], s = top?.spots[0];
  return <section className="card hero2">
    <p className="muted" style={{ margin: 0 }}>Fishing today {/^(Near |\d+ km from )/.test(place.name) ? place.name.replace(/^N/, "n") : `near ${place.name.replace(/, VIC$/, "")}`}</p>
    {out?.near.far && <div className="banner warn">No fishing spots in the app within {out.near.radiusKm} km of here. The nearest is {spotLabel(out.near.nearest.spot.name)}, {Math.round(out.near.nearest.km)} km away – these picks are the closest ones.</div>}
    {!out ? <><div className="skel line" /><div className="skel line short" /></> : <>
      <div className="verdict-big"><VB v={out.verdict} /></div>
      {top && s ? <p className="headline">Best bet: {fishName(top.profile.name)} at {spotLabel(s.spot.name)} · {Math.round(km(place, s.spot))} km, {spanTxt(s.from, s.to)}.</p> : <p>No good options left today – check tomorrow in the 7-day forecast.</p>}
      {rain}{noWind}
      {out.plans.slice(1).map((pl) => { const x = pl.spots[0];
        return <button key={pl.profile.slug} className="item tline" onClick={() => onPick(pl.profile.slug)}>
          <SpThumb name={pl.profile.name} size={56} /><span className="grow"><b>{pl.profile.name}</b> <VB v={pl.verdict} /><small className="block">{spotLabel(x.spot.name)} · {Math.round(km(place, x.spot))} km · {spanTxt(x.from, x.to)}</small></span><span className="chev">›</span></button>; })}
      {top && <button className="btn wide" onClick={() => onPick(top.profile.slug)}>Why, and other spots ›</button>}
    </>}
    {foot}
  </section>;
}

function SpotToday({ here, place, out, area, rain, noWind, foot, onPick }: { here: LandSpot; place: Place; out: DayOutlook | null; area: DayOutlook | null; rain: ReactNode; noWind: ReactNode; foot: ReactNode; onPick: (slug: string) => void }) {
  const closed = here.info?.status?.closed;
  const top = out?.plans[0], s = top?.spots[0];
  const better = out ? betterNearby(here, top ? out.score : 0, area) : [];
  const good = top && (top.spots[0].verdict === "Great" || top.spots[0].verdict === "Good");
  const occ = (slug: string) => isOcc(here, slug) ? " (only an occasional catch here)" : "";
  return <section className="card hero2">
    <p className="muted" style={{ margin: 0 }}>At {spotLabel(here.name)} today</p>
    {closed ? <div className="banner warn">⛔ This spot is closed: {here.info!.status!.note}</div> : !out ? <><div className="skel line" /><div className="skel line short" /></> : <>
      <div className="verdict-big"><VB v={top ? top.spots[0].verdict : "Poor"} /></div>
      {top && s ? <>
        <p className="headline">{good ? "Best here" : "Best chance here"}: {fishName(top.profile.name)}{occ(top.profile.slug)}, {spanTxt(s.from, s.to)}.</p>
        {reasons(top) && <p className="small">Why: {reasons(top)}.</p>}
        <p className="small">🪝 {top.profile.tip}</p>
        {nightNote(s) && <p className="small">{nightNote(s)}</p>}
        {!good && <p className="small"><b>Not a great day here.</b>{better.length ? " There's a better option nearby (below)." : " Nothing nearby is clearly better today either."}</p>}
      </> : <p><b>Nothing much is in season or biting here today.</b>{better.length ? " Try a nearby option below." : " Check the 7-day forecast for a better day."}</p>}
      {rain}{noWind}
      {out.plans.slice(1, 3).map((pl) => { const x = pl.spots[0];
        return <button key={pl.profile.slug} className="item tline" onClick={() => onPick(pl.profile.slug)}>
          <SpThumb name={pl.profile.name} size={56} /><span className="grow"><b>{pl.profile.name}</b> <VB v={pl.verdict} /><small className="block">Here · {spanTxt(x.from, x.to)}{isOcc(here, pl.profile.slug) ? " · occasional here" : ""}</small></span><span className="chev">›</span></button>; })}
      {top && <button className="btn wide" onClick={() => onPick(top.profile.slug)}>Why, and other spots ›</button>}
      {better.length > 0 && <div className="nearalt"><h3>Nearby alternatives – better today</h3>
        {better.map(({ pl, s: x }) => <button key={pl.profile.slug} className="item tline" onClick={() => onPick(pl.profile.slug)}>
          <span className="grow"><b>{pl.profile.name}</b> <VB v={x.verdict} /><small className="block">{spotLabel(x.spot.name)} · {Math.round(km(place, x.spot))} km · {spanTxt(x.from, x.to)}</small></span><span className="chev">›</span></button>)}</div>}
    </>}
    {foot}
  </section>;
}
