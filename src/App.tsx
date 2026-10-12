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

const DEFAULT: Place = { name: "Williamstown, VIC", lat: -37.8635, lon: 144.9056 };
const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ } };

type Tab = "today" | "week" | "map" | "log" | "rules";

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [place, setPlace] = useState<Place>(() => load("rc-place", DEFAULT));
  const [favs, setFavs] = useState<Place[]>(() => load("rc-favs", []));
  const [data, setData] = useState<Forecast | null>(() => load<Forecast | null>("rc-cache", null));
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);

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
      <header className="top">
        <button className="place" onClick={() => setPicker(true)} aria-label="Change location">
          📍 <span>{place.name}</span> <small>change</small>
        </button>
        <button className="icon" onClick={toggleFav} aria-label={isFav ? "Remove from favourites" : "Save as favourite"}>{isFav ? "★" : "☆"}</button>
        <button className="icon" onClick={() => refresh(place)} aria-label="Refresh" disabled={loading}>{loading ? "…" : "⟳"}</button>
      </header>
      {err && <div className="banner warn">{err}</div>}
      {picker && <Picker favs={favs} onClose={() => setPicker(false)} onPick={(p) => { setPlace(p); setPicker(false); }} onRemoveFav={(p) => setFavs(favs.filter((f) => f.name !== p.name))} />}
      <main>
        {!shown && !err && <div className="card center">Loading live conditions…</div>}
        {shown && tab === "today" && <Today f={shown} stale={shown.place.name !== place.name} />}
        {shown && tab === "week" && <Week f={shown} />}
        {tab === "map" && <MapTab place={place} onPick={(p) => { setPlace(p); setTab("today"); }} />}
        {tab === "log" && <Log place={place} />}
        {tab === "rules" && <Rules />}
      </main>
      <nav className="tabs">
        {([["today", "🎣", "Today"], ["week", "📅", "7 days"], ["map", "🗺️", "Map"], ["log", "📒", "My catches"], ["rules", "📏", "Rules"]] as const).map(([k, i, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><span>{i}</span>{l}</button>
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

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const c = score >= 75 ? "#22c55e" : score >= 60 ? "#84cc16" : score >= 45 ? "#f59e0b" : "#ef4444";
  return <div className="score" style={{ borderColor: c }}><b style={{ color: c }}>{score}</b><span>{label}</span></div>;
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
          <Stat k="Wind" v={`${Math.round(n.wind)} kn`} s={`${kmh(n.wind)} km/h from ${compass(n.dir)}`} />
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
              <span className="wind"><i style={{ transform: `rotate(${h.dir + 180}deg)` }}>↑</i>{Math.round(h.wind)}</span>
              <small>g{Math.round(h.gust)}</small><small>💧{h.rainChance}%</small>
              {h.wave != null && <small>🌊{h.wave.toFixed(1)}</small>}
            </div>); })}
        </div>
        <p className="muted small">Wind in knots (kn). Arrow shows where the wind is blowing to. g = gusts.</p>
      </section>
    </>
  );
}

const Stat = ({ k, v, s }: { k: string; v: string; s?: string }) => <div className="stat"><small>{k}</small><b>{v}</b>{s && <small>{s}</small>}</div>;

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

function MapTab({ place, onPick }: { place: Place; onPick: (p: Place) => void }) {
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
      L.circleMarker([s.lat, s.lon], { radius: 7, color: s.noTake ? "#ef4444" : "#22c55e", fillOpacity: 0.7 }).addTo(map).bindPopup(div);
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      const div = document.createElement("div"); const b = document.createElement("button"); b.className = "btn"; b.textContent = "Check conditions here";
      b.onclick = () => onPick({ name: `Map spot ${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}`, lat: +e.latlng.lat.toFixed(4), lon: +e.latlng.lng.toFixed(4) });
      div.appendChild(b); L.popup().setLatLng(e.latlng).setContent(div).openOn(map);
    });
    return () => { map.remove(); };
  }, [place, onPick]);
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
    <section className="card"><h3>Quick reference (from the {REGS.source} – may be out of date)</h3>
      {sorted.map((s) => <div key={s.slug} className="period"><b>{s.name}</b><span>{s.minCm ? `min ${s.minCm} cm` : "no min"} · bag {s.bag}</span></div>)}
    </section>
  </>;
}
