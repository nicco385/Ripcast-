// Report sources. Every link below was opened and checked live on 19 Oct 2026 (Sydney time) and showed content from the past month.
// "How often" describes what we saw. Nothing here is our own report – we link out so you always see the original.
import type { Area } from "./spotinfo";
export type ReportLink = { t: string; u: string; by: string; how: string; areas: (Area | "all")[]; note?: string };
export const REPORTS: ReportLink[] = [
  { t: "The Pelican's Pick", u: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", by: "Victorian Fisheries Authority", how: "Weekly (latest seen: 16 Oct 2026)", areas: ["all"], note: "Official. The 'Around the Bays' section covers Port Phillip and Western Port." },
  { t: "FishingMad – weekly reports", u: "https://fishingmad.com.au/reports/", by: "FishingMad (Melbourne angler)", how: "Weekly (latest seen: 10 Oct 2026)", areas: ["all"], note: "Separate land-based, Port Phillip, Western Port and estuary reports. Some detail may need a FishingMad membership." },
  { t: "Trelly's Victorian Fishing Report", u: "https://www.trellys.com.au/blogs/fishing-report-victoria", by: "Trellys tackle store", how: "Written weekly, no maps (latest seen: 16 Oct 2026)", areas: ["all"], note: "Covers Corio Bay and the Bellarine in some weeks, and lakes and rivers in others." },
  { t: "The Burley Pot", u: "https://www.fishingcamping.com.au/the-burley-pot-august-2026/", by: "Compleat Angler Dandenong (tackle shop)", how: "Monthly newsletter (first edition: Aug 2026)", areas: ["east", "peninsula", "westernport"], note: "Pier and bait tips for Port Phillip and Western Port. Shop phone: 03 9794 9397." },
  { t: "Getfished – Port Phillip Bay", u: "https://getfished.fish/vic/port-phillip-bay/fishing-report/", by: "Getfished (community entries)", how: "A few entries a month (latest seen: 11 Oct 2026)", areas: ["northwest", "east", "peninsula", "bellarine"], note: "Small sample – treat as a hint, not a forecast." },
  { t: "Getfished – Western Port", u: "https://getfished.fish/vic/western-port/fishing-report/", by: "Getfished (community entries)", how: "A few entries a month (latest seen: 27 Sep 2026)", areas: ["westernport"], note: "Small sample – treat as a hint, not a forecast." },
  { t: "All Out Fishing – weekly video report", u: "https://www.facebook.com/alloutfishingau", by: "All Out Fishing (Geelong store, Manifold Heights)", how: "Geelong store – weekly video report with map (posts can be irregular). Latest seen: 23 Sep 2026", areas: ["bellarine"], note: "Facebook videos that use a map to show where fish are biting around Geelong and the Bellarine. Facebook may ask you to log in." },
  { t: "Geelong Times – fishing column", u: "https://timesnewsgroup.com.au/geelongtimes/sport/fishing/", by: "Geelong Times / Torquay Angling Club", how: "Regular (latest seen: 9 Oct 2026)", areas: ["bellarine"], note: "Short reports from Torquay, Point Lonsdale and Clifton Springs." },
  { t: "Fishing Victoria Forum – Geelong & Bellarine", u: "https://www.fishing-victoria.com/viewforum.php?f=150", by: "Fishing Victoria Forum (members)", how: "Quieter lately – last posts Jan 2026", areas: ["bellarine"], note: "Good for local spot knowledge. Older posts, so check dates." },
  { t: "FlyStream local reports (The Flyfisher)", u: "https://theflyfisher.com.au/a/blog", by: "The Flyfisher (fly shop, South Melbourne)", how: "Every few weeks (latest seen: 15 Oct 2026)", areas: ["freshwater"], note: "Written trout reports with photos, for the Goulburn Valley streams and Bright. Those are a 1.5–3 hour drive from Melbourne. Look for posts marked 'Local reports'." },
];
export const NO_REPORTS: Record<string, string> = {
  rivers: "No weekly Yarra or Maribyrnong report found. FishingMad's weekly reports often cover the city rivers.",
  westernport: "Lang Lang: check FishingMad's weekly Western Port report (the muddy banks near Lang Lang were a hot spot in Oct 2026) and the Pelican's Pick.",
};
export const REPORT_CHECKED = "19 Oct 2026";

/** Guides and how-to places (moved out of Reports in v1.7.1). Shown on the Tips & rigs page. */
export const GUIDES: ReportLink[] = [
  { t: "VFA – Where to fish Port Phillip", u: "https://vfa.vic.gov.au/recreational-fishing/victorias-top-fishing-destinations/port-phillip/where-to-fish-port-phillip", by: "Victorian Fisheries Authority", how: "Reference guide (checked 21 Oct 2026)", areas: ["northwest", "east", "peninsula", "bellarine"], note: "Pier-by-pier notes for the western, northern, eastern, Peninsula and Geelong–Bellarine shores: which fish, which side of the pier, which tide." },
  { t: "FishingMad – Yarra River guide", u: "https://fishingmad.com.au/location/yarra-river/", by: "FishingMad", how: "Reference guide", areas: ["rivers"], note: "Species by month, gear and where to fish along the Yarra." },
  { t: "FishingMad – The Warmies guide", u: "https://fishingmad.com.au/location/the-warmies/", by: "FishingMad", how: "Reference guide", areas: ["rivers", "northwest"], note: "Newport Power Station warm-water outlet: when it runs, tackle and safety." },
  { t: "Peninsula Insider – Tooradin Inlet", u: "https://peninsulainsider.com.au/fishing/locations/tooradin-inlet/", by: "Peninsula Insider", how: "Reference guide (checked 30 Apr 2026)", areas: ["westernport"] },
  { t: "Peninsula Insider – Fishing the Mornington Peninsula", u: "https://peninsulainsider.com.au/fishing/", by: "Peninsula Insider", how: "Reference guide (checked 30 Apr 2026)", areas: ["peninsula", "westernport"], note: "Month-by-month overview and tide notes for the peninsula." },
  { t: "VFA – Go Fishing: Port Phillip Bay", u: "https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-port-phillip-bay", by: "Victorian Fisheries Authority", how: "Official guide", areas: ["all"], note: "List of piers, what is caught there and amenities." },
  { t: "VFA – Go Fishing: Western Port", u: "https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-western-port", by: "Victorian Fisheries Authority", how: "Official guide", areas: ["westernport"], note: "Flinders, Hastings, Stony Point, Tooradin, San Remo, Cowes and more." },
];
/** Notes from the old Reports entries for the experts' channels (kept, shown under The experts). */
export const CHANNEL_NOTES: Record<string, string> = {
  lee: "Snapper, whiting and mulloway how-tos, mostly Port Phillip and Western Port (mostly from a boat, but the tips work from land too). Recommended by Choc.",
  brett: "Rig-tying, whiting, squid and gummy videos, including a land-based gummy set-up for Western Port. His website has a snapper guide for both bays (it's a tackle shop, so some links sell products). Recommended by Choc.",
  brendan: "Western Port mulloway ('ghosts of the estuary') and snapper. Mostly from a boat. Recommended by Choc.",
};
export const PODCASTS = [
  { t: "Australian Lure Fishing podcast – Melbourne snapper with Lee Rayner (ep. 276)", u: "https://podcasts.apple.com/au/podcast/melbourne-snapper-with-lee-rayner/id1447917143?i=1000493579463" },
  { t: "Australian Lure Fishing podcast – Melbourne estuary perch with Lee Rayner (ep. 435)", u: "https://podcasts.apple.com/au/podcast/melbourne-estuary-perch-with-lee-rayner/id1447917143?i=1000538876204" },
  { t: "Australian Lure Fishing podcast – Winter fishing around Melbourne with Lee Rayner (ep. 513)", u: "https://podcasts.apple.com/au/podcast/episode-513-five-best-winter-fishing-options-around/id1447917143?i=1000562062163" },
];
