import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
const MapTab = lazy(() => import("./MapTab"));
import { SPOTS } from "./data/spots";
import { SPECIES } from "./data/species";
import { REGS } from "./data/regs";
import {
  type Forecast, type Place, getForecast, searchPlaces, compass, kmh, hhmm, dayName, weatherText,
  moonInfo, solunar, tidesFrom, scoreDay, safety, localNowKey,
} from "./lib";
import { APP_NAME, APP_VERSION, TAGLINE } from "./config";
import { LAND, BITING, getSpotWeather, rankSpot, km, type Rank } from "./where";

const DEFAULT: Place = { name: "Williamstown, VIC", lat: -37.8635, lon: 144.9056 };
const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ } };

type Tab = "where" | "today" | "week" | "map" | "log" | "rules";

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [place, setPlace] = useState<Place>(() => load("rc-place", DEFAULT));
  const [favs, setFavs] = useState<Place[]>(() => load("rc-favs", []));
  const [data, setData] = useState<Forecast | null>(() => load<Forecast | null>("rc-cache", null));
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
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

  return (
    <div className="app">
      {cover && <Cover f={data} onStart={(t) => { if (t) setTab(t); setCover(false); }} />}
      <header className="top">
        <button className="place" onClick={() => setPicker(true)} aria-label={`📍 ${place.name} change`}>
          📍 <span>{place.name}</span> <small>change</small>
        </button>
        <button className="icon" onClick={toggleFav} aria-label={isFav ? "Remove from favourites" : "Save as favourite"}>{isFav ? "★" : "☆"}</button>
        <button className="icon" onClick={() => refresh(place)} aria-label="Refresh" disabled={loading}>{loading ? "…" : "⟳"}</button>
      </header>
      {err && <div className="banner warn">{err}</div>}
      {picker && <Picker favs={favs} onClose={() => setPicker(false)} onPick={(p) => { setPlace(p); setPicker(false); }} onRemoveFav={(p) => setFavs(favs.filter((f) => f.name !== p.name))} />}
      <main key={tab} className="fade">
        {!shown && !err && <><div className="skel card-h" /><div className="skel card-h tall" /><div className="skel card-h" /></>}
        {shown && tab === "today" && <Today f={shown} stale={shown.place.name !== place.name} />}
        {shown && tab === "week" && <Week f={shown} />}
        {tab === "where" && <Where place={place} onMap={(id) => { setFocus(id); setTab("map"); }} />}
        {tab === "map" && <Suspense fallback={<div className="skel map" />}><MapTab place={place} focus={focus} onPick={(p) => { setPlace(p); setTab("today"); }} /></Suspense>}
        {tab === "log" && <Log place={place} />}
        {tab === "rules" && <Rules />}
        <p className="muted small center foot">Weather & marine data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (CC BY 4.0) · Map © OpenStreetMap</p>
      </main>
      <nav className="tabs">
        {([["today", "Today"], ["where", "Where"], ["week", "7 days"], ["map", "Map"], ["log", "Catches"], ["rules", "Info"]] as const).map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><Ico n={k} />{l}</button>
        ))}
      </nav>
    </div>
  );
}

function Picker({ favs, onPick, onClose, onRemoveFav }: { favs: Place[]; onPick: (p: Place) => void; onClose: () => void; onRemoveFav: (p: Place) => void }) {
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
    <div className="sheet" role="dialog">
      <div className="sheet-in">
        <div className="row"><h2>Choose a spot</h2><button className="icon" onClick={onClose} aria-label="Close">✕</button></div>
        <button className="big" onClick={gps}>📡 Use my current location</button>
        <form onSubmit={go} className="row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a town, beach or pier" /><button className="btn">Search</button></form>
        {msg && <p className="muted">{msg}</p>}
        {res.map((p) => <button key={p.name + p.lat} className="item" onClick={() => onPick(p)}>{p.name}</button>)}
        {favs.length > 0 && <><h3>★ Saved spots</h3>{favs.map((p) => <div key={p.name} className="row"><button className="item grow" onClick={() => onPick(p)}>{p.name}</button><button className="icon" onClick={() => onRemoveFav(p)} aria-label="Remove">🗑</button></div>)}</>}
        <h3>Popular Port Phillip spots</h3>
        {SPOTS.filter((s) => !s.noTake).slice(0, 12).map((s) => <button key={s.id} className="item" onClick={() => onPick({ name: s.name, lat: s.lat, lon: s.lon })}>{s.name}</button>)}
      </div>
    </div>
  );
}

