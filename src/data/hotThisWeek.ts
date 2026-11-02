// "Hot this week": a small, hand-made list of recent land-based catch reports (see docs/weekly-reports.md).
// Each entry boosts matching spots a little until its expiry date, then it is ignored automatically.
// Paraphrase only – never copy report text – and always credit and link the source.
export type HotEntry = {
  /** app spot ids this report can be tied to with confidence */
  spots: string[];
  /** "spot" = the report names this spot; "area" = it names the area/suburb only (smaller boost) */
  level: "spot" | "area";
  species: string; // species slug, e.g. "snapper"
  note: string; // short paraphrase
  source: string; url: string;
  reported: string; // YYYY-MM-DD (date of the report)
  expires: string; // YYYY-MM-DD, last day it counts (7–10 days after `reported`)
};

/** Last weekly update (Melbourne date). */
export const HOT_UPDATED = "2026-11-02";

export const HOT: HotEntry[] = [
  { spots: ["black-rock-jetty"], level: "area", species: "snapper", note: "Black Rock named as the go-to area for big snapper this week (paternoster rigs with squid, pilchard or garfish; soft plastics at bite times). The report doesn't say if these were shore or boat catches, so this counts as an area mention.",
    source: "VFA – The Pelican's Pick", url: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", reported: "2026-10-30", expires: "2026-11-08" },
];

const TZ = "Australia/Melbourne";
const dayOf = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(t);
/** Entries still current on the Melbourne date of `t` (report date to expiry, inclusive). */
export const activeHot = (t = Date.now(), list = HOT) => { const d = dayOf(t); return list.filter((h) => h.reported <= d && d <= h.expires); };
export const shortDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
/** Best matching current report for a spot + species (a spot-level mention beats an area one). */
export const hotFor = (spotId: string, slug: string, t = Date.now(), list = HOT) =>
  activeHot(t, list).filter((h) => h.species === slug && h.spots.includes(spotId)).sort((a, b) => Number(b.level === "spot") - Number(a.level === "spot"))[0];
