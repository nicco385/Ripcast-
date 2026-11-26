// "Hot this week": a small, hand-made list of recent land-based catch reports (see docs/weekly-reports.md).
// Only confirmed recent shore catches can boost spots. Ambiguous regional reports are information-only.
// Paraphrase only – never copy report text – and always credit and link the source.
export type HotEntry = {
  /** app spot ids this report can be tied to with confidence */
  spots: string[];
  /** True only when the source explicitly supports recent shore catches at this spot/area. */
  shoreConfirmed: boolean;
  area?: string; // use regional label, not a false exact-spot catch claim
  /** "spot" = the report names this spot; "area" = it names the area/suburb only (smaller boost) */
  level: "spot" | "area";
  species: string; // species slug, e.g. "snapper"
  note: string; // short paraphrase
  source: string; url: string;
  reported: string; // YYYY-MM-DD (date of the report)
  expires: string; // YYYY-MM-DD, last day it counts (7–10 days after `reported`)
};

/** Last weekly update (Melbourne date). */
export const HOT_UPDATED = "2026-11-27";

export const HOT: HotEntry[] = [
  { spots: ["mornington-pier"], shoreConfirmed: true, level: "spot", species: "snapper", note: "Shore evidence: FishingMad's land-based report (23 Nov, public summary) lists Mornington Pier among the places that gave land-based anglers great snapper fishing last week.",
    source: "FishingMad – Land Based Fishing Report", url: "https://fishingmad.com.au/fishing_reports/land-based-fishing-report-23-11-2026/", reported: "2026-11-23", expires: "2026-12-01" },
  { spots: ["portarlington-pier"], shoreConfirmed: true, level: "spot", species: "snapper", note: "Shore evidence: Born2Fish (25 Nov) says the Portarlington rock wall by the harbour keeps giving land-based anglers excellent snapper; FishingMad's land-based summary (23 Nov) also names the Portarlington rock wall for snapper.",
    source: "Born2Fish – weekly fishing report", url: "https://www.born2fish.com.au/fishing-reports-tips", reported: "2026-11-25", expires: "2026-12-03" },
  { spots: ["mornington-pier", "rye-pier", "frankston-pier"], shoreConfirmed: false, area: "Mornington Peninsula piers", level: "area", species: "calamari", note: "VFA (20 Nov): piers on the Mornington Peninsula side are producing land-based snapper, pinkies and squid – jig the sandy gaps between weed beds. No particular pier named, so information only, no score boost.",
    source: "VFA – The Pelican's Pick", url: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", reported: "2026-11-20", expires: "2026-11-29" },
];

const TZ = "Australia/Melbourne";
const dayOf = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(t);
/** Entries still current on the Melbourne date of `t` (report date to expiry, inclusive). */
export const activeHot = (t = Date.now(), list = HOT) => { const d = dayOf(t); return list.filter((h) => h.reported <= d && d <= h.expires); };
export const shortDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
/** Best matching current report for a spot + species (a spot-level mention beats an area one). */
export const hotFor = (spotId: string, slug: string, t = Date.now(), list = HOT) =>
  activeHot(t, list).filter((h) => h.shoreConfirmed === true && h.species === slug && h.spots.includes(spotId)).sort((a, b) => Number(b.level === "spot") - Number(a.level === "spot"))[0];