const scoreCol = (n: number) => n >= 75 ? "#5ee08c" : n >= 60 ? "#9be27a" : n >= 45 ? "#f5b83d" : "#ff8a7a";
function ScoreBadge({ score, label, size = 96 }: { score: number; label: string; size?: number }) {
  const c = scoreCol(score); const R = 42, L = 2 * Math.PI * R;
  return <div className="score" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={R} className="ring-bg" />
      <circle cx="50" cy="50" r={R} className="ring" stroke={c} strokeDasharray={L} strokeDashoffset={L * (1 - score / 100)} /></svg>
    <b style={{ color: c }}>{score}</b><span>{label}</span></div>;
}
const Arrow = ({ deg, size = 18 }: { deg: number; size?: number }) => <svg className="arrow" width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${deg + 180}deg)` }}><path d="M12 2 L19 20 L12 16 L5 20Z" fill="currentColor" /></svg>;
const ICONS: Record<string, string> = {
  today: "M12 2v3M4.2 6.2l2.1 2.1M2 14h3M19 14h3M17.7 8.3l2.1-2.1M7 18a5 5 0 0 1 10 0M2 21h20",
  where: "M12 22s7-7.2 7-13a7 7 0 0 0-14 0c0 5.8 7 13 7 13zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  week: "M4 5h16v16H4zM4 10h16M9 3v4M15 3v4",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  log: "M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM8 11.5h.01",
  rules: "M3 17 17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2",
};
const Ico = ({ n }: { n: string }) => <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[n]} /></svg>;



const BASE = import.meta.env.BASE_URL;
const SP_FILES: [RegExp, string][] = [[/snapper/i, "snapper"], [/squid|calamari/i, "squid"], [/whiting/i, "whiting"], [/garfish/i, "garfish"], [/flathead/i, "flathead"], [/mulloway/i, "mulloway"], [/bream/i, "bream"], [/perch/i, "estuary-perch"], [/salmon/i, "salmon"], [/trevally/i, "trevally"], [/kingfish/i, "kingfish"], [/gummy/i, "gummy-shark"], [/elephant/i, "elephant-fish"], [/snook|pike/i, "snook"], [/leatherjacket/i, "leatherjacket"], [/murray cod/i, "murray-cod"]];
export const spImg = (name: string) => { const m = SP_FILES.find(([r]) => r.test(name)); return m ? `${BASE}sp/${m[1]}.webp` : null; };
const SpThumb = ({ name, size = 56 }: { name: string; size?: number }) => { const u = spImg(name);
  return <span className="thumb" style={{ width: size, height: Math.round(size * 0.5625) }}>{u ? <img src={u} alt="" loading="lazy" decoding="async" width={size} height={Math.round(size * 0.5625)} /> : <svg viewBox="0 0 24 24" width={size * 0.45} height={size * 0.45} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM7.5 11h.01" /></svg>}</span>; };

const FI: Record<string, string> = {
  loc: "M12 21s-6.5-6.2-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  time: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  wx: "M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 11 3.5 3.5 0 0 0 7 18zM16 3v1M20.5 5.5l-.7.7M22 10h-1",
  sp: "M2 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM7.5 11h.01",
  rig: "M3 21L17 5M17 5c2 3 3 6 3 9M20 14v1M18.5 16.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M7 17l2 2",
  tips: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7M8 11h5",
};
const FEATS: [Tab, string, string][] = [["where", "Locations", "loc"], ["week", "Best times", "time"], ["today", "Weather", "wx"], ["rules", "Species", "sp"], ["where", "Tackle & rigs", "rig"], ["rules", "Tips & rules", "tips"]];
const SPECIES_STRIP = ["Snapper", "Squid", "Whiting", "Garfish", "Flathead", "Mulloway", "Bream", "Estuary Perch"];
const LeapFish = () => <svg className="leap" viewBox="0 0 64 40" aria-hidden="true"><path d="M4 31C14 12 34 4 50 9l9-6-3 10 5 8-11-4C40 26 22 31 4 31z" fill="#fff" /><circle cx="14" cy="25" r="1.8" fill="#0b2a55" /><path d="M24 20c8-6 16-8 24-7" stroke="#0b2a55" strokeWidth="1.6" fill="none" /><path d="M2 36q8-3 16 0t16 0" stroke="#f5b83d" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>;

function Cover({ f, onStart }: { f: Forecast | null; onStart: (t?: Tab) => void }) {
  const [out, setOut] = useState(false);
  const go = (t?: Tab) => { if (out) return; setOut(true); setTimeout(() => onStart(t), 380); };
  const sc = f ? scoreDay(f, 0) : null;
  const call = !sc ? null : sc.score >= 60 ? "Go" : sc.score >= 45 ? "Maybe" : "Wait";
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
      <div className="call" aria-live="polite">
        {sc ? <><div className="call-txt"><p className="eyebrow">Today's call · {f!.place.name}</p><p className={`call-word c-${call}`}>{call}</p><p className="call-sub">{sc.reasons[0]}</p></div>
          <ScoreBadge {...sc} size={78} /></> : <div className="call-txt"><p className="eyebrow">Today's call</p><div className="skel line" /><div className="skel line short" /></div>}
      </div>
      <button className="start" onClick={(e) => { e.stopPropagation(); go(); }}>Start fishing<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      <nav className="feats" aria-label="Shortcuts">{FEATS.map(([t, l, i]) => <button key={l} onClick={(e) => { e.stopPropagation(); go(t); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={FI[i]} /></svg>{l}</button>)}</nav>
      <p className="kicker">Your Victorian land-based fishing assistant</p>
      <div className="strip">{SPECIES_STRIP.map((n) => <figure key={n} className="sp"><img src={spImg(n)!} alt="" loading="lazy" decoding="async" width="480" height="270" /><figcaption>{n}</figcaption></figure>)}</div>
      <p className="places">Port Phillip Bay <i>|</i> Yarra <i>|</i> Maribyrnong <i>|</i> Geelong</p>
    </div>
  </div>;
}

function Today({ f, stale }: { f: Forecast; stale: boolean }) {
  const n = f.now; const [ico, txt] = weatherText(n.code);
  const sc = scoreDay(f, 0); const warn = safety(f);
  const nowKey = localNowKey(f.tz);
  const next = f.hours.filter((h) => h.time >= nowKey).slice(0, 24);
  const past3 = f.hours.filter((h) => h.time <= nowKey).slice(-4)[0];
  const dp = past3 ? n.pressure - past3.pressure : 0;
  const trend = dp > 0.7 ? "rising ↑" : dp < -0.7 ? "falling ↓" : "steady →";
  const today = f.days[0]; const moon = moonInfo(new Date());
  const periods = solunar(today.date, f.tz, f.place.lat, f.place.lon);
  const tides = tidesFrom(f.hours).filter((t) => t.time >= nowKey.slice(0, 13)).slice(0, 4);
  const cur = next[0];
  const age = Math.round((Date.now() - f.fetchedAt) / 60000);
  return (
    <>
      {stale && <div className="banner">Loading new spot… showing {f.place.name} for now.</div>}
      {warn.map((w) => <div key={w} className="banner danger">⚠️ {w}</div>)}
      <section className="card hero">
        <div>
          <div className="muted">Fishing today</div>
          <ScoreBadge {...sc} />
        </div>
        <ul className="reasons">{sc.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </section>
      <section className="card">
        <div className="now"><span className="bigico">{ico}</span><div><b className="xl">{Math.round(n.temp)}°</b> <span className="muted">feels {Math.round(n.feels)}°</span><div>{txt}</div></div></div>
        <div className="grid">
          <Stat k="Wind" v={<><Arrow deg={n.dir} size={22} /> {Math.round(n.wind)} kn</>} s={`${kmh(n.wind)} km/h from ${compass(n.dir)}`} />
          <Stat k="Gusts" v={`${Math.round(n.gust)} kn`} s={`${kmh(n.gust)} km/h`} />
          <Stat k="Pressure" v={`${Math.round(n.pressure)} hPa`} s={trend} />
          <Stat k="Rain chance" v={`${cur?.rainChance ?? 0}%`} s={`${today.rainSum.toFixed(1)} mm today`} />
          {f.hasMarine && cur?.seaTemp != null && <Stat k="Water temp" v={`${cur.seaTemp.toFixed(1)}°`} s="sea surface" />}
          {f.inBay && <Stat k="Waves" v="Wind chop" s="no swell model inside the bay – go by the wind" />}
          {f.hasMarine && cur?.wave != null && <Stat k="Waves" v={`${cur.wave.toFixed(1)} m`} s={cur.swell != null ? `swell ${cur.swell.toFixed(1)} m${cur.swellPeriod ? `, ${Math.round(cur.swellPeriod)}s` : ""}${cur.swellDir != null ? ` ${compass(cur.swellDir)}` : ""}` : ""} />}
        </div>
        <p className="muted small">Updated {age < 1 ? "just now" : `${age} min ago`} · Open-Meteo</p>
      </section>

      <section className="card">
        <h2>🐟 Best feeding times today</h2>
        <p className="muted small">Based on the moon's position (solunar). Major = 2 hrs, minor = 1 hr.</p>
        {periods.map((p) => <div key={p.mid} className={`period ${p.kind}`}><b>{hhmm(p.start)} – {hhmm(p.end)}</b><span>{p.kind === "major" ? "MAJOR" : "minor"} · {p.label}</span></div>)}
        <div className="grid">
          <Stat k="Sunrise" v={hhmm(today.sunrise)} s="dawn bite" />
          <Stat k="Sunset" v={hhmm(today.sunset)} s="dusk bite" />
          <Stat k="Moon" v={`${moon.icon} ${moon.pct}%`} s={moon.name} />
        </div>
      </section>

      <section className="card">
        <h2>🌊 Tides</h2>
        {tides.length ? <>
          {tides.map((t) => <div key={t.time} className="period"><b>{t.type === "High" ? "⬆ High" : "⬇ Low"} {hhmm(t.time)}</b><span>{dayName(t.time.slice(0, 10), t.time.slice(0, 10) === today.date ? 0 : 1)} · {t.m.toFixed(2)} m</span></div>)}
          <p className="muted small">Approximate – from a computer model of sea level (to the nearest hour), not an official tide table. Check BOM tide tables before boating or crossing bars.</p>
        </> : <p className="muted">{f.inBay ? "The free tide model isn't reliable for this part of the bay, so no estimate is shown. Use the official BOM tide table for the nearest port." : "No sea data for this location (it may be inland). Pick a beach, pier or boat ramp to see tides and water temperature."}</p>}
        <a className="link" href="http://www.bom.gov.au/australia/tides/#!/vic" target="_blank" rel="noreferrer">Official BOM tide tables ↗</a>
      </section>

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
    </>
  );
}

const Stat = ({ k, v, s }: { k: string; v: React.ReactNode; s?: string }) => <div className="stat"><small>{k}</small><b>{v}</b>{s && <small>{s}</small>}</div>;

function Week({ f }: { f: Forecast }) {
  const [open, setOpen] = useState(0);
  return <>{f.days.map((d, i) => { const sc = scoreDay(f, i); const [ico, txt] = weatherText(d.code); const m = moonInfo(new Date(d.date + "T12:00:00"));
    return (
      <section key={d.date} className="card day" onClick={() => setOpen(open === i ? -1 : i)}>
        <div className="row"><div><b>{dayName(d.date, i)}</b><div className="muted">{ico} {txt} · {Math.round(d.tMin)}–{Math.round(d.tMax)}°</div>
          <div className="muted small">Wind up to {Math.round(d.windMax)} kn {compass(d.dir)}, gusts {Math.round(d.gustMax)} · Rain {d.rainChance}% · {m.icon}</div></div>
          <ScoreBadge {...sc} /></div>
        {open === i && <><ul className="reasons">{sc.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <div className="muted small">Sunrise {hhmm(d.sunrise)} · Sunset {hhmm(d.sunset)}</div>
          {solunar(d.date, f.tz, f.place.lat, f.place.lon).map((p) => <div key={p.mid} className={`period ${p.kind}`}><b>{hhmm(p.start)} – {hhmm(p.end)}</b><span>{p.kind}</span></div>)}</>}
        {open !== i && <div className="muted small">Tap for details</div>}
      </section>); })}
    <p className="muted small center">The fishing score is a simple guide combining wind, pressure, moon, feeding times, rain and swell. It's not a guarantee!</p></>;
}


type Catch = { id: string; species: string; cm?: number; kept: boolean; notes: string; at: string; where: string };
function Log({ place }: { place: Place }) {
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
      {<div className="row" style={{ justifyContent: "flex-start", gap: 12 }}><SpThumb name={sp} size={84} /><p className="muted small" style={{ margin: 0 }}>{info ? <>Min size: {info.minCm ? `${info.minCm} cm` : "none"} · Bag limit: {info.bag}{info.bagNote ? ` (${info.bagNote})` : ""}</> : "Pick a fish to see its legal size."}</p></div>}
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

function Rules() {
  const sorted = useMemo(() => [...SPECIES].sort((a, b) => a.name.localeCompare(b.name)), []);
  return <>
    <section className="card"><h2>📏 Victorian fishing rules</h2>
      <p>Rules change – always check the official guide before you keep fish.</p>
      <a className="big link-btn" href="https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/catch-limits-and-closed-seasons" target="_blank" rel="noreferrer">Official size & bag limits (VFA) ↗</a>
      <a className="big link-btn alt" href="https://vfa.vic.gov.au/recreational-fishing/fishing-licence" target="_blank" rel="noreferrer">Buy a fishing licence ↗</a>
      <p className="small">{REGS.licence}</p><p className="small">{REGS.parks}</p><p className="small">{REGS.fillet}</p><p className="small">{REGS.report}</p>
    </section>
    <About />
    <section className="card"><h3>Size & bag limits</h3><p className="muted small">Checked against the <a href={REGS.sourceUrl} target="_blank" rel="noreferrer">{REGS.source}</a> on {REGS.checked}. Rules can change – the VFA is the final word.</p>
      {sorted.map((s) => <div key={s.slug} className="sprow"><SpThumb name={s.name} /><b>{s.name}</b><span>{s.minCm ? `min ${s.minCm} cm` : "no min"} · bag {s.bag}</span></div>)}
    </section>
  </>;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function Where({ place, onMap }: { place: Place; onMap: (id: string) => void }) {
  const [raw, setRaw] = useState<Awaited<ReturnType<typeof getSpotWeather>> | null>(null);
  const [err, setErr] = useState(""); const [mode, setMode] = useState<"now" | "today">("now");
  const [maxKm, setMaxKm] = useState<number>(() => load("rc-where-km", 0));
  const [origin, setOrigin] = useState<Place>(place); const [gpsMsg, setGpsMsg] = useState("");
  useEffect(() => setOrigin(place), [place]);
  useEffect(() => save("rc-where-km", maxKm), [maxKm]);
  useEffect(() => { getSpotWeather().then(setRaw).catch(() => setErr(navigator.onLine ? "Can't reach the weather service right now, so spots can't be ranked. Try again in a minute." : "You're offline. Connect to the internet to rank spots.")); }, []);
  const gps = () => { setGpsMsg("Finding you…"); navigator.geolocation?.getCurrentPosition((p) => { setOrigin({ name: "My location", lat: p.coords.latitude, lon: p.coords.longitude }); setGpsMsg(""); }, () => setGpsMsg("Location blocked – using your chosen place instead."), { timeout: 15000, maximumAge: 300000 }); };
  const ranked: (Rank & { dist: number })[] = useMemo(() => !raw ? [] : LAND.filter((s) => raw.data[s.id]).map((s) => ({ ...rankSpot(s, raw.data[s.id], mode), dist: km(origin, s) }))
    .filter((r) => !maxKm || r.dist <= maxKm).sort((a, b) => b.score - a.score), [raw, mode, origin, maxKm]);
  const m = new Date().getMonth() + 1;
  return <>
    <section className="card">
      <h2>📍 Where to fish</h2>
      <p className="muted small">Best land-based spots (piers, beaches, rocks, rivers) for the wind and waves {mode === "now" ? "right now" : "today"}.</p>
      <div className="seg">{(["now", "today"] as const).map((k) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{k === "now" ? "Right now" : "Today"}</button>)}</div>
      <div className="seg">{[0, 30, 60, 100].map((k) => <button key={k} className={maxKm === k ? "on" : ""} onClick={() => setMaxKm(k)}>{k ? `${k} km` : "Any"}</button>)}</div>
      <p className="muted small">Distance from: <b>{origin.name}</b> · <button className="linkish" onClick={gps}>use my location</button> {gpsMsg}</p>
    </section>
    {err && <div className="banner warn">{err}</div>}
    {!raw && !err && <><p className="muted small center">Checking wind at every spot…</p><div className="skel card-h tall" /><div className="skel card-h tall" /></>}
    {raw && !ranked.length && <div className="card center">No spots that close. Try a bigger distance.</div>}
    {ranked.slice(0, 5).map((r, i) => <section key={r.spot.id} className={`card wcard w-${r.badge}`}>
      <div className="row"><h3>{i + 1}. {r.spot.name}</h3><span className={`badge b-${r.badge}`}>{r.badge === "Good" ? "👍 " : r.badge === "OK" ? "👌 " : "👎 "}{r.badge}</span></div>
      <p className="muted small">{r.spot.type} · {Math.round(r.dist)} km away · <span className="wtag">wind {Math.round(r.wind)} kn {r.dirTxt}</span>{r.wave != null ? ` · waves ${r.wave.toFixed(1)} m` : ""}</p>
      <p className="big-txt">{r.avoid ? "⚠️ " : ""}{r.reason}</p>
      <p>⏰ <b>Best time:</b> {r.best}</p>
      {r.target.length > 0 && <p>🎯 <b>Target:</b> {r.target.join(", ")}</p>}
      <div className="row btns">
        <a className="btn" href={`https://www.google.com/maps/dir/?api=1&destination=${r.spot.lat},${r.spot.lon}`} target="_blank" rel="noreferrer">🚗 Directions</a>
        <button className="btn alt" onClick={() => onMap(r.spot.id)}>🗺️ View on map</button>
      </div>
    </section>)}
    <p className="muted small center">The ranking is a guide only, from live wind and wave forecasts. Tide times are approximate. Always check conditions when you arrive and stay safe on rocks.</p>
    <section className="card">
      <h2>🐟 What's biting in {MONTHS[m - 1]}</h2>
      <p className="muted small">General guide for Port Phillip, Western Port and the Surf Coast from land.</p>
      {BITING.map((b) => { const on = b.months.includes(m), pk = b.peak?.includes(m), closed = b.fish === "Murray cod" && m >= 9 && m <= 11;
        return <div key={b.fish} className={`bite ${on && !closed ? "" : "off"}`}><SpThumb name={b.fish} size={52} /><b>{closed ? "⛔" : pk ? "🔥" : on ? "✅" : "➖"} {b.fish}</b><span>{closed ? "Closed season" : pk ? "Best time now" : on ? "In season" : "Quiet now"}</span><small>{b.note}</small></div>; })}
    </section>
    <section className="card">
      <h2>📰 Latest reports</h2>
      {([["FishingMad – what's biting", "https://fishingmad.com.au/whats-biting-reports/"], ["Trelly's Victorian fishing report", "https://www.trellys.com.au/blogs/fishing-report-victoria"], ["Vic/Tas Fishing Monthly", "https://fishingmonthly.com.au/category/articles/locations/victoria/"], ["Fishing Victoria Forum", "https://www.fishing-victoria.com/"], ["BOM tide tables", "http://www.bom.gov.au/australia/tides/#!/vic"], ["VFA size & bag limits", "https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/catch-limits-and-closed-seasons"]] as const).map(([t, u]) =>
        <a key={u} className="big link-btn alt" href={u} target="_blank" rel="noreferrer">{t} ↗</a>)}
    </section>
  </>;
}

