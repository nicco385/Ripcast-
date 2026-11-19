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
export const HOT_UPDATED = "2026-11-20";

export const HOT: HotEntry[] = [
  { spots: ["lagoon-pier"], shoreConfirmed: true, level: "spot", species: "snapper", note: "Shore evidence: listed in Born2Fish's land-based section (18 Nov) – snapper being caught from Port Melbourne's Lagoon Pier after dark.",
    source: "Born2Fish – weekly fishing report", url: "https://www.born2fish.com.au/fishing-reports-tips", reported: "2026-11-18", expires: "2026-11-27" },
  { spots: ["st-leonards-pier"], shoreConfirmed: true, level: "spot", species: "calamari", note: "Shore evidence: Born2Fish's land-based section (18 Nov) says St Leonards Pier is producing squid, especially in southerly winds.",
    source: "Born2Fish – weekly fishing report", url: "https://www.born2fish.com.au/fishing-reports-tips", reported: "2026-11-18", expires: "2026-11-27" },
  { spots: ["st-leonards-pier"], shoreConfirmed: true, level: "spot", species: "king-george-whiting", note: "Shore evidence: Born2Fish's land-based section (18 Nov) says St Leonards Pier is producing whiting as well as squid, especially in southerly winds.",
    source: "Born2Fish – weekly fishing report", url: "https://www.born2fish.com.au/fishing-reports-tips", reported: "2026-11-18", expires: "2026-11-27" },
  { spots: ["warmies-wall"], shoreConfirmed: true, level: "spot", species: "snapper", note: "Shore evidence: Born2Fish's land-based section (18 Nov) reports pinkies (small snapper) around the power station at Williamstown/Newport – the Warmies outflow walls.",
    source: "Born2Fish – weekly fishing report", url: "https://www.born2fish.com.au/fishing-reports-tips", reported: "2026-11-18", expires: "2026-11-27" },
  { spots: ["st-kilda-pier"], shoreConfirmed: false, area: "St Kilda", level: "area", species: "calamari", note: "VFA (13 Nov) calls squid a popular catch from St Kilda pier on white glow jigs in low light. General description rather than a dated catch, so information only, no score boost.",
    source: "VFA – The Pelican's Pick", url: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", reported: "2026-11-13", expires: "2026-11-22" },
  { spots: ["st-kilda-pier"], shoreConfirmed: false, area: "St Kilda", level: "area", species: "snapper", note: "VFA (13 Nov): St Kilda snapper taking soft plastics on light jig heads in the shallows. Shore or boat not stated, so information only, no score boost.",
    source: "VFA – The Pelican's Pick", url: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", reported: "2026-11-13", expires: "2026-11-22" },
  { spots: ["san-remo-pier"], shoreConfirmed: false, area: "San Remo", level: "area", species: "calamari", note: "VFA (13 Nov): San Remo full of squid with many anglers bagging out; the jetty is suggested for a land-based go (3.5–4 jigs for the current). Catches not tied to the jetty itself, so information only, no score boost.",
    source: "VFA – The Pelican's Pick", url: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", reported: "2026-11-13", expires: "2026-11-22" },
];

const TZ = "Australia/Melbourne";
const dayOf = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(t);
/** Entries still current on the Melbourne date of `t` (report date to expiry, inclusive). */
export const activeHot = (t = Date.now(), list = HOT) => { const d = dayOf(t); return list.filter((h) => h.reported <= d && d <= h.expires); };
export const shortDate = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
/** Best matching current report for a spot + species (a spot-level mention beats an area one). */
export const hotFor = (spotId: string, slug: string, t = Date.now(), list = HOT) =>
  activeHot(t, list).filter((h) => h.shoreConfirmed === true && h.species === slug && h.spots.includes(spotId)).sort((a, b) => Number(b.level === "spot") - Number(a.level === "spot"))[0];
