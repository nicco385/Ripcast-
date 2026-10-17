import { useEffect, useMemo, useState } from "react";
import { SPECIES } from "./data/species";
import { REGS, MONTHS } from "./data/regs";
import { AREAS, type Area } from "./data/spotinfo";
import { REPORTS, NO_REPORTS, REPORT_CHECKED } from "./data/reports";
import { APP_NAME, APP_VERSION } from "./config";
import { type Place } from "./lib";
import { LAND, ALL_LAND, getSpotWeather, rankSpot, km, type Rank } from "./where";
import { BASE, Ext, SpThumb, load, save } from "./ui";
import { BOM_CREDIT, BOM_DISCLAIMER } from "./tideviews";
import { seasonLabel } from "./fishviews";

export function Where({ place, onSpot, onMap }: { place: Place; onSpot: (id: string) => void; onMap: () => void }) {
  const [raw, setRaw] = useState<Awaited<ReturnType<typeof getSpotWeather>> | null>(null);
  const [err, setErr] = useState(""); const [mode, setMode] = useState<"now" | "today">("now");
  const [maxKm, setMaxKm] = useState<number>(() => load("rc-where-km", 0));
  const [area, setArea] = useState<Area | "all">("all");
  const [origin, setOrigin] = useState<Place>(place); const [gpsMsg, setGpsMsg] = useState("");
  useEffect(() => setOrigin(place), [place]);
  useEffect(() => save("rc-where-km", maxKm), [maxKm]);
  useEffect(() => { getSpotWeather().then(setRaw).catch(() => setErr(navigator.onLine ? "Can't reach the weather service right now, so spots can't be ranked. Try again in a minute." : "You're offline. Connect to the internet to rank spots.")); }, []);
  const gps = () => { setGpsMsg("Finding you…"); navigator.geolocation?.getCurrentPosition((p) => { setOrigin({ name: "My location", lat: p.coords.latitude, lon: p.coords.longitude }); setGpsMsg(""); }, () => setGpsMsg("Location blocked – using your chosen place instead."), { timeout: 15000, maximumAge: 300000 }); };
  const ranked: (Rank & { dist: number })[] = useMemo(() => !raw ? [] : LAND.filter((s) => raw.data[s.id] && (area === "all" || s.info?.area === area)).map((s) => ({ ...rankSpot(s, raw.data[s.id], mode), dist: km(origin, s) }))
    .filter((r) => !maxKm || r.dist <= maxKm).sort((a, b) => b.score - a.score), [raw, mode, origin, maxKm, area]);
  const closed = ALL_LAND.filter((s) => s.info?.status?.closed);
  return <>
    <section className="card">
      <h2>📍 Where to fish</h2>
      <p className="muted small">The best land-based spots for {mode === "now" ? "right now" : "today"}. Each pick weighs the wind and waves, the fish that are in season this month, and the tide.</p>
      <div className="seg">{(["now", "today"] as const).map((k) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{k === "now" ? "Right now" : "Today"}</button>)}</div>
      <div className="chips" role="group" aria-label="Area">{(["all", ...Object.keys(AREAS)] as (Area | "all")[]).map((k) => <button key={k} className={area === k ? "on" : ""} onClick={() => setArea(k)}>{k === "all" ? "All areas" : AREAS[k].name}</button>)}</div>
      <div className="seg">{[0, 30, 60, 100].map((k) => <button key={k} className={maxKm === k ? "on" : ""} onClick={() => setMaxKm(k)}>{k ? `${k} km` : "Any"}</button>)}</div>
      <p className="muted small">Distance from: <b>{origin.name}</b> · <button className="linkish" onClick={gps}>use my location</button> {gpsMsg}</p>
      <button className="btn alt wide" onClick={onMap}>🗺️ See all spots on the map</button>
    </section>
    {err && <div className="banner warn">{err}</div>}
    {!raw && !err && <><p className="muted small center">Checking wind at every spot…</p><div className="skel card-h tall" /><div className="skel card-h tall" /></>}
    {raw && !ranked.length && <div className="card center">No spots match. Try a bigger distance or "All areas".</div>}
    {ranked.slice(0, 6).map((r, i) => <section key={r.spot.id} className={`card wcard w-${r.badge}`}>
      <button className="cardbtn" onClick={() => onSpot(r.spot.id)}>
        <span className="row"><h3>{i + 1}. {r.spot.name}</h3><span className={`badge b-${r.badge}`}>{r.badge === "Good" ? "👍 " : r.badge === "OK" ? "👌 " : "👎 "}{r.badge}</span></span>
        <span className="muted small block">{r.spot.info ? AREAS[r.spot.info.area].name : ""} · {Math.round(r.dist)} km away · wind {Math.round(r.wind)} kn {r.dirTxt}{r.wave != null ? ` · waves ${r.wave.toFixed(1)} m` : ""}</span>
        <span className="big-txt block">{r.avoid ? "⚠️ " : ""}{r.reason}</span>
        <span className="block">⏰ <b>Best time:</b> {r.best}</span>
        {r.target.length > 0 && <span className="block">🎯 <b>In season here:</b> {r.target.join(", ")}{r.hot.length ? ` · ⭐ VFA hot spot for ${r.hot.join(", ")}` : ""}</span>}
        <span className="more">Spot guide, tides & tips ›</span>
      </button>
      <div className="row btns"><a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${r.spot.lat},${r.spot.lon}`} target="_blank" rel="noreferrer">🚗 Directions</a>
        <button className="btn alt" onClick={() => onSpot(r.spot.id)}>Open guide</button></div>
    </section>)}
    {closed.length > 0 && <section className="card"><h3>⛔ Closed right now</h3>{closed.map((s) => <p key={s.id} className="small"><b>{s.name}</b> – {s.info!.status!.note} <Ext href={s.info!.status!.url}>Official update ↗</Ext></p>)}<p className="muted small">Closed spots are left out of the ranking. Status as of {closed[0].info!.status!.asOf}.</p></section>}
    <p className="muted small center">The ranking is a guide only. It uses forecast wind and waves, the VFA's seasons for each fish and official tide times. Always check conditions when you arrive and stay safe near the water.</p>
  </>;
}

export function ReportsTab() {
  const groups = (["all", ...Object.keys(AREAS)] as (Area | "all")[]);
  return <>
    <section className="card"><h2>📰 Local fishing reports</h2>
      <p className="muted small">Where real anglers and shops post what's biting, by area. These are other people's reports, so we link to the original. We opened every link on {REPORT_CHECKED} and it was working.</p>
      <p className="small"><b>Tip:</b> check the date at the top of a report. A weekly report is only useful for about a week.</p>
    </section>
    {groups.map((a) => { const items = REPORTS.filter((r) => a === "all" ? r.areas.includes("all") : r.areas.includes(a) && !r.areas.includes("all"));
      if (!items.length && !(a !== "all" && NO_REPORTS[a])) return null;
      return <section key={a} className="card"><h3>{a === "all" ? "Whole bay & Western Port (start here)" : AREAS[a].name}</h3>{a !== "all" && <p className="muted small">{AREAS[a].blurb}</p>}
        {items.map((r) => <Ext key={r.u} href={r.u} cls="rep"><b>{r.t} ↗</b><small>{r.by} · {r.how}</small>{r.note && <small>{r.note}</small>}</Ext>)}
        {a !== "all" && NO_REPORTS[a] && <p className="muted small">{NO_REPORTS[a]}</p>}</section>; })}
    <section className="card"><h3>Also useful</h3>
      <Ext href="https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-port-phillip-bay" cls="rep"><b>VFA – Go Fishing: Port Phillip Bay ↗</b><small>Official list of piers, what is caught there and amenities</small></Ext>
      <Ext href="https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-western-port" cls="rep"><b>VFA – Go Fishing: Western Port ↗</b><small>Flinders, Hastings, Stony Point, Tooradin, San Remo, Cowes and more</small></Ext>
      <Ext href="http://www.bom.gov.au/australia/tides/#!/vic" cls="rep"><b>BOM tide tables ↗</b><small>Official tide predictions</small></Ext>
      <p className="muted small">Tackle shops are a great source: ask what's biting when you buy bait. Please don't rely on social media groups for safety or rules – use the VFA.</p>
    </section>
  </>;
}

export function More({ go }: { go: (k: "log" | "rules" | "about") => void }) {
  const rows: [string, string, "log" | "rules" | "about"][] = [["🧺", "Catch log – your own record", "log"], ["📏", "Rules, licence & safety", "rules"], ["ℹ️", `About ${APP_NAME}, credits & privacy`, "about"]];
  return <><section className="card"><h2>More</h2>{rows.map(([i, t, k]) => <button key={k} className="item moreitem" onClick={() => go(k)}><span>{i}</span><b>{t}</b><span className="chev">›</span></button>)}</section>
    <p className="muted small center">Version {APP_VERSION}</p></>;
}

type Catch = { id: string; species: string; cm?: number; kept: boolean; notes: string; at: string; where: string };
export function Log({ place }: { place: Place }) {
  const [list, setList] = useState<Catch[]>(() => load("rc-log", []));
  const [sp, setSp] = useState(SPECIES[0].name); const [cm, setCm] = useState(""); const [kept, setKept] = useState(false); const [notes, setNotes] = useState("");
  useEffect(() => save("rc-log", list), [list]);
  const info = SPECIES.find((s) => s.name === sp);
  const tooSmall = info?.minCm && cm && +cm < info.minCm;
  const add = (e: React.FormEvent) => { e.preventDefault(); setList([{ id: String(Date.now()), species: sp, cm: cm ? +cm : undefined, kept, notes, at: new Date().toISOString(), where: place.name }, ...list]); setCm(""); setNotes(""); setKept(false); };
  return <>
    <form className="card" onSubmit={add}>
      <h2>Add a catch</h2>
      <label>Fish<select value={sp} onChange={(e) => setSp(e.target.value)}>{SPECIES.map((s) => <option key={s.slug}>{s.name}</option>)}<option>Other</option></select></label>
      <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}><SpThumb name={sp} size={84} /><p className="muted small" style={{ margin: 0 }}>{info ? <>Min size: {info.minCm ? `${info.minCm} cm` : "none"} · Bag limit: {info.bag}{info.bagNote ? ` (${info.bagNote})` : ""}</> : "Pick a fish to see its legal size."}</p></div>
      <label>Length (cm)<input inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="optional" /></label>
      {tooSmall && <div className="banner danger">Under the {info!.minCm} cm legal size – please release it.</div>}
      <label className="check"><input type="checkbox" checked={kept} onChange={(e) => setKept(e.target.checked)} /> I kept it</label>
      <label>Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="bait, rig, tide…" /></label>
      <p className="muted small">Spot: {place.name}</p>
      <button className="big">Save catch</button>
    </form>
    {list.length === 0 && <div className="card empty"><SpThumb name="Snapper" size={120} /><h3>No catches yet</h3><p className="muted small">Your first fish will show up here. Catches are saved on this phone only.</p></div>}
    {list.map((c) => <div key={c.id} className="card row catch"><SpThumb name={c.species} size={64} /><div className="grow"><b>{c.species}{c.cm ? ` · ${c.cm} cm` : ""}</b> {c.kept ? "🧺 kept" : "↩ released"}<div className="muted small">{new Date(c.at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} · {c.where}</div>{c.notes && <div className="small">{c.notes}</div>}</div>
      <button className="icon" aria-label="Delete" onClick={() => confirm("Delete this catch?") && setList(list.filter((x) => x.id !== c.id))}>🗑</button></div>)}
  </>;
}

export function Rules({ onSpecies }: { onSpecies: (slug: string) => void }) {
  const sorted = useMemo(() => [...SPECIES].sort((a, b) => a.name.localeCompare(b.name)), []);
  return <>
    <section className="card"><h2>📏 Victorian fishing rules</h2>
      <p>Rules change – always check the official guide before you keep fish.</p>
      <Ext href={REGS.sourceUrl} cls="big link-btn">Official size & bag limits (VFA) ↗</Ext>
      <Ext href="https://vfa.vic.gov.au/recreational-fishing/fishing-licence" cls="big link-btn alt">Buy a fishing licence ↗</Ext>
      <p className="small">{REGS.licence}</p><p className="small">{REGS.parks}</p><p className="small">{REGS.intertidal}</p><p className="small">{REGS.fillet}</p><p className="small">{REGS.report}</p>
    </section>
    <section className="card"><h3>Eating your catch safely</h3>
      <p className="small">Keep fish cold straight away. Only collect shellfish where the water is clean – never near marinas, stormwater outlets or after heavy rain. Fish from the Lower Yarra and Maribyrnong rivers have health advice; the Maribyrnong upstream of Solomons Ford (Avondale Heights) should not be eaten.</p>
      <p className="small"><Ext href="https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/food-safety">VFA – Eating your catch safely ↗</Ext><br /><Ext href="https://www.betterhealth.vic.gov.au/health/healthyliving/fishing-eat-your-catch-with-care">Better Health Channel – Yarra & Maribyrnong ↗</Ext></p></section>
    <section className="card"><h3>Stay safe</h3><ul className="plain small"><li>Wear a life jacket on rocks and breakwalls, and keep back from the edge in big seas.</li><li>Tell someone where you are going. Don't fish alone in rough weather.</li><li>Watch for blue-ringed octopus in rock pools and around pylons – never touch one.</li><li>Check for closures and marine park boundaries – no fishing inside marine sanctuaries.</li></ul></section>
    <section className="card"><h3>Size & bag limits</h3><p className="muted small">Checked against the <Ext href={REGS.sourceUrl}>{REGS.source}</Ext> on {REGS.checked}. Tap a fish for its guide.</p>
      {sorted.map((s) => <button key={s.slug} className="sprow" onClick={() => onSpecies(s.slug)}><SpThumb name={s.name} /><b>{s.name}</b><span>{s.minCm ? `min ${s.minCm} cm` : "no min"} · bag {s.bag}</span></button>)}
      <p className="muted small">{REGS.defaultBag} Month names: {MONTHS.join(", ")}.</p>
    </section>
  </>;
}

export function About() {
  return <section className="card" id="about"><h2>ℹ️ About {APP_NAME}</h2>
    <p className="small"><b>Privacy:</b> no accounts, ads or trackers. Your catch log and saved spots are stored only on this phone. If you allow location, it's used on the phone to sort spots by distance. To get the forecast, the spot's coordinates are sent to Open-Meteo; we never receive them. <a href={`${BASE}privacy.html`}>Full privacy policy</a></p>
    <p className="small"><b>Disclaimer:</b> scores and spot picks are a guide only, not a guarantee. Tide times are the Bureau of Meteorology's predictions but real water levels can differ with wind and air pressure. Always check the <Ext href="http://www.bom.gov.au/vic/">Bureau of Meteorology</Ext> forecasts and warnings and the <Ext href="https://vfa.vic.gov.au/">VFA</Ext> rules before you go. Fish safely: keep off rock ledges in big swell, wear a life jacket on rocks, and never fish alone in rough conditions.</p>
    <p className="small"><b>Where the information comes from:</b> fish seasons, spot details and tips from the Victorian Fisheries Authority's Go Fishing pages and the weekly Pelican's Pick; month-by-month movements from FishingMad's weekly reports, Peninsula Insider and Compleat Angler. Where we found no reliable source we say so. Gear sizes are general angler advice.</p>
    <p className="small"><b>Credits:</b> tides: {BOM_CREDIT} Weather & marine data by <Ext href="https://open-meteo.com/">Open-Meteo.com</Ext> (CC BY 4.0). Map data and marine park outlines © <Ext href="https://www.openstreetmap.org/copyright">OpenStreetMap</Ext> contributors (ODbL). Rules: Victorian Fisheries Authority. Fonts: Barlow Condensed and Outfit (SIL Open Font License).</p>
    <p className="muted small">{BOM_DISCLAIMER}</p>
    <p className="muted small">Version {APP_VERSION} · rules checked {REGS.checked} · tide tables to 31 Dec 2027</p>
  </section>;
}
void seasonLabel;