function About() {
  return <section className="card" id="about"><h2>ℹ️ About {APP_NAME}</h2>
    <p className="small"><b>Privacy:</b> no accounts, ads or trackers. Your catch log and saved spots are stored only on this phone. If you allow location, it's used on the phone to sort spots by distance. To get the forecast, the spot's coordinates are sent to Open-Meteo; we never receive them. <a href={`${BASE}privacy.html`}>Full privacy policy</a></p>
    <p className="small"><b>Disclaimer:</b> scores, tides and spot picks are a guide only, not a guarantee. Tide times are estimated from a sea-level model, not official tables. Always check the <a href="http://www.bom.gov.au/vic/" target="_blank" rel="noreferrer">Bureau of Meteorology</a> forecasts and warnings and the <a href="https://vfa.vic.gov.au/" target="_blank" rel="noreferrer">VFA</a> rules before you go. Fish safely: keep off rock ledges in big swell, wear a life jacket on rocks, and never fish alone in rough conditions.</p>
    <p className="small"><b>Credits:</b> weather & marine data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (CC BY 4.0). Map data and marine park outlines © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors (ODbL). Rules: Victorian Fisheries Authority. Fonts: Barlow Condensed and Outfit (SIL Open Font License).</p>
    <p className="muted small">Version {APP_VERSION} · rules checked {REGS.checked}</p>
  </section>;
}
