import { useEffect, useState } from "react";

export const BASE = import.meta.env.BASE_URL;
export const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
export const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full/blocked */ } };

const scoreCol = (n: number) => n >= 75 ? "#5ee08c" : n >= 60 ? "#9be27a" : n >= 45 ? "#f5b83d" : "#ff8a7a";
export function ScoreBadge({ score, label, size = 96 }: { score: number; label: string; size?: number }) {
  const c = scoreCol(score); const R = 42, L = 2 * Math.PI * R;
  return <div className="score" style={{ width: size, height: size }}>
    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r={R} className="ring-bg" />
      <circle cx="50" cy="50" r={R} className="ring" stroke={c} strokeDasharray={L} strokeDashoffset={L * (1 - score / 100)} /></svg>
    <b style={{ color: c }}>{score}</b><span>{label}</span></div>;
}
export const Arrow = ({ deg, size = 18 }: { deg: number; size?: number }) => <svg className="arrow" width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${deg + 180}deg)` }}><path d="M12 2 L19 20 L12 16 L5 20Z" fill="currentColor" /></svg>;

const ICONS: Record<string, string> = {
  today: "M12 2v3M4.2 6.2l2.1 2.1M2 14h3M19 14h3M17.7 8.3l2.1-2.1M7 18a5 5 0 0 1 10 0M2 21h20",
  where: "M12 22s7-7.2 7-13a7 7 0 0 0-14 0c0 5.8 7 13 7 13zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  fish: "M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM8 11.5h.01",
  reports: "M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM18 8h2v10a2 2 0 0 1-2 2M8 8h7M8 12h7M8 16h4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};
export const Ico = ({ n }: { n: string }) => <svg className="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={n === "more" ? ICONS.more : ICONS[n]} /></svg>;

const SP_FILES: [RegExp, string][] = [[/snapper/i, "snapper"], [/squid|calamari/i, "squid"], [/whiting/i, "whiting"], [/garfish/i, "garfish"], [/flathead/i, "flathead"], [/mulloway/i, "mulloway"], [/bream/i, "bream"], [/perch/i, "estuary-perch"], [/salmon/i, "salmon"], [/trevally/i, "trevally"], [/kingfish/i, "kingfish"], [/gummy/i, "gummy-shark"], [/elephant/i, "elephant-fish"], [/snook|pike/i, "snook"], [/leatherjacket/i, "leatherjacket"]];
export const spImg = (name: string) => { const m = SP_FILES.find(([r]) => r.test(name)); return m ? `${BASE}sp/${m[1]}.webp` : null; };
export const SpThumb = ({ name, size = 56 }: { name: string; size?: number }) => { const u = spImg(name);
  return <span className="thumb" style={{ width: size, height: Math.round(size * 0.5625) }}>{u ? <img src={u} alt="" loading="lazy" decoding="async" width={size} height={Math.round(size * 0.5625)} /> : <svg viewBox="0 0 24 24" width={size * 0.45} height={size * 0.45} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3zM7.5 11h.01" /></svg>}</span>; };
export const Stat = ({ k, v, s }: { k: string; v: React.ReactNode; s?: string }) => <div className="stat"><small>{k}</small><b>{v}</b>{s && <small>{s}</small>}</div>;

export const Ext = ({ href, children, cls = "" }: { href: string; children: React.ReactNode; cls?: string }) => <a className={cls} href={href} target="_blank" rel="noreferrer">{children}</a>;
export const Back = ({ onClick, label = "Back" }: { onClick: () => void; label?: string }) => <button className="backbtn" onClick={onClick} aria-label={label}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>{label}</button>;

/** A short fade-away message after an action. */
export function useToast() { const [m, setM] = useState(""); useEffect(() => { if (!m) return; const t = setTimeout(() => setM(""), 2500); return () => clearTimeout(t); }, [m]); return [m, setM] as const; }
