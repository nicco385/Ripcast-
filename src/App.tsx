import { lazy, Suspense, useCallback, useEffect, useState } from "react";
const MapTab = lazy(() => import("./MapTab"));
import { AREAS, type Area } from "./data/spotinfo";
import {
  type Forecast, type Place, getForecast, searchPlaces, reverseName, compass, kmh, hhmm, dayName, weatherText,
  moonInfo, safety, localNowKey,
} from "./lib";
import { APP_NAME, TAGLINE } from "./config";
import { LAND, ALL_LAND, nearName, spotAt } from "./where";
import { useNav, type Tab, type View } from "./nav";
import { Arrow, Ico, Stat, Back, BASE, load, save, spImg } from "./ui";
import { TideCard, TidesView } from "./tideviews";
import { MoonCard, SolunarView } from "./moonviews";
import { TargetPicker, TargetView, FishingToday, VB, useWx } from "./targetviews";
import { InstallPrompt } from "./install";
import { rainLast24, dayOutlook, spanTxt, type DayOutlook } from "./target";
import { FishTab, SpeciesView, CalendarView, SpotView } from "./fishviews";
import { Where, ReportsTab, More, Rules, About, TipsView } from "./views2";
import { Log } from "./catchlog";

const DEFAULT: Place = { name: "Williamstown, VIC", lat: -37.8635, lon: 144.9056 };
// older versions named map taps "Map spot -37.867, 144.913" – never show raw numbers
const fixName = (p: Place): Place => /^Map spot -?\d/.test(p.name) ? { ...p, name: nearName(p), fromMap: true } : p;
const TITLES: Record<string, string> = { spot: "Spot guide", species: "Fish guide", tides: "Tides", week: "7 days", map: "Map", picker: "Choose a spot", calendar: "What's biting", target: "Target a fish", log: "Catch log", rules: "Rules & safety", about: "About", tips: "Tips & rigs" };

