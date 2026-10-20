// Catch log: saved on this phone (list in localStorage, photos in IndexedDB), with export/import so nothing is lost.
import { useEffect, useMemo, useRef, useState } from "react";
import { SPECIES, sizeText, bagText } from "./data/species";
import { AREAS, type Area } from "./data/spotinfo";
import { ALL_LAND, peekSpotWeather, km } from "./where";
import { type Place, type Forecast, moonInfo, compass } from "./lib";
import { nearestStation, tideStateText } from "./tides";
import { fmt } from "./astro";
import { SpThumb, load, save } from "./ui";

const TZ = "Australia/Melbourne";
export type Cond = { tide?: string; moon?: string; wind?: string; temp?: string };
export type Catch = { id: string; species: string; cm?: number; kept: boolean; notes: string; at: string; where: string; spotId?: string; lat?: number; lon?: number; photo?: boolean; cond?: Cond };

// --- photos (IndexedDB) ---
const db = () => new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open("rc-photos", 1); r.onupgradeneeded = () => r.result.createObjectStore("p"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async <T,>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) => { const d = await db(); return new Promise<T>((res, rej) => { const q = f(d.transaction("p", mode).objectStore("p")); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
export const putPhoto = (id: string, url: string) => tx("readwrite", (s) => s.put(url, id));
export const getPhoto = (id: string) => tx<string | undefined>("readonly", (s) => s.get(id) as IDBRequest<string | undefined>);
export const delPhoto = (id: string) => tx("readwrite", (s) => s.delete(id));
/** Shrink a camera photo to at most 1024 px and JPEG quality 0.7 (usually 80–200 KB). */
export async function compress(file: File, max = 1024, q = 0.7): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", q);
  } finally { URL.revokeObjectURL(url); }
}

/** Conditions at the time and place of a catch: tide (BOM tables), moon, and wind if a saved forecast covers that hour. */
export function conditionsAt(t: number, lat: number, lon: number, fresh: boolean, spotId?: string): Cond {
  const c: Cond = {}, key = fmt(t, TZ).slice(0, 13) + ":00";
  const st = fresh ? null : nearestStation(lat, lon);
  if (st) { const s = tideStateText(st.station, t, TZ); if (s) c.tide = `${s.text} (${st.station.name.replace(/ \(.*\)/, "")})`; }
  const m = moonInfo(new Date(t)); c.moon = `${m.icon} ${m.name} (${m.pct}%)`;
  const sw = peekSpotWeather(), r = spotId ? sw?.data[spotId] : undefined, i = r ? r.t.indexOf(key) : -1;
  if (r && i >= 0) c.wind = `${Math.round(r.wind[i])} kn from the ${compass(r.dir[i])}`;
  else { const f = load<Forecast | null>("rc-cache", null); const h = f && km(f.place, { lat, lon }) < 15 ? f.hours.find((x) => x.time === key) : undefined; if (h) { c.wind = `${Math.round(h.wind)} kn from the ${compass(h.dir)}`; c.temp = `${Math.round(h.temp)}°`; } }
  return c;
}

const Photo = ({ id, alt }: { id: string; alt: string }) => { const [u, setU] = useState<string>(); useEffect(() => { getPhoto(id).then(setU).catch(() => {}); }, [id]); return u ? <img className="catchphoto" src={u} alt={alt} /> : null; };
const localInput = (t: number) => fmt(t, TZ); // value for <input type="datetime-local"> (Melbourne time)
const fromLocal = (v: string) => { const g = new Date(v + ":00Z").getTime(); const off = new Date(fmt(g, TZ) + ":00Z").getTime() - g; return g - off; };

export function Log({ place }: { place: Place }) {
  const [list, setList] = useState<Catch[]>(() => load("rc-log", []));
  useEffect(() => save("rc-log", list), [list]);
  const near = useMemo(() => ALL_LAND.map((s) => ({ s, d: km(place, s) })).sort((a, b) => a.d - b.d), [place.lat, place.lon]);
  const blank = () => ({ id: "", sp: SPECIES[0].name, cm: "", kept: false, notes: "", spot: near[0] && near[0].d < 3 ? near[0].s.id : "", when: localInput(Date.now()), photo: "" as string, hadPhoto: false });
  const [f, setF] = useState(blank); const [msg, setMsg] = useState(""); const top = useRef<HTMLFormElement>(null); const fileIn = useRef<HTMLInputElement>(null);
  const info = SPECIES.find((s) => s.name === f.sp);
  const set = (p: Partial<ReturnType<typeof blank>>) => setF((o) => ({ ...o, ...p }));
  const onPhoto = async (file?: File) => { if (!file) return; setMsg("Shrinking photo…"); try { set({ photo: await compress(file) }); setMsg(""); } catch { setMsg("Couldn't read that photo."); } };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = f.id || String(Date.now()), t = fromLocal(f.when), spot = ALL_LAND.find((s) => s.id === f.spot);
    const lat = spot?.lat ?? place.lat, lon = spot?.lon ?? place.lon;
    let photo = f.hadPhoto, photoErr = false;
    try { if (f.photo) { await putPhoto(id, f.photo); photo = true; } } catch { photoErr = true; }
    const c: Catch = { id, species: f.sp, cm: f.cm ? +f.cm : undefined, kept: f.kept, notes: f.notes, at: new Date(t).toISOString(), where: spot?.name ?? place.name, spotId: spot?.id, lat, lon, photo, cond: conditionsAt(t, lat, lon, !!spot?.info?.fresh, spot?.id) };
    setList((l) => [c, ...l.filter((x) => x.id !== id)].sort((a, b) => b.at.localeCompare(a.at)));
    setF(blank()); if (fileIn.current) fileIn.current.value = ""; setMsg(photoErr ? "Saved – but the photo couldn't be stored (phone storage full?)." : f.id ? "Catch updated." : "Catch saved.");
  };
  const edit = (c: Catch) => { setF({ id: c.id, sp: c.species, cm: c.cm ? String(c.cm) : "", kept: c.kept, notes: c.notes, spot: c.spotId ?? "", when: localInput(new Date(c.at).getTime()), photo: "", hadPhoto: !!c.photo }); setMsg(""); top.current?.scrollIntoView({ behavior: "smooth" }); };
  const remove = (c: Catch) => { if (!confirm(`Delete this ${c.species} catch?`)) return; setList((l) => l.filter((x) => x.id !== c.id)); if (c.photo) delPhoto(c.id).catch(() => {}); };
  const exportAll = async () => {
    const out = [] as (Catch & { photoData?: string })[];
    for (const c of list) out.push({ ...c, photoData: c.photo ? await getPhoto(c.id).catch(() => undefined) : undefined });
    const blob = new Blob([JSON.stringify({ app: "chocs-spot", kind: "catch-log", exported: new Date().toISOString(), catches: out })], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `chocs-spot-catches-${fmt(Date.now(), TZ).slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    save("rc-log-backup", Date.now()); setMsg(`Backup file saved to your Downloads (${list.length} catches).`);
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const d = JSON.parse(await file.text()); if (d?.kind !== "catch-log" || !Array.isArray(d.catches)) throw new Error("bad");
      let added = 0; const have = new Set(list.map((c) => c.id)); const next = [...list];
      for (const c of d.catches as (Catch & { photoData?: string })[]) { if (!c.id || !c.species || have.has(c.id)) continue; const { photoData, ...rest } = c; if (photoData) await putPhoto(c.id, photoData).catch(() => {}); next.push({ ...rest, photo: !!photoData }); added++; }
      setList(next.sort((a, b) => b.at.localeCompare(a.at))); setMsg(added ? `Added ${added} catch${added > 1 ? "es" : ""} from the backup.` : "Nothing new in that backup – all those catches are already here.");
    } catch { setMsg("That file isn't a Choc's Spot catch backup."); }
  };
  const lastBackup = load<number>("rc-log-backup", 0);
  return <>
    <form className="card" onSubmit={submit} ref={top}>
      <h2>{f.id ? "Edit catch" : "Add a catch"}</h2>
      <label>Fish<select value={f.sp} onChange={(e) => set({ sp: e.target.value })}>{SPECIES.map((s) => <option key={s.slug}>{s.name}</option>)}<option>Other</option></select></label>
      <div className="row" style={{ justifyContent: "flex-start", gap: 12 }}><SpThumb name={f.sp} size={84} /><p className="muted small" style={{ margin: 0 }}>{info ? <>Legal size: {sizeText(info).toLowerCase()} · Bag limit: {bagText(info)}{info.bagNote ? ` (${info.bagNote})` : ""}</> : "Check the VFA rules for this fish."}</p></div>
      <label>Length (cm)<input inputMode="decimal" value={f.cm} onChange={(e) => set({ cm: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="optional" /></label>
      {info?.maxCm && f.cm && +f.cm > info.maxCm && <div className="banner danger">Over the {info.maxCm} cm maximum – please release it.</div>}
      {info?.minCm && f.cm && +f.cm < info.minCm && <div className="banner danger">Under the {info.minCm} cm legal size – please release it.</div>}
      <label className="check"><input type="checkbox" checked={f.kept} onChange={(e) => set({ kept: e.target.checked })} /> I kept it</label>
      <label>Where<select value={f.spot} onChange={(e) => set({ spot: e.target.value })}>
        <option value="">{place.name} (my chosen place)</option>
        {(Object.keys(AREAS) as Area[]).map((a) => <optgroup key={a} label={AREAS[a].name}>{near.filter((x) => x.s.info?.area === a).map((x) => <option key={x.s.id} value={x.s.id}>{x.s.name}</option>)}</optgroup>)}
      </select></label>
      <label>When<input type="datetime-local" value={f.when} onChange={(e) => set({ when: e.target.value })} /></label>
      <label>Notes<input value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="bait, rig, what worked…" /></label>
      <label>Photo (optional)<input ref={fileIn} type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
      {f.photo ? <img className="catchphoto" src={f.photo} alt="New photo" /> : f.hadPhoto ? <Photo id={f.id} alt="Saved photo" /> : null}
      <p className="muted small">The tide, moon and wind at that time are saved with the catch automatically.</p>
      <button className="big">{f.id ? "Save changes" : "Save catch"}</button>
      {f.id && <button type="button" className="btn alt wide" onClick={() => { setF(blank()); setMsg(""); }}>Cancel edit</button>}
      {msg && <p className="small" role="status">{msg}</p>}
    </form>
    {list.length === 0 && <div className="card empty"><SpThumb name="Snapper" size={120} /><h3>No catches yet</h3><p className="muted small">Your first fish will show up here.</p></div>}
    {list.map((c) => <section key={c.id} className="card catch2">
      <div className="row"><div className="grow"><b>{c.species}{c.cm ? ` · ${c.cm} cm` : ""}</b> {c.kept ? "🧺 kept" : "↩ released"}
        <div className="muted small">{new Date(c.at).toLocaleString("en-AU", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })} · {c.where}</div></div>
        {!c.photo && <SpThumb name={c.species} size={72} />}</div>
      {c.photo && <Photo id={c.id} alt={c.species} />}
      {c.notes && <p className="small">{c.notes}</p>}
      {c.cond && <p className="muted small">{[c.cond.tide && `🌊 ${c.cond.tide}`, c.cond.wind && `💨 ${c.cond.wind}`, c.cond.temp && `🌡️ ${c.cond.temp}`, c.cond.moon].filter(Boolean).join(" · ")}</p>}
      <div className="row btns"><button className="btn alt" onClick={() => edit(c)}>✏️ Edit</button><button className="btn alt" onClick={() => remove(c)}>🗑 Delete</button></div>
    </section>)}
    <section className="card"><h3>💾 Back up your catches</h3>
      <p className="small">Catches and photos are saved on this phone only. If the browser's data is cleared (Brave can do this), they're gone – so save a backup file now and then.</p>
      <p className="muted small">{lastBackup ? `Last backup: ${new Date(lastBackup).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}.` : "No backup yet."}</p>
      <button className="btn wide" onClick={exportAll} disabled={!list.length}>⬇️ Save backup file</button>
      <label className="btn alt wide filebtn">⬆️ Restore from a backup file<input type="file" accept="application/json,.json" onChange={(e) => importFile(e.target.files?.[0])} hidden /></label>
    </section>
  </>;
}
