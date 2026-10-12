import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SPOTS } from "./data/spots";
import { SPECIES } from "./data/species";
import { REGS } from "./data/regs";
import {
  type Forecast, type Place, getForecast, searchPlaces, compass, kmh, hhmm, dayName, weatherText,
  moonInfo, solunar, tidesFrom, scoreDay, safety, localNowKey,
} from "./lib";
import { APP_NAME, TAGLINE } from "./config";
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
    catch (e) { setErr(navigator.onLine ? `Couldn't load live data: ${(e as Error).message}. Tap Refresh to try again.` : "You're offline. Showing the last saved data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { save("rc-place", place); refresh(place); }, [place, refresh]);
  useEffect(() => { save("rc-favs", favs); }, [favs]);
  useEffect(() => { const t = setInterval(() => refresh(place), 15 * 60000); return () => clearInterval(t); }, [place, refresh]);

  const isFav = favs.some((f) => f.name === place.name);
  const toggleFav = () => setFavs(isFav ? favs.filter((f) => f.name !== place.name) : [...favs, place]);
  const shown = data && data.place.name === place.name ? data : data; // show cached while loading

  return (
    <div className="app">
      {cover && <Cover f={data} onStart={() => setCover(false)} />}
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
        {!shown && !err && <div className="card center">Loading live conditions…</div>}
        {shown && tab === "today" && <Today f={shown} stale={shown.place.name !== place.name} />}
        {shown && tab === "week" && <Week f={shown} />}
        {tab === "where" && <Where place={place} onMap={(id) => { setFocus(id); setTab("map"); }} />}
        {tab === "map" && <MapTab place={place} focus={focus} onPick={(p) => { setPlace(p); setTab("today"); }} />}
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

const scoreCol = (n: number) => n >= 75 ? "#8fd1a4" : n >= 60 ? "#b9d6a0" : n >= 45 ? "#e2c48e" : "#e5a097";
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

const Hook = ({ size = 72 }: { size?: number }) => <svg className="hook" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
  <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M18 4v15.5a6.2 6.2 0 1 1-7-5.6" />
  <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" d="M9.2 16.4l3.4-2.8" /></svg>;

function Cover({ f, onStart }: { f: Forecast | null; onStart: () => void }) {
  const [out, setOut] = useState(false);
  const go = () => { if (out) return; setOut(true); setTimeout(onStart, 380); };
  const sc = f ? scoreDay(f, 0) : null;
  const call = !sc ? null : sc.score >= 60 ? "Go" : sc.score >= 45 ? "Maybe" : "Wait";
  return <div className={`cover ${out ? "out" : ""}`} onClick={go}>
    <div className="cover-in">
      <div className="cover-mark"><Hook size={64} /></div>
      <h1 className="wordmark">{APP_NAME}</h1>
      <p className="eyebrow">Land-based fishing · Victoria</p>
      <p className="tag">{TAGLINE}. Pick a fish and a shore — wind, tide and how you get there decide the rest.</p>
      {sc && <div className="call">
        <div className="call-top"><div><p className="eyebrow">Today's land-based call</p><p className={`call-word c-${call}`}>{call}</p></div><ScoreBadge {...sc} size={84} /></div>
        <p className="call-sub">{f!.place.name} · {sc.reasons[0]}</p>
      </div>}
      <button className="start" onClick={(e) => { e.stopPropagation(); go(); }}>Start fishing <span aria-hidden="true">→</span></button>
      <small className="skip">Tap anywhere to continue</small>
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
        </> : <p className="muted">No sea data for this location (it may be inland). Pick a beach, pier or boat ramp to see tides, waves and water temperature.</p>}
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

function MapTab({ place, focus, onPick }: { place: Place; focus: string | null; onPick: (p: Place) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([place.lat, place.lon], 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    L.circleMarker([place.lat, place.lon], { radius: 9, color: "#38bdf8", fillOpacity: 0.8 }).addTo(map).bindPopup(`You: ${place.name}`);
    SPOTS.forEach((s) => {
      const div = document.createElement("div");
      div.innerHTML = `<b>${s.name}</b><br/>${s.noTake ? "⛔ No fishing – marine park/sanctuary" : `${s.kind}${s.depth ? " · " + s.depth : ""}<br/><small>${s.tips}</small><br/>`}`;
      if (!s.noTake) { const b = document.createElement("button"); b.className = "btn"; b.textContent = "Show conditions here"; b.onclick = () => onPick({ name: s.name, lat: s.lat, lon: s.lon }); div.appendChild(b); }
      const mk = L.circleMarker([s.lat, s.lon], { radius: 7, color: s.noTake ? "#ef4444" : "#22c55e", fillOpacity: 0.7 }).addTo(map).bindPopup(div);
      if (s.id === focus) { map.setView([s.lat, s.lon], 14); mk.openPopup(); }
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      const div = document.createElement("div"); const b = document.createElement("button"); b.className = "btn"; b.textContent = "Check conditions here";
      b.onclick = () => onPick({ name: `Map spot ${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}`, lat: +e.latlng.lat.toFixed(4), lon: +e.latlng.lng.toFixed(4) });
      div.appendChild(b); L.popup().setLatLng(e.latlng).setContent(div).openOn(map);
    });
    return () => { map.remove(); };
  }, [place, focus, onPick]);
  return <><div ref={ref} className="map" /><p className="muted small">🟢 fishing spot · 🔴 no-fishing sanctuary · Tap anywhere on the map to check conditions there.</p></>;
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
      {info && <p className="muted small">Min size: {info.minCm ? `${info.minCm} cm` : "none"} · Bag limit: {info.bag}{info.bagNote ? ` (${info.bagNote})` : ""}</p>}
      <label>Length (cm)<input inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="optional" /></label>
      {tooSmall && <div className="banner danger">Under the {info!.minCm} cm legal size – please release it.</div>}
      <label className="check"><input type="checkbox" checked={kept} onChange={(e) => setKept(e.target.checked)} /> I kept it</label>
      <label>Notes<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="bait, rig, tide…" /></label>
      <p className="muted small">Spot: {place.name}</p>
      <button className="big">Save catch</button>
    </form>
    {list.length === 0 && <p className="muted center">No catches yet. They're saved on this phone only.</p>}
    {list.map((c) => <div key={c.id} className="card row"><div><b>{c.species}{c.cm ? ` · ${c.cm} cm` : ""}</b> {c.kept ? "🧺 kept" : "↩ released"}<div className="muted small">{new Date(c.at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} · {c.where}</div>{c.notes && <div className="small">{c.notes}</div>}</div>
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
      <p className="small">{REGS.licence}</p><p className="small">{REGS.parks}</p><p className="small">{REGS.report}</p>
    </section>
    <About />
    <section className="card"><h3>Quick reference (from the {REGS.source} – may be out of date)</h3>
      {sorted.map((s) => <div key={s.slug} className="period"><b>{s.name}</b><span>{s.minCm ? `min ${s.minCm} cm` : "no min"} · bag {s.bag}</span></div>)}
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
  useEffect(() => { getSpotWeather().then(setRaw).catch((e) => setErr(`Couldn't load live wind for the spots (${(e as Error).message}). Try again soon.`)); }, []);
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
    {!raw && !err && <div className="card center">Checking wind at every spot…</div>}
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
        return <div key={b.fish} className={`bite ${on && !closed ? "" : "off"}`}><b>{closed ? "⛔" : pk ? "🔥" : on ? "✅" : "➖"} {b.fish}</b><span>{closed ? "Closed season" : pk ? "Best time now" : on ? "In season" : "Quiet now"}</span><small>{b.note}</small></div>; })}
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
    <p className="small"><b>Privacy:</b> your location is only used on this phone to find nearby spots and is never sent to us. Your catch log and saved spots are stored only on this device. There are no accounts, ads or trackers. Weather requests go to Open-Meteo with the spot's coordinates.</p>
    <p className="small"><b>Disclaimer:</b> scores, tides and spot picks are a guide only, not a guarantee. Always check the <a href="http://www.bom.gov.au/vic/" target="_blank" rel="noreferrer">Bureau of Meteorology</a> forecasts and warnings and the <a href="https://vfa.vic.gov.au/" target="_blank" rel="noreferrer">VFA</a> rules before you go. Fish safely — wear a life jacket on rocks, never fish alone in big swell, and watch the tide.</p>
    <p className="small"><b>Credits:</b> weather & marine data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (CC BY 4.0). Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors.</p>
  </section>;
}