export default function App() {
  const { nav, push, back, go } = useNav();
  const [place, setPlace] = useState<Place>(() => fixName(load("rc-place", DEFAULT)));
  const [favs, setFavs] = useState<Place[]>(() => load<Place[]>("rc-favs", []).map(fixName));
  const [data, setData] = useState<Forecast | null>(() => load<Forecast | null>("rc-cache", null));
  const [, setTick] = useState(0);
  // Keep every "now" (tide chart marker, rising/falling, best times) current: redraw each 30 s and when the app comes back on screen.
  useEffect(() => { const bump = () => setTick((n) => n + 1); const t = setInterval(bump, 30000); const v = () => { if (document.visibilityState === "visible") bump(); };
    document.addEventListener("visibilitychange", v); window.addEventListener("focus", bump); window.addEventListener("pageshow", bump);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", v); window.removeEventListener("focus", bump); window.removeEventListener("pageshow", bump); }; }, []);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState(true);

  const refresh = useCallback(async (p: Place) => {
    setLoading(true); setErr("");
    try { const f = await getForecast(p); setData(f); save("rc-cache", f); }
    catch {
      // never show another place's cached weather as if it were this place
      const cached = load<Forecast | null>("rc-cache", null);
      const same = !!cached && cached.place.name === p.name;
      if (!same) setData(null);
      const when = same && cached ? ` Showing the last saved data from ${new Date(cached.fetchedAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}.` : "";
      setErr(!navigator.onLine ? `You're offline.${when || " Connect to the internet to see conditions."}` : `Can't reach the weather service right now (mobile signal or network).${when || ""} Tap ⟳ to try again.`);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { save("rc-place", place); refresh(place); }, [place, refresh]);
  useEffect(() => { save("rc-favs", favs); }, [favs]);
  useEffect(() => { const on = () => refresh(place); window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, [place, refresh]);
  useEffect(() => { const t = setInterval(() => refresh(place), 15 * 60000); return () => clearInterval(t); }, [place, refresh]);

  const isFav = favs.some((f) => f.name === place.name);
  const toggleFav = () => setFavs(isFav ? favs.filter((f) => f.name !== place.name) : [...favs, place]);
  const shown = data && data.place.name === place.name ? data : null;
  const v = nav.view;
  const openSpot = (id: string) => push({ view: { k: "spot", id } });
  const openSpecies = (slug: string) => push({ view: { k: "species", slug } });
  const usePlace = (p: Place) => {
    setPlace(p); push({ tab: "today", view: null });
    // map taps get a friendly offline name straight away, then the suburb name if we can look it up
    if (p.fromMap) reverseName(p.lat, p.lon).then((n) => { if (n) setPlace((cur) => cur.lat === p.lat && cur.lon === p.lon ? { ...cur, name: `Near ${n}` } : cur); });
  };
  const spot = v?.k === "spot" ? ALL_LAND.find((s) => s.id === v.id) : undefined;
  const openTarget = (slug?: string) => push({ view: { k: "target", slug } });
  const rain24 = rainLast24(shown);
  const needsWx = !v && nav.tab === "today" || v?.k === "week";

  return (
    <div className="app">
      {cover && <Cover onStart={(g) => { if (g) push({ tab: g.tab, view: g.view ?? null }); setCover(false); }} />}
      <header className="top">
        {v ? <Back onClick={back} /> : null}
        <button className="place" onClick={() => push({ view: { k: "picker" } })} aria-label={`📍 ${place.name} change`}>
          📍 <span>{place.name}</span> <small>change</small>
        </button>
        <button className="icon" onClick={toggleFav} aria-label={isFav ? "Remove from favourites" : "Save as favourite"}>{isFav ? "★" : "☆"}</button>
        <button className="icon" onClick={() => refresh(place)} aria-label="Refresh" disabled={loading}>{loading ? "…" : "⟳"}</button>
      </header>
      {err && <div className="banner warn">{err}</div>}
      <main key={`${nav.tab}-${v ? JSON.stringify(v) : ""}`} className="fade">
        {v && <h1 className="pagetitle">{TITLES[v.k]}</h1>}
        {needsWx && !shown && !err && <><div className="skel card-h" /><div className="skel card-h tall" /><div className="skel card-h" /></>}
        {!v && nav.tab === "today" && shown && <Today f={shown} stale={shown.place.name !== place.name} place={place} onTides={() => push({ view: { k: "tides" } })} onSolunar={() => push({ view: { k: "solunar" } })} onWeek={() => push({ view: { k: "week" } })} rain24={rain24} onTarget={openTarget} />}
        {!v && nav.tab === "today" && !shown && err && <TodayOffline place={place} onTides={() => push({ view: { k: "tides" } })} onSolunar={() => push({ view: { k: "solunar" } })} />}
        {!v && nav.tab === "where" && <Where place={place} onSpot={openSpot} onMap={() => push({ view: { k: "map" } })} />}
        {!v && nav.tab === "fish" && <FishTab onOpen={openSpecies} onCal={() => push({ view: { k: "calendar" } })} onTarget={() => openTarget()} onTips={() => push({ view: { k: "tips" } })} />}
        {!v && nav.tab === "reports" && <ReportsTab />}
        {!v && nav.tab === "more" && <More go={(k) => push({ view: { k } as View })} />}
        {v?.k === "week" && shown && <Week f={shown} place={place} rain24={rain24} />}
        {v?.k === "tides" && <TidesView place={place} />}
        {v?.k === "solunar" && <SolunarView place={place} />}
        {v?.k === "spot" && (spot ? <SpotView spot={spot} place={place} onBack={back} onMap={() => push({ view: { k: "map", focus: spot.id } })} onUse={() => usePlace({ name: spot.name, lat: spot.lat, lon: spot.lon })} onSpecies={openSpecies} /> : <div className="card">That spot was not found.</div>)}
        {v?.k === "species" && <SpeciesView slug={v.slug} onSpot={openSpot} onTarget={openTarget} onTips={() => push({ view: { k: "tips" } })} />}
        {v?.k === "target" && !v.slug && <TargetPicker onPick={openTarget} />}
        {v?.k === "target" && v.slug && <TargetView slug={v.slug} place={place} rain24={rain24} onSpot={openSpot} onSpecies={openSpecies} />}
        {v?.k === "calendar" && <CalendarView onOpen={openSpecies} />}
        {v?.k === "picker" && <Picker favs={favs} onPick={usePlace} onRemoveFav={(p) => setFavs(favs.filter((f) => f.name !== p.name))} />}
        {v?.k === "map" && <Suspense fallback={<div className="skel map" />}><MapTab place={place} focus={v.focus ?? null} onPick={usePlace} onOpen={openSpot} /></Suspense>}
        {v?.k === "log" && <Log place={place} />}
        {v?.k === "rules" && <Rules onSpecies={openSpecies} />}
        {v?.k === "about" && <About />}
        {v?.k === "tips" && <TipsView onSpecies={openSpecies} />}
        {v && v.k !== "picker" && <button className="btn alt wide backbottom" onClick={back}>‹ Back</button>}
        <p className="muted small center foot">Tides: Bureau of Meteorology · Weather: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (CC BY 4.0) · Map © OpenStreetMap</p>
      </main>
      <nav className="tabs" aria-label="Main">
        {([["today", "Today"], ["where", "Where"], ["fish", "Fish"], ["reports", "Reports"], ["more", "More"]] as const).map(([k, l]) => (
          <button key={k} className={nav.tab === k ? "on" : ""} onClick={() => go(k)} aria-current={nav.tab === k ? "page" : undefined}><Ico n={k} />{l}</button>
        ))}
      </nav>
    </div>
  );
}

/** Shown when the weather cannot load: the tide tables are built in, so tides still work offline. */
function TodayOffline({ place, onTides, onSolunar }: { place: Place; onTides: () => void; onSolunar: () => void }) {
  return <><div className="card"><h2>Weather isn't available</h2><p className="muted small">Tides and fish guides still work without a signal.</p></div><TideCard place={place} onMore={onTides} /><MoonCard place={place} onMore={onSolunar} /></>;
}

function Picker({ favs, onPick, onRemoveFav }: { favs: Place[]; onPick: (p: Place) => void; onRemoveFav: (p: Place) => void }) {
  const [q, setQ] = useState(""); const [res, setRes] = useState<Place[]>([]); const [msg, setMsg] = useState("");
  const go = async (e?: React.FormEvent) => {
    e?.preventDefault(); if (!q.trim()) return; setMsg("Searching…");
    try { const r = await searchPlaces(q.trim()); setRes(r); setMsg(r.length ? "" : "No places found. Try a suburb or town name."); } catch { setMsg("Search failed – check your connection."); }
  };
  const gps = () => {
    if (!navigator.geolocation) return setMsg("Your device doesn't support location.");
    setMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (p) => onPick({ name: "My location", lat: +p.coords.latitude.toFixed(4), lon: +p.coords.longitude.toFixed(4) }),
      () => setMsg("Location was blocked or unavailable. Search for a place instead."), { timeout: 15000, maximumAge: 300000 });
  };
  return (
    <section className="card">
        <h2>Choose a spot</h2>
        <button className="big" onClick={gps}>📡 Use my current location</button>
        <form onSubmit={go} className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a town, beach or pier" /><button className="btn">Search</button></form>
        {msg && <p className="muted">{msg}</p>}
        {res.map((p) => <button key={p.name + p.lat} className="item" onClick={() => onPick(p)}>{p.name}</button>)}
        {favs.length > 0 && <><h3>★ Saved spots</h3>{favs.map((p) => <div key={p.name} className="row"><button className="item grow" onClick={() => onPick(p)}>{p.name}</button><button className="icon" onClick={() => onRemoveFav(p)} aria-label="Remove">🗑</button></div>)}</>}
        <h3>Fishing spots</h3>{(Object.keys(AREAS) as Area[]).map((a) => <div key={a}><p className="muted small areahead">{AREAS[a].name}</p>{LAND.filter((s) => s.info?.area === a).map((s) => <button key={s.id} className="item" onClick={() => onPick({ name: s.name, lat: s.lat, lon: s.lon })}>{s.name}</button>)}</div>)}
      </section>
  );
}


const FI: Record<string, string> = {
  loc: "M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  time: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  wx: "M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18zM16 3v1M20.5 5.5l-.7.7M22 10h-1",
  sp: "M2 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM7.5 11h.01",
  rig: "M3 21L17 5M17 5c2 3 3 6 3 9M20 14v1M18.5 16.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M7 17l2 2",
  tips: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7M8 11h5",
};
type Go = { tab: Tab; view?: View };
const FEATS: [Go, string, string][] = [[{ tab: "where" }, "Locations", "loc"], [{ tab: "fish", view: { k: "target" } }, "Target a fish", "sp"], [{ tab: "today", view: { k: "tides" } }, "Tide times", "time"], [{ tab: "fish" }, "Fish guides", "sp"], [{ tab: "fish", view: { k: "calendar" } }, "What's biting", "rig"], [{ tab: "reports" }, "Reports", "tips"]];
const SPECIES_STRIP = ["Snapper", "Squid", "Whiting", "Garfish", "Flathead", "Mulloway", "Bream", "Estuary Perch"];
const LeapFish = () => <svg className="leap" viewBox="0 0 64 40" aria-hidden="true"><path d="M4 31C14 12 34 4 50 9l9-6-3 10 5 8-11-4C40 26 22 31 4 31z" fill="#fff" /><circle cx="14" cy="25" r="1.8" fill="#0b2a55" /><path d="M24 20c8-6 16-8 24-7" stroke="#0b2a55" strokeWidth="1.6" fill="none" /><path d="M2 36q8-3 16 0t16 0" stroke="#f5b83d" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>;

function Cover({ onStart }: { onStart: (g?: Go) => void }) {
  const [out, setOut] = useState(false);
  const go = (t?: Go) => { if (out) return; setOut(true); setTimeout(() => onStart(t), 380); };
  return <div className={`cover ${out ? "out" : ""}`} onClick={() => go()}>
    <div className="cover-hero" aria-hidden="true"><img src={`${BASE}cover-hero.webp`} alt="" width="1280" height="720" fetchPriority="high" decoding="async" /></div>
    <div className="cover-in">
      <header className="brand-wrap">
        <div className="brand"><h1 className="wordmark">{APP_NAME}</h1><LeapFish /></div>
        <p className="sub">Land-Based Fishing</p>
        <p className="tagline">{TAGLINE}</p>
      </header>
      <p className="script">Better decisions.<br />More bites.<br />Get out there.</p>
      <div className="spacer" />
      <button className="start" onClick={(e) => { e.stopPropagation(); go(); }}>Start fishing<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      <nav className="feats" aria-label="Shortcuts">{FEATS.map(([t, l, i]) => <button key={l} onClick={(e) => { e.stopPropagation(); go(t); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={FI[i]} /></svg>{l}</button>)}</nav>
      <p className="kicker">Your Victorian land-based fishing assistant</p>
      <div className="strip">{SPECIES_STRIP.map((n) => <figure key={n} className="sp"><img src={spImg(n)!} alt="" loading="lazy" decoding="async" width="480" height="270" /><figcaption>{n}</figcaption></figure>)}</div>
      <p className="places">Port Phillip <i>|</i> Western Port <i>|</i> Yarra <i>|</i> Geelong</p>
    </div>
  </div>;
}


function Today({ f, stale, place, onTides, onSolunar, onWeek, rain24, onTarget }: { f: Forecast; stale: boolean; place: Place; onTides: () => void; onSolunar: () => void; onWeek: () => void; rain24: number | null; onTarget: (slug?: string) => void }) {
  const n = f.now; const [ico, txt] = weatherText(n.code);
  const warn = safety(f);
  const nowKey = localNowKey(f.tz);
  const cur = f.hours.find((h) => h.time >= nowKey);
  const age = Math.round((Date.now() - f.fetchedAt) / 60000);
  return (
    <>
      {stale && <div className="banner">Loading new spot… showing {f.place.name} for now.</div>}
      {warn.map((w) => <div key={w} className="banner danger">⚠️ {w}</div>)}
      <FishingToday place={place} rain24={rain24} onOpen={() => onTarget()} onPick={(s) => onTarget(s)} />
      <InstallPrompt />
      <section className="card">
        <div className="now"><span className="bigico">{ico}</span><div><b className="xl">{Math.round(n.temp)}°</b> <span className="muted">feels {Math.round(n.feels)}°</span><div>{txt}</div></div></div>
        <div className="grid">
          <Stat k="Wind" v={<><Arrow deg={n.dir} size={22} /> {Math.round(n.wind)} kn</>} s={`${kmh(n.wind)} km/h from ${compass(n.dir)}`} />
          <Stat k="Gusts" v={`${Math.round(n.gust)} kn`} s={`${kmh(n.gust)} km/h`} />
          <Stat k="Rain chance" v={`${cur?.rainChance ?? 0}%`} s={`${f.days[0].rainSum.toFixed(1)} mm today`} />
          {f.hasMarine && cur?.wave != null ? <Stat k="Waves" v={`${cur.wave.toFixed(1)} m`} s={cur.swell != null ? `swell ${cur.swell.toFixed(1)} m` : ""} />
            : f.hasMarine && cur?.seaTemp != null ? <Stat k="Water temp" v={`${cur.seaTemp.toFixed(1)}°`} s="sea surface" />
            : <Stat k="Pressure" v={`${Math.round(n.pressure)} hPa`} />}
        </div>
        <p className="muted small">Updated {age < 1 ? "just now" : `${age} min ago`} · Open-Meteo{f.inBay ? " · inside the bay, go by the wind (no wave model)" : ""}</p>
        <button className="btn alt wide" onClick={onWeek}>Next 24 hours & 7-day forecast ›</button>
      </section>
      <TideCard place={place} onMore={onTides} compact />
      <MoonCard place={place} onMore={onSolunar} />
    </>
  );
}

function Week({ f, place, rain24 }: { f: Forecast; place: Place; rain24: number | null }) {
  const [open, setOpen] = useState(0);
  const { wx, loading } = useWx();
  const [outs, setOuts] = useState<DayOutlook[] | null>(null);
  useEffect(() => { if (loading) return; const id = setTimeout(() => setOuts(f.days.map((d) => dayOutlook(wx?.data ?? null, d.date, { origin: place, rain24, only: spotAt(place) }))), 0); return () => clearTimeout(id); }, [wx, loading, f, place.lat, place.lon, rain24]);
  const nowKey = localNowKey(f.tz);
  const next = f.hours.filter((h) => h.time >= nowKey).slice(0, 24);
  return <>
    <section className="card">
      <h2>⏱ Next 24 hours</h2>
      <div className="hours">
        {next.map((h) => { const [i] = weatherText(h.code); return (
          <div key={h.time} className={`hr ${h.gust >= 28 ? "bad" : ""}`}>
            <small>{hhmm(h.time).replace(":00", "")}</small><span>{i}</span><b>{Math.round(h.temp)}°</b>
            <span className="wind"><Arrow deg={h.dir} size={16} />{Math.round(h.wind)}</span>
            <small>g{Math.round(h.gust)}</small><small>💧{h.rainChance}%</small>
            {h.wave != null && <small>🌊{h.wave.toFixed(1)}</small>}
          </div>); })}
      </div>
      <p className="muted small">Wind in knots (kn). Arrow shows where the wind is blowing to. g = gusts.</p>
    </section>
    <section className="card"><h2>7-day forecast</h2><p className="muted small">Each day is rated the same way as Today and Target a fish. Tap a day for details.</p></section>
    {f.days.map((d, i) => { const o = outs?.[i]; const [ico, txt] = weatherText(d.code); const m = moonInfo(new Date(d.date + "T12:00:00")); const top = o?.plans[0], s = top?.spots[0];
      return (
        <section key={d.date} className="card day" onClick={() => setOpen(open === i ? -1 : i)}>
          <div className="row"><div><b>{dayName(d.date, i)}</b><div className="muted">{ico} {txt} · {Math.round(d.tMin)}–{Math.round(d.tMax)}°</div>
            <div className="muted small">Wind up to {Math.round(d.windMax)} kn {compass(d.dir)}, gusts {Math.round(d.gustMax)} · Rain {d.rainChance}%{d.rainSum >= 1 ? ` (${d.rainSum.toFixed(0)} mm)` : ""} · {m.icon}</div></div>
            {o ? <VB v={o.verdict} /> : <div className="skel line short" style={{ width: 70 }} />}</div>
          {top && s && <div className="small">🎯 Best: <b>{top.profile.name}</b> at {s.spot.name}, {spanTxt(s.from, s.to)}</div>}
          {open === i && o && <>
            {s && <ul className="reasons">{s.factors.filter((x) => x.pts !== 0).sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts)).slice(0, 5).map((x) => <li key={x.txt}>{x.pts > 0 ? "👍" : "👎"} {x.txt}</li>)}</ul>}
            {o.showery ? <p className="small">🌧️ Rain likely for much of the day, so it can't rate above Fair.</p> : o.damp && o.verdict === "Good" ? <p className="small">🌦️ Some rain about, so the day rates Good at best.</p> : null}
            {o.noWind && <p className="muted small">No spot wind forecast for this day yet – rated on tide, time, moon and season only.</p>}
            <div className="muted small">Sunrise {hhmm(d.sunrise)} · Sunset {hhmm(d.sunset)}</div></>}
          {open !== i && <div className="muted small">Tap for details</div>}
        </section>); })}
    <p className="muted small center">The rating is a guide, not a guarantee. It looks at forecast wind, waves and rain, the tide, time of day, moon and fish season at spots within about 25 km by road (not across the bay or the Heads).</p></>;
}
