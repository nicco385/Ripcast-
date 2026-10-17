import { useMemo } from "react";
import { SPECIES, speciesBySlug, bagText, sizeText } from "./data/species";
import { GUIDES, guideBySlug } from "./data/guides";
import { REGS, MONTHS } from "./data/regs";
import { YEAR, CAL_SOURCES } from "./data/calendar";
import { AREAS } from "./data/spotinfo";
import { ALL_LAND, seasonVal, short, km, type LandSpot } from "./where";
import { eventsBetween, nearestStation, clock, dayKey } from "./tides";
import { type Place } from "./lib";
import { Ext, SpThumb, BASE } from "./ui";

const TZ = "Australia/Melbourne";
const curMonth = () => new Date().getMonth() + 1;
const BAD = "#3a4448", OK = "#6f8a7a", GOOD = "#d9b77e", RUN = "#ff9d5c";

export function seasonLabel(slug: string, m = curMonth()) {
  const g = guideBySlug(slug); const v = seasonVal(slug, m);
  if (!g) return { v, t: "" };
  if (v === 3) return { v, t: "🔥 Peak run now" };
  if (v === 2) return { v, t: "✅ In season" };
  if (v === 1) return { v, t: "➖ Possible all year" };
  if (!g.best.length) return { v, t: "ℹ️ Season not verified" };
  return { v, t: "💤 Quiet this month" };
}

function MonthStrip({ slug }: { slug: string }) {
  const m = curMonth();
  return <div className="mstrip" role="img" aria-label="Season by month">{MONTHS.map((n, i) => { const v = seasonVal(slug, i + 1);
    return <div key={n} className={i + 1 === m ? "now" : ""}><i style={{ background: v === 3 ? RUN : v === 2 ? GOOD : v === 1 ? OK : BAD }} /><small>{n[0]}</small></div>; })}</div>;
}
export const SeasonKey = () => <p className="muted small"><i className="dot" style={{ background: RUN }} /> main run &nbsp;<i className="dot" style={{ background: GOOD }} /> in season &nbsp;<i className="dot" style={{ background: OK }} /> possible &nbsp;<i className="dot" style={{ background: BAD }} /> quiet</p>;

export function FishTab({ onOpen, onCal }: { onOpen: (slug: string) => void; onCal: () => void }) {
  const m = curMonth();
  const list = useMemo(() => [...SPECIES].sort((a, b) => seasonVal(b.slug, m) - seasonVal(a.slug, m) || a.name.localeCompare(b.name)), [m]);
  return <>
    <section className="card"><h2>🐟 Fish guides</h2>
      <p className="muted small">Tap a fish for where to find it from the shore, the right rig, bait, tackle, tips and the legal size. Sorted by what is in season in {MONTHS[m - 1]}.</p>
      <button className="big" onClick={onCal}>📅 What's biting – month by month</button>
      <SeasonKey />
    </section>
    {list.map((s) => { const sl = seasonLabel(s.slug); const g = guideBySlug(s.slug);
      return <button key={s.slug} className="card fishrow" onClick={() => onOpen(s.slug)}>
        <SpThumb name={s.name} size={96} />
        <span className="fr-txt"><b>{s.name}</b><small>{sl.t}</small><small>{s.minCm && s.maxCm ? `${s.minCm}–${s.maxCm} cm only` : s.minCm ? `Min ${s.minCm} cm` : "No min size"} · bag {bagText(s)}</small>{g?.trust === "low" && <small className="lowtrust">Limited information</small>}</span>
        <span className="chev" aria-hidden="true">›</span></button>; })}
    <p className="muted small center">Seasons come from the VFA's Go Fishing pages (Port Phillip Bay and Western Port). Guides are for fishing from the shore.</p>
  </>;
}

const Sec = ({ title, items }: { title: string; items: string[] }) => items.length ? <><h3>{title}</h3><ul className="plain">{items.map((t) => <li key={t}>{t}</li>)}</ul></> : null;

