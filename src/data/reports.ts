// Report sources. Every link below was opened and checked live on 17 Oct 2026 (Sydney time) and showed content from the past month.
// "How often" describes what we saw. Nothing here is our own report – we link out so you always see the original.
import type { Area } from "./spotinfo";
export type ReportLink = { t: string; u: string; by: string; how: string; areas: (Area | "all")[]; note?: string };
export const REPORTS: ReportLink[] = [
  { t: "The Pelican's Pick", u: "https://vfa.vic.gov.au/recreational-fishing/the-pelicans-pick", by: "Victorian Fisheries Authority", how: "Weekly (latest seen: 16 Oct 2026)", areas: ["all"], note: "Official. The 'Around the Bays' section covers Port Phillip and Western Port." },
  { t: "FishingMad – weekly reports", u: "https://fishingmad.com.au/reports/", by: "FishingMad (Melbourne angler)", how: "Weekly (latest seen: 10 Oct 2026)", areas: ["all"], note: "Separate land-based, Port Phillip, Western Port and estuary reports. Some detail may need a FishingMad membership." },
  { t: "Trelly's Victorian Fishing Report", u: "https://www.trellys.com.au/blogs/fishing-report-victoria", by: "Trellys tackle store", how: "Weekly (latest seen: 16 Oct 2026)", areas: ["all"] },
  { t: "The Burley Pot", u: "https://www.fishingcamping.com.au/the-burley-pot-august-2026/", by: "Compleat Angler Dandenong (tackle shop)", how: "Monthly newsletter (first edition: Aug 2026)", areas: ["east", "peninsula", "westernport"], note: "Pier and bait tips for Port Phillip and Western Port. Shop phone: 03 9794 9397." },
  { t: "Getfished – Port Phillip Bay", u: "https://getfished.fish/vic/port-phillip-bay/fishing-report/", by: "Getfished (community entries)", how: "A few entries a month (latest seen: 11 Oct 2026)", areas: ["northwest", "east", "peninsula", "bellarine"], note: "Small sample – treat as a hint, not a forecast." },
  { t: "Getfished – Western Port", u: "https://getfished.fish/vic/western-port/fishing-report/", by: "Getfished (community entries)", how: "A few entries a month (latest seen: 27 Sep 2026)", areas: ["westernport"], note: "Small sample – treat as a hint, not a forecast." },
  { t: "Geelong Times – fishing column", u: "https://timesnewsgroup.com.au/geelongtimes/sport/fishing/", by: "Geelong Times / Torquay Angling Club", how: "Regular (latest seen: 9 Oct 2026)", areas: ["bellarine"], note: "Short reports from Torquay, Point Lonsdale and Clifton Springs." },
  { t: "Fishing Victoria Forum – Geelong & Bellarine", u: "https://www.fishing-victoria.com/viewforum.php?f=150", by: "Fishing Victoria Forum (members)", how: "Quieter lately – last posts Jan 2026", areas: ["bellarine"], note: "Good for local spot knowledge. Older posts, so check dates." },
  { t: "FishingMad – Yarra River guide", u: "https://fishingmad.com.au/location/yarra-river/", by: "FishingMad", how: "Reference guide", areas: ["rivers"], note: "Species by month, gear and where to fish along the Yarra." },
  { t: "FishingMad – The Warmies guide", u: "https://fishingmad.com.au/location/the-warmies/", by: "FishingMad", how: "Reference guide", areas: ["rivers", "northwest"], note: "Newport Power Station warm-water outlet: when it runs, tackle and safety." },
  { t: "Peninsula Insider – Tooradin Inlet", u: "https://peninsulainsider.com.au/fishing/locations/tooradin-inlet/", by: "Peninsula Insider", how: "Reference guide (checked 30 Apr 2026)", areas: ["westernport"] },
  { t: "Peninsula Insider – Fishing the Mornington Peninsula", u: "https://peninsulainsider.com.au/fishing/", by: "Peninsula Insider", how: "Reference guide (checked 30 Apr 2026)", areas: ["peninsula", "westernport"], note: "Month-by-month overview and tide notes for the peninsula." },
];
export const NO_REPORTS: Record<string, string> = {
  rivers: "No weekly Yarra or Maribyrnong report found. FishingMad's weekly reports often cover the city rivers.",
  westernport: "Lang Lang: check FishingMad's weekly Western Port report (the muddy banks near Lang Lang were a hot spot in Oct 2026) and the Pelican's Pick.",
};
export const REPORT_CHECKED = "17 Oct 2026";
