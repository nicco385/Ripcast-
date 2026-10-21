// A year at a glance for land-based fishing around Melbourne: where the fish move and when.
// Sources: VFA Go Fishing pages (peak seasons); Peninsula Insider month table (checked 30 Apr 2026);
// FishingMad weekly reports 2025–26; Compleat Angler Dandenong newsletter (Aug 2026); VFA Pelican's Pick (Oct 2026).
// Patterns shift year to year with water temperature. Always read a recent report.
export type MonthNote = { month: number; headline: string; points: string[] };
export const YEAR: MonthNote[] = [
  { month: 1, headline: "Whiting and pinkies", points: ["City rivers and Albert Park Lake: estuary, golden and silver perch are more active in the warmer months, best at dawn and dusk (FishingMad). A rough guide only.", "King George whiting on the Peninsula and Bellarine piers; school-holiday crowds.", "Small snapper ('pinkies') at the Warmies (Newport) from January to March (FishingMad).", "Flathead (Oct–Mar) and silver trevally still in season (VFA)."] },
  { month: 2, headline: "Best whiting month", points: ["Peninsula Insider calls February the best whiting month in Port Phillip.", "Garfish and flathead are in season (VFA).", "Calamari picks up from March."] },
  { month: 3, headline: "Squid and salmon start", points: ["Squid run begins; whiting still strong (Peninsula Insider).", "Salmon season starts (VFA, Mar–Sep). Gummy shark (Mar–Oct) and elephant fish at Corinella (Mar–May).", "In 2025 anglers reported a second, smaller run of snapper in the autumn (FishingMad) – it varies by year."] },
  { month: 4, headline: "Squid peak", points: ["Calamari at its best (Peninsula Insider; VFA Apr–Oct).", "Good conditions for soft plastics. Salmon, trevally and elephant fish also in season."] },
  { month: 5, headline: "Quieter on piers", points: ["Calamari, salmon and gummy shark. Piers are quieter than summer (Peninsula Insider).", "Last month of the VFA snapper season – pinkies still around the city piers and the Warmies on calm evenings.", "Elephant fish season ends at Corinella (VFA Mar–May)."] },
  { month: 6, headline: "Salmon, gummy and bream", points: ["Salmon and tailor at the Warmies in June–August when the power-station pumps are running (FishingMad).", "Gummy shark at night; whiting, squid and gummy in Western Port (FishingMad).", "Bream season begins (VFA, Jun–Nov)."] },
  { month: 7, headline: "Cold and quiet – pick your day", points: ["Salmon and trevally are the land-based staples (FishingMad). Winter squid on Peninsula piers like Rye, Sorrento and Blairgowrie.", "Garfish are in season (VFA Nov–Jul). Pinkies were still reported around Melbourne even in mid-winter (FishingMad)."] },
  { month: 8, headline: "Garfish and big squid", points: ["Garfish on Mornington, Frankston, Beaumaris and Rye piers; big squid from Flinders and Sorrento (Compleat Angler, Aug 2026).", "Early snapper are sometimes found in shallow water from late August (mostly boats)."] },
  { month: 9, headline: "Snapper arriving", points: ["Water is warming. First snapper reach the southern bay (Peninsula Insider).", "Western Port's top end (Lang Lang to Tenby Point) usually fires 3–4 weeks before Port Phillip (FishingMad).", "FishingMad: big squid and snapper move into the shallows as water warms from about 12 to 14 °C."] },
  { month: 10, headline: "Snapper run begins", points: ["VFA peak snapper season starts in October. Western Port first, then Port Phillip.", "Land-based snapper reported (FishingMad, Oct 2025–26): Portarlington, St Leonards, Clifton Springs, Queenscliff, Mornington, Mt Martha, Sandringham, Webb Dock, the Warmies, Lang Lang.", "Windy days can help from the shore, because snapper move into the shallows (FishingMad). Flathead and trevally come into season."] },
  { month: 11, headline: "Best snapper month", points: ["City rivers and Albert Park Lake: estuary, golden and silver perch are more active in the warmer months, best at dawn and dusk (FishingMad). A rough guide only.", "Peninsula Insider calls November the best snapper month in Port Phillip.", "King George whiting and garfish come into season (VFA, Nov–Apr / Nov–Jul)."] },
  { month: 12, headline: "Late snapper peak, whiting", points: ["Snapper run tails off into the new year but pinkies stay (VFA season to May).", "Piers get very busy in the holidays – go early or late."] },
];
export const CAL_SOURCES = [
  { t: "VFA – Port Phillip Bay", u: "https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-port-phillip-bay" },
  { t: "VFA – Western Port", u: "https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-western-port" },
  { t: "Peninsula Insider – month table", u: "https://peninsulainsider.com.au/fishing/" },
  { t: "FishingMad – Albert Park Lake guide", u: "https://fishingmad.com.au/location/albert-park-lake/" },
  { t: "VFA – Inland estuary perch stocking", u: "https://vfa.vic.gov.au/recreational-fishing/fish-stocking/inland-estuary-perch-fisheries" },
  { t: "FishingMad weekly reports", u: "https://fishingmad.com.au/reports/" },
  { t: "VFA – Where to fish Port Phillip (by region)", u: "https://vfa.vic.gov.au/recreational-fishing/victorias-top-fishing-destinations/port-phillip/where-to-fish-port-phillip" },
];
