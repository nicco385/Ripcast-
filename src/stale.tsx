// "Last checked" warnings for facts we enter by hand (closures, report links, size and bag limits).
const MON: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
/** Parse "17 Oct 2026" or "13 October 2026". */
export function parseDay(s: string): number | null {
  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(s); if (!m) return null;
  const mo = MON[m[2].toLowerCase()]; return mo == null ? null : new Date(+m[3], mo, +m[1], 12).getTime();
}
export const daysSince = (s: string, now = Date.now()) => { const t = parseDay(s); return t == null ? null : Math.floor((now - t) / 86400000); };
export const STALE_DAYS = 30;
const LINKS: Record<string, [string, string]> = {
  limits: ["https://vfa.vic.gov.au/recreational-fishing/recreational-fishing-guide/catch-limits-and-closed-seasons", "check the VFA"],
  closure: ["https://www.parks.vic.gov.au/news", "check Parks Victoria or the local council"],
  reports: ["", "a link may have moved"],
};
/** Shows nothing when fresh; a short warning once the fact is more than 30 days old. */
export function StaleNote({ checked, what, now }: { checked: string; what: "limits" | "closure" | "reports"; now?: number }) {
  const d = daysSince(checked, now); if (d == null || d <= STALE_DAYS) return null;
  const [u, t] = LINKS[what];
  return <span className="stale">⚠️ Last checked {d} days ago – {u ? <a href={u} target="_blank" rel="noreferrer">{t} ↗</a> : t}.</span>;
}