export function SpeciesView({ slug, onSpot }: { slug: string; onSpot: (id: string) => void }) {
  const sp = speciesBySlug(slug), g = guideBySlug(slug);
  const spots = useMemo(() => ALL_LAND.filter((s) => !s.info?.status?.closed && (s.species.includes(slug) || s.info?.hot?.includes(slug) || false))
    .sort((a, b) => Number(b.info?.hot?.includes(slug) ?? false) - Number(a.info?.hot?.includes(slug) ?? false) || Number(b.info?.src === "vfa") - Number(a.info?.src === "vfa")), [slug]);
  if (!sp || !g) return <div className="card">That fish was not found.</div>;
  const sl = seasonLabel(slug);
  return <>
    <section className="card spec-hero">
      <SpThumb name={sp.name} size={300} />
      {slug === "estuary-perch" && <p className="muted small" style={{ marginTop: 0 }}>Choc's 41 cm estuary perch, caught on a lure at Southbank.</p>}
      <h2>{sp.name}</h2>{sp.aka && <p className="muted small">Also called: {sp.aka}</p>}
      <p>{g.intro}</p>
      <div className="grid">
        <div className="stat"><small>Minimum size</small><b>{sizeText(sp)}</b></div>
        <div className="stat"><small>Bag limit</small><b>{bagText(sp)}</b>{sp.bagNote && <small>{sp.bagNote}</small>}</div>
      </div>
      {sp.measure && <p className="small">Measure: {sp.measure}.</p>}
      <p className="muted small">Size and bag limits checked against the VFA on {REGS.checked}. <Ext href={REGS.sourceUrl}>Check the latest ↗</Ext></p>
    </section>
    {g.trust !== "good" && <div className="banner warn">{g.trust === "low" ? "Limited information: we could not find strong sources for this fish from the shore, so treat this page as a rough guide." : "Some details here come from local angler reports rather than the VFA – treat them as a guide."}</div>}
    <section className="card">
      <h2>📅 When</h2><p><b>{sl.t}</b></p><MonthStrip slug={slug} /><SeasonKey /><p className="small">{g.seasonText}</p>
    </section>
    <section className="card"><h2>📍 Where from the shore</h2><Sec title="" items={g.where} />
      {spots.length > 0 && <><h3>Spots in this app</h3>{spots.slice(0, 8).map((s) => <button key={s.id} className="item" onClick={() => onSpot(s.id)}>{s.name}{s.info?.hot?.includes(slug) ? " ⭐ VFA hot spot" : ""}<small className="block muted">{AREAS[s.info?.area ?? "east"].name}</small></button>)}</>}
    </section>
    <section className="card"><h2>🕒 Best time & tide</h2><Sec title="" items={g.when} /><p className="muted small">See today's tide times on the Today tab.</p></section>
    <section className="card"><h2>🎣 Rig & tackle</h2><Sec title="Rig" items={g.rig} /><h3>Rod, reel and line</h3><p>{g.gear}</p><h3>Hook</h3><p>{g.hook}</p>
      <Sec title="Baits" items={g.baits} /><Sec title="Lures" items={g.lures} /></section>
    <section className="card"><h2>💡 Tips</h2><Sec title="" items={g.tips} /></section>
    <section className="card"><h2>🤝 Rules & looking after the fish</h2><Sec title="" items={g.care} />
      <p className="small">Always release undersize fish quickly and gently. Wet your hands first, and use pliers.</p></section>
    <section className="card"><h3>Sources</h3>{g.sources.map((s) => <p key={s.u} className="small"><Ext href={s.u}>{s.t} ↗</Ext></p>)}
      <p className="muted small">Gear sizes marked "typical" or "common practice" are general angler advice, not rules. Ask at a local tackle shop if you are unsure.</p></section>
  </>;
}

export function CalendarView({ onOpen }: { onOpen: (slug: string) => void }) {
  const m = curMonth();
  const cur = YEAR.find((y) => y.month === m)!;
  const list = [...GUIDES].filter((g) => g.best.length || g.yearRound).sort((a, b) => seasonVal(b.slug, m) - seasonVal(a.slug, m));
  return <>
    <section className="card hero2"><h2>📅 {MONTHS[m - 1]}: {cur.headline}</h2><ul className="plain">{cur.points.map((p) => <li key={p}>{p}</li>)}</ul></section>
    <section className="card"><h2>Season chart</h2><SeasonKey />
      {list.map((g) => { const sp = speciesBySlug(g.slug)!; return <button key={g.slug} className="calrow" onClick={() => onOpen(g.slug)}><span className="cn">{sp.name}</span><MonthStrip slug={g.slug} /></button>; })}
      <p className="muted small">Based on the VFA's peak seasons, with the main spring snapper run from other sources. Mulloway, kingfish, snook and Murray cod are left out – no reliable seasonal source. Estuary, golden and silver perch (city rivers and Albert Park Lake) use a rough warm-months guide from FishingMad, not an official VFA peak.</p>
    </section>
    {YEAR.filter((y) => y.month !== m).sort((a, b) => ((a.month - m + 12) % 12) - ((b.month - m + 12) % 12)).map((y) => <section key={y.month} className="card"><h3>{MONTHS[y.month - 1]} – {y.headline}</h3><ul className="plain">{y.points.map((p) => <li key={p}>{p}</li>)}</ul></section>)}
    <section className="card"><h3>Where this comes from</h3>{CAL_SOURCES.map((s) => <p key={s.u} className="small"><Ext href={s.u}>{s.t} ↗</Ext></p>)}
      <p className="muted small">Fish movements change from year to year with water temperature and weather. In 2025, for example, anglers said the snapper season started slowly because the water was cold. Treat this as a guide and read a recent report before you go.</p></section>
  </>;
}

export function SpotView({ spot, place, onBack, onMap, onUse, onSpecies }: { spot: LandSpot; place: Place; onBack: () => void; onMap: () => void; onUse: () => void; onSpecies: (slug: string) => void }) {
  void onBack;
  const i = spot.info, m = curMonth(), st = i?.fresh ? null : nearestStation(spot.lat, spot.lon), now = Date.now();
  const evs = st ? eventsBetween(st.station, now - 3 * 3600000, now + 30 * 3600000).filter((e) => e.t > now - 3 * 3600000).slice(0, 4) : [];
  const fish = [...new Set(spot.species)].map((x) => ({ x, v: seasonVal(x, m) })).sort((a, b) => b.v - a.v);
  return <>
    <section className="card">
      <h2>{spot.name}</h2>
      {i?.photo && <figure className="spotphoto"><img src={BASE + i.photo.src} alt={i.photo.cap} width={280} height={350} loading="lazy" /><figcaption>{i.photo.cap}</figcaption></figure>}
      <p className="muted small">{i ? AREAS[i.area].name : ""} · {spot.type} · {Math.round(km(place, spot))} km from {place.name}</p>
      {i?.status?.closed && <div className="banner danger">⛔ Closed. {i.status.note}<br /><Ext href={i.status.url}>Official update ↗</Ext> <small>(as of {i.status.asOf})</small></div>}
      {i?.fresh ? <p className="small">Fish list from VFA stocking records, Parks Victoria and FishingMad. A freshwater spot – <b>no tides here</b>.</p> : i?.src === "vfa" ? <p className="small">✅ Fish list and tips from the Victorian Fisheries Authority.</p> : <p className="muted small">General local knowledge – not an official VFA list.</p>}
      {!i?.status?.closed && <div className="row btns">
        <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}`} target="_blank" rel="noreferrer">🚗 Directions</a>
        <button className="btn alt" onClick={onMap}>🗺️ On the map</button></div>}
      {!i?.status?.closed && <button className="big" onClick={onUse}>Show conditions here</button>}
    </section>
    {fish.length > 0 && <section className="card"><h2>🐟 Fish here</h2>
      {fish.map(({ x, v }) => <button key={x} className="item fish-chip" onClick={() => onSpecies(x)}><SpThumb name={x} size={64} /><span><b>{speciesBySlug(x)?.name ?? short(x)}</b>{i?.hot?.includes(x) ? " ⭐" : ""}<small className="block muted">{seasonLabel(x).t || ""}</small></span><span className="chev">›</span></button>)}
      {i?.other?.length ? <p className="muted small">Also caught here{i.fresh ? "" : " (VFA)"}: {i.other.join(", ")}.</p> : null}
      {i?.hot?.length ? <p className="muted small">⭐ = the VFA names this spot as a hot spot for that fish.</p> : null}
    </section>}
    <section className="card"><h2>ℹ️ Know before you go</h2>
      {spot.depth && <p><b>Depth:</b> {spot.depth}</p>}
      <p><b>Access:</b> {spot.access}</p>
      {spot.tips && <p><b>Tips:</b> {spot.tips}</p>}
      {spot.windNote && <p><b>Wind:</b> {spot.windNote}</p>}
      {i?.noWind && <p className="muted small">We have not mapped which winds this spot is sheltered from – check the wind direction when you arrive.</p>}
    </section>
    {i?.report && <section className="card"><h2>🎣 Angler report</h2>{i.report.items.map((r) => <div key={r.t}><p className="small">{r.t}</p>{r.photo && <figure className="spotphoto" style={{ marginTop: 8 }}><img src={BASE + r.photo.src} alt={r.photo.cap} width={240} height={r.photo.src.includes("bream") ? 300 : 150} loading="lazy" style={r.photo.src.includes("snapper") ? { aspectRatio: "16/10" } : undefined} /><figcaption>{r.photo.cap}</figcaption></figure>}</div>)}
      <p className="small">{i.report.note}</p>
      <p className="small"><b>Snapper rules (VFA):</b> minimum 28 cm, bag 10, and no more than 3 may be 40 cm or longer. Keep whole until you are away from the water.</p><p className="small"><b>Black bream rules (VFA):</b> minimum 28 cm, bag 10 (combined with other bream and tarwhine), no maximum size here (the 38 cm maximum is only for the Gippsland Lakes). Keep whole until you are away from the water.</p></section>}
    {i?.rules && !i.fresh && <section className="card"><h2>📏 Rules here</h2>{i.rules.map((r) => <p key={r} className="small">{r}</p>)}<p className="small"><Ext href="https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/catch-limits-and-closed-seasons">VFA size and bag limits ↗</Ext></p></section>}
    {i?.eat && !i.fresh && <section className="card"><h2>🌙 Safety by the water</h2><p className="small">Fish with a friend if you can and tell someone where you are. Keep back from the edge – there is often no rail, the water is deep and cold, and the wall can be slippery. Wear a life jacket on rocks or if you are not a strong swimmer. Keep your gear out of the walkway and take all line and hooks home.</p></section>}
    {i?.fresh && <section className="card"><h2>📏 Rules for the perch here</h2>
      <p className="small"><b>Estuary perch:</b> min 27 cm, bag 5 (with Australian bass; no more than 2 bass).</p>
      {!i.eat && <p className="small"><b>Golden perch (yellowbelly):</b> min 30 cm, bag 5.</p>}
      {!i.eat && <p className="small"><b>Silver perch:</b> min 30 cm, bag 5 in Albert Park Lake (none may be taken from rivers north of the Great Dividing Range).</p>}
      <p className="small"><b>Redfin (English perch):</b> no size or bag limit. The VFA asks you not to put them back.</p>
      <p className="small"><b>Murray cod:</b> only 55–75 cm, bag {i.eat ? "1 in rivers" : "2 in Albert Park Lake"}. {i.eat ? "Closed 1 Sep–30 Nov in the Yarra River." : "The Sep–Nov closed season does not apply here (VFA)."}</p>
      <p className="small">Estuary perch{i.eat ? "" : ", golden perch, silver perch"} and Murray cod must be kept whole until you are away from the water. Carp must not be put back. {i.eat ? "" : "Parks Victoria says fish from Albert Park Lake are not suitable to eat and encourages catch and release."} VFA checked 17 Oct 2026.</p>
      <p className="small"><Ext href="https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/catch-limits-and-closed-seasons">VFA size and bag limits ↗</Ext></p></section>}
    {i?.eat && <section className="card"><h2>⚠️ Eating fish from the city rivers</h2>
      <p className="small">Health advice for the Lower Yarra and Maribyrnong: women who may become pregnant and children under 16 should not eat eel and should have no more than one 150 g serve a month of other fish; everyone else, no more than one eel serve a month and four serves of other fish a month. Fish from the Maribyrnong upstream of Solomons Ford (Avondale Heights) should not be eaten. Don't eat fish from flooded waters.</p>
      <p className="small"><Ext href="https://www.betterhealth.vic.gov.au/health/healthyliving/fishing-eat-your-catch-with-care">Better Health Channel ↗</Ext></p></section>}
    {st && evs.length > 0 && <section className="card"><h2>🌊 Tides</h2>
      <p className="muted small">Official BOM predictions for {st.station.name.replace(/ \(.*\)/, "")} ({Math.round(st.km)} km away).</p>
      {evs.map((e) => <div key={e.t} className="period"><b>{e.type === "High" ? "⬆ High" : "⬇ Low"} {clock(e.t, TZ)}</b><span>{dayKey(e.t, TZ) === dayKey(now, TZ) ? "Today" : "Tomorrow"} · {e.m.toFixed(2)} m</span></div>)}
      <p className="muted small">The VFA suggests fishing a few hours either side of high tide for most pier fish.</p>{i?.eat && <p className="muted small">River tides arrive later the further upstream you are – by how much we haven't verified, so allow extra time.</p>}</section>}
  </>;
}
