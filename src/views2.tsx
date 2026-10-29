import { PEOPLE, TIP_GROUPS, LEFT_OUT, personOf, type Cred } from "./data/tips";
import { useEffect, useMemo, useState } from "react";
import { SPECIES, bagText } from "./data/species";
import { REGS, MONTHS } from "./data/regs";
import { AREAS, type Area } from "./data/spotinfo";
import { REPORTS, NO_REPORTS, REPORT_CHECKED } from "./data/reports";
import { APP_NAME, APP_VERSION } from "./config";
import { type Place } from "./lib";
import { LAND, ALL_LAND, km, inSeasonHere, short, fromTxt } from "./where";
import { rateSpot, spanTxt, type SpotRating } from "./target";
import { useWx, VB } from "./targetviews";
import { fmt, dayEnd } from "./astro";
import { StaleNote } from "./stale";
const TZ = "Australia/Melbourne";
import { BASE, Ext, SpThumb, load, save } from "./ui";
import { BOM_CREDIT, BOM_DISCLAIMER } from "./tideviews";
import { seasonLabel } from "./fishviews";

export function Where({ place, onSpot, onMap }: { place: Place; onSpot: (id: string) => void; onMap: () => void }) {
  const { wx, failed } = useWx();
  const [mode, setMode] = useState<"now" | "today">("now");
  const [maxKm, setMaxKm] = useState<number>(() => load("rc-where-km", 0));
  const [area, setArea] = useState<Area | "all">("all");
  const [origin, setOrigin] = useState<Place>(place); const [gpsMsg, setGpsMsg] = useState("");
  useEffect(() => setOrigin(place), [place]);
  useEffect(() => save("rc-where-km", maxKm), [maxKm]);
  const gps = () => { setGpsMsg("Finding you…"); navigator.geolocation?.getCurrentPosition((p) => { setOrigin({ name: "My location", lat: p.coords.latitude, lon: p.coords.longitude }); setGpsMsg(""); }, () => setGpsMsg("Location blocked – using your chosen place instead."), { timeout: 15000, maximumAge: 300000 }); };
  const ranked = useMemo(() => {
    if (!wx && !failed) return [];
    const now = Date.now(), day = fmt(now, TZ).slice(0, 10), to = mode === "now" ? now + 3600000 : dayEnd(day, TZ);
    return LAND.filter((s) => area === "all" || s.info?.area === area).map((s) => ({ r: rateSpot(s, wx?.data[s.id], now, to), dist: km(origin, s) }))
      .filter((x): x is { r: SpotRating; dist: number } => !!x.r && (!maxKm || x.dist <= maxKm)).sort((a, b) => b.r.score - a.r.score || a.dist - b.dist);
  }, [wx, failed, mode, origin, maxKm, area]);
  const closed = ALL_LAND.filter((s) => s.info?.status?.closed);
  const m = new Date().getMonth() + 1;
  return <>
    <section className="card">
      <h2>📍 Where to fish</h2>
      <p className="muted small">The best land-based spots for {mode === "now" ? "right now" : "the rest of today"}, rated the same way as Today and Target a fish: wind, waves, rain, tide, time of day, moon and the fish in season at each spot.</p>
      <div className="seg">{(["now", "today"] as const).map((k) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{k === "now" ? "Right now" : "Rest of today"}</button>)}</div>
      <div className="chips" role="group" aria-label="Area">{(["all", ...Object.keys(AREAS)] as (Area | "all")[]).map((k) => <button key={k} className={area === k ? "on" : ""} onClick={() => setArea(k)}>{k === "all" ? "All areas" : AREAS[k].name}</button>)}</div>
      <div className="seg">{[0, 30, 60, 100].map((k) => <button key={k} className={maxKm === k ? "on" : ""} onClick={() => setMaxKm(k)}>{k ? `${k} km` : "Any"}</button>)}</div>
      <p className="muted small">Distance from: <b>{fromTxt(origin.name)}</b> · <button className="linkish" onClick={gps}>use my location</button> {gpsMsg}</p>
      <button className="btn alt wide" onClick={onMap}>🗺️ See all spots on the map</button>
    </section>
    {failed && !wx && <div className="banner warn">{navigator.onLine ? "Can't reach the weather service right now, so spots are rated on tide, time, moon and season only." : "You're offline, so spots are rated on tide, time, moon and season only."}</div>}
    {wx?.stale && <div className="banner">Using the wind forecast saved {Math.round((Date.now() - wx.at) / 60000)} min ago.</div>}
    {!wx && !failed && <><p className="muted small center">Checking wind at every spot…</p><div className="skel card-h tall" /><div className="skel card-h tall" /></>}
    {(wx || failed) && !ranked.length && <div className="card center">No spots match. Try a bigger distance or "All areas".</div>}
    {ranked.slice(0, 6).map(({ r, dist }, i) => { const tg = inSeasonHere(r.spot, m);
      const why = [...r.factors.filter((f) => f.pts > 0 && f.kind !== "season").sort((a, b) => b.pts - a.pts).slice(0, 2), ...r.factors.filter((f) => f.pts < 0).sort((a, b) => a.pts - b.pts).slice(0, 1)];
      return <section key={r.spot.id} className={`card wcard`}>
      <button className="cardbtn" onClick={() => onSpot(r.spot.id)}>
        <span className="row"><h3>{i + 1}. {r.spot.name}</h3><VB v={r.verdict} /></span>
        <span className="muted small block">{r.spot.info ? AREAS[r.spot.info.area].name : ""} · {Math.round(dist)} km away{r.windTxt ? ` · wind ${r.windTxt}` : ""}</span>
        <span className="block">⏰ <b>Best: {spanTxt(r.from, r.to)}</b> for {r.profile.name.toLowerCase().replace("king george", "King George").replace("australian", "Australian")}</span>
        <span className="block small">{why.map((f) => `${f.pts > 0 ? "✅" : "⚠️"} ${f.txt}`).join("  ")}</span>
        {tg.length > 0 && <span className="block small">🎯 <b>In season here:</b> {tg.map((o) => short(o.x)).join(", ")}{tg.some((o) => o.hot) ? ` · ⭐ VFA hot spot for ${tg.filter((o) => o.hot).map((o) => short(o.x)).join(", ")}` : ""}</span>}
        <span className="more">Spot guide, tides & tips ›</span>
      </button>
      <div className="row btns"><a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${r.spot.lat},${r.spot.lon}`} target="_blank" rel="noreferrer">🚗 Directions</a>
        <button className="btn alt" onClick={() => onSpot(r.spot.id)}>Open guide</button></div>
    </section>; })}
    {closed.length > 0 && <section className="card"><h3>⛔ Closed right now</h3>{closed.map((s) => <p key={s.id} className="small"><b>{s.name}</b> – {s.info!.status!.note} <Ext href={s.info!.status!.url}>Official update ↗</Ext> <StaleNote checked={s.info!.status!.asOf} what="closure" /></p>)}<p className="muted small">Closed spots are left out of the ranking. Status as of {closed[0].info!.status!.asOf}.</p></section>}
    <p className="muted small center">The rating is a guide only. It uses forecast wind, waves and rain, the VFA's seasons, official tide times and the moon. Always check conditions when you arrive and stay safe near the water.</p>
  </>;
}

export function ReportsTab() {
  const groups = (["all", ...Object.keys(AREAS)] as (Area | "all")[]);
  return <>
    <section className="card"><h2>📰 Local fishing reports</h2>
      <p className="muted small">Where real anglers and shops post what's biting, by area. These are other people's reports, so we link to the original. We opened every link on {REPORT_CHECKED} and it was working. <StaleNote checked={REPORT_CHECKED} what="reports" /></p>
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

export function More({ go }: { go: (k: "log" | "rules" | "about" | "tips") => void }) {
  const rows: [string, string, "log" | "rules" | "about" | "tips"][] = [["🧺", "Catch log – your own record", "log"], ["🪝", "Tips & rigs – the experts", "tips"], ["📏", "Rules, licence & safety", "rules"], ["ℹ️", `About ${APP_NAME}, credits & privacy`, "about"]];
  return <><section className="card"><h2>More</h2>{rows.map(([i, t, k]) => <button key={k} className="item moreitem" onClick={() => go(k)}><span>{i}</span><b>{t}</b><span className="chev">›</span></button>)}</section>
    <p className="muted small center">Version {APP_VERSION}</p></>;
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
    <section className="card"><h3>Size & bag limits</h3><p className="muted small">Checked against the <Ext href={REGS.sourceUrl}>{REGS.source}</Ext> on {REGS.checked}. <StaleNote checked={REGS.checked} what="limits" /> Tap a fish for its guide.</p>
      {sorted.map((s) => <button key={s.slug} className="sprow" onClick={() => onSpecies(s.slug)}><SpThumb name={s.name} /><b>{s.name}</b><span>{s.minCm && s.maxCm ? `${s.minCm}–${s.maxCm} cm only` : s.minCm ? `min ${s.minCm} cm` : "no min"} · bag {bagText(s).toLowerCase()}</span></button>)}
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

export const Credits = ({ by }: { by: Cred[] }) => <small className="block muted">Source: {by.map((c, i) => <span key={c.src}>{i > 0 ? "; " : ""}{personOf(c.p).name} – <Ext href={c.src}>{c.title} ↗</Ext></span>)}</small>;

export function TipsView({ onSpecies }: { onSpecies: (slug: string) => void }) {
  return <>
    <section className="card"><h2>🪝 Tips & rigs</h2>
      <p>Simple shore-fishing tips from four experts, grouped by topic and written in our own words. Each tip links to the video or article it came from.</p>
      <div className="chips">{TIP_GROUPS.map((g) => <button key={g.id} onClick={() => document.getElementById(`tip-${g.id}`)?.scrollIntoView({ behavior: "smooth" })}>{g.icon} {g.title}</button>)}</div>
    </section>
    {TIP_GROUPS.map((g) => <section key={g.id} className="card" id={`tip-${g.id}`}><h2>{g.icon} {g.title}</h2>
      {g.note && <p className="muted small">{g.note}</p>}
      <ul className="plain">{g.tips.map((t) => <li key={t.t}>{t.t}<Credits by={t.by} />
        {t.species && <small className="block">{t.species.map((sl, i) => { const sp = SPECIES.find((x) => x.slug === sl); return sp ? <span key={sl}>{i > 0 ? " · " : ""}<button className="linkish" onClick={() => onSpecies(sl)}>{sp.name} guide ›</button></span> : null; })}</small>}</li>)}</ul>
    </section>)}
    <section className="card"><h2>👥 The experts</h2>
      {PEOPLE.map((p) => <div key={p.id}><h3>{p.name}</h3><p className="muted small">{p.who}</p>{p.links.map((l, i) => <Ext key={l.u} href={l.u} cls={`big link-btn${i ? " alt" : ""}`}>{l.t} ↗</Ext>)}</div>)}
    </section>
    <p className="muted small center">{LEFT_OUT}</p>
  </>;
}
