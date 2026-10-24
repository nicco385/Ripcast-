// Species-per-spot audit, 21 Oct 2026. Applied on top of spots.ts / spotinfo.ts.
// Proven = VFA lists it for the spot, or two independent fishing sources do (FishingMad location guides,
// VFA "where to fish" regional pages, Bite Compass spot guides, tackle-store and newspaper reports, forums).
// Occasional = only odd reports, or a source says "occasional". The app still shows it but labels it and never
// lets it top a recommendation. Squid need clean, salty water over weed or reef: river spots never get squid.
export type Audit = { add?: string[]; remove?: string[]; occ?: string[]; why?: Record<string, string> };
export const AUDIT: Record<string, Audit> = {
  "st-kilda-pier": { add: ["sand-flathead"], occ: ["calamari", "black-bream"], why: {
    "sand-flathead": "VFA hot spot; FishingMad and Bite Compass list flathead.",
    calamari: "Forum regulars: squid here are 'not very productive' – the odd one in clear water (Fishing Victoria forum).",
    "black-bream": "Not in FishingMad's or Bite Compass's St Kilda lists." } },
  "middle-brighton": { add: ["garfish", "king-george-whiting"], occ: ["silver-trevally"], why: {
    garfish: "Bite Compass and FishingMad (Brighton breakwall) list garfish.", "king-george-whiting": "Bite Compass and FishingMad (Brighton breakwall).",
    "silver-trevally": "Only FishingMad's breakwall guide mentions them." } },
  "kerferd-pier": { add: ["sand-flathead", "snapper", "garfish"], occ: ["calamari"], why: {
    "sand-flathead": "VFA hot spot; FishingMad lists flathead.", snapper: "FishingMad: pinkies and snapper are the main summer target; forum anglers (2019) have caught many snapper here, halfway along the left side on an incoming tide with a southerly. Local favourite.", garfish: "FishingMad list.",
    calamari: "Not in FishingMad's Kerferd list; only old forum posts of the odd squid. Murky inner-bay water." } },
  "ferguson-street-pier": { why: { snapper: "VFA hot spot, but recent angler reports are thin: in Oct 2023 a forum angler blanked on bait and plastics here, and another says the current is strong and snaggy. We trimmed its snapper rating a little." } },
  "hampton-pier": { occ: ["calamari"], why: { calamari: "No recent Hampton squid reports found, and FishingMad's Sandringham breakwater guide next door doesn't list squid. The pier was rebuilt in Jan 2026 and we found no catch reports for it yet." } },
  "seaford-pier": { add: ["australian-salmon"], occ: ["calamari", "snapper"], why: {
    "australian-salmon": "VFA: casting for salmon is 'more reliable' here.", calamari: "VFA: calamari 'occasionally'.", snapper: "VFA: 'occasionally, a good snapper'." } },
  "altona-pier": { add: ["king-george-whiting", "garfish", "australian-salmon", "black-bream"], occ: ["calamari"], why: {
    calamari: "Occasional only. The VFA's western Port Phillip guide (written before the new pier opened in Dec 2023) says calamari can be caught off the sides over the weed beds, but we found almost no real catch reports from the pier: one disputed 2005 forum claim, a 2019 forum reply saying 'No squid' and that you need weed beds, and none since the new pier opened. Local anglers say squid are rarely caught here. Boat anglers do catch them out from the pier and towards Point Cook.", "king-george-whiting": "VFA (western Port Phillip page).",
    garfish: "VFA: garfish under a light berley.", "australian-salmon": "VFA: the reefs attract salmon.", "black-bream": "VFA: bream live under the pier." } },
  "gem-pier": { add: ["sand-flathead"], occ: ["silver-trevally", "mulloway"], why: {
    "sand-flathead": "VFA: pinky snapper and flathead are taken here.", "silver-trevally": "VFA: 'occasional' trevally.",
    mulloway: "VFA mentions mulloway for kayaks in Hobsons Bay, not from this pier." } },
  "warmies-wall": { add: ["australian-salmon", "sand-flathead"], why: { "australian-salmon": "VFA: salmon common when the station runs.", "sand-flathead": "VFA list." } },
  "st-helens": { add: ["australian-salmon", "garfish"], occ: ["calamari"], why: { calamari: "FishingMad lists squid; local reports are mostly snapper, flathead, whiting and garfish (Geelong Independent, Getfished)." } },
  "safety-beach": { occ: ["calamari"], why: { calamari: "Only Bite Compass lists calamari; no reports found." } },
  "portsea-pier": { add: ["king-george-whiting", "sand-flathead"], occ: ["snapper"], why: {
    "king-george-whiting": "VFA: whiting and flathead at all tides.", "sand-flathead": "VFA.", snapper: "VFA: snapper catches 'aren't common'." } },
  "frankston-pier": { add: ["sand-flathead", "australian-salmon"], why: { "sand-flathead": "VFA: the artificial reef attracts flathead, snapper, leatherjackets and salmon.", "australian-salmon": "VFA (eastern Port Phillip page)." } },
  "rye-pier": { add: ["silver-trevally", "snapper"], occ: ["snapper"], why: { "silver-trevally": "FishingMad Rye list.", snapper: "FishingMad lists snapper, but Rye is a squid and whiting pier – snapper are a bonus." } },
  "rosebud-pier": { add: ["australian-salmon", "silver-trevally", "snapper"], occ: ["snapper"], why: { "australian-salmon": "FishingMad Rosebud list.", "silver-trevally": "FishingMad Rosebud list.", snapper: "FishingMad lists snapper, but they are a bonus here." } },
  "st-leonards-pier": { add: ["australian-salmon", "silver-trevally", "leatherjacket"], why: { calamari: "VFA, FishingMad and the Geelong Independent all name it for squid.", "australian-salmon": "VFA (Geelong & Bellarine page).", "silver-trevally": "VFA.", leatherjacket: "VFA." } },
  "portarlington-pier": { add: ["garfish", "australian-salmon"], why: { calamari: "FishingMad: the nearby weed beds are good squid ground.", garfish: "VFA.", "australian-salmon": "VFA." } },
  "yarra-southbank": { occ: ["snapper"], why: { snapper: "Pinkies only wander this far up now and then." } },
  "maribyrnong-footscray": { occ: ["snapper"], why: { snapper: "Bite Compass: 'pinkies wander in'." } },
  "maribyrnong-anglers": { occ: ["snapper"], why: { snapper: "Pinkies wander in now and then." } },
  "yarra-herring": { occ: ["silver-trevally"], why: { "silver-trevally": "Trevally are a lower-river fish; only odd ones this far up." } },

  // ---- 23 Oct 2026: local favourites the VFA list leaves out. "why" = the evidence; "occ" = only now and then. ----
  "webb-dock-rocks": { occ: ["black-bream", "gummy-shark", "mulloway"], why: {
    snapper: "FishingMad calls it 'arguably one of the best land-based snapper spots' near Melbourne; Reedy's Rigs names Webb Dock for land-based snapper; forum reports of pinkies and 40 cm fish (2012–2023). Local favourite.",
    "sand-flathead": "FishingMad: flathead on the outgoing low tide; forum.",
    "silver-trevally": "FishingMad species list; a forum angler caught a 22 cm trevally here in Oct 2023.",
    "australian-salmon": "FishingMad species list; a 23 cm salmon was caught here in Oct 2023 (forum).",
    "black-bream": "FishingMad lists bream, but a 2012 forum angler said the bream had been fished out. Only occasional.",
    "gummy-shark": "Listed by FishingMad, with no recent catch reports found. Only occasional.",
    mulloway: "FishingMad mentions mulloway, but no catch reports found. Only occasional." } },
  "hampton-groynes": { occ: ["calamari", "sand-flathead", "australian-salmon", "king-george-whiting"], why: {
    snapper: "Forum anglers (2018–2019) catch pinkies and the odd snapper off the groynes, best in light south-westerlies or north-westerlies, at dawn and dusk. Reedy's Rigs names Hampton for shallow land-based snapper. Snaggy and toadies are a pest.",
    calamari: "A forum angler saw 'a few squid' in 2019; others lose jigs in the snags. Occasional.",
    "sand-flathead": "Only a Bite Compass guide lists flathead on the sand between the groynes. Occasional.",
    "australian-salmon": "Only a Bite Compass guide lists salmon schools here. Occasional.",
    "king-george-whiting": "Only a Bite Compass guide lists whiting on the sand gaps. Occasional." } },
  "williamstown-rocks": { occ: ["calamari", "sand-flathead", "silver-trevally"], why: {
    snapper: "Forum anglers (2016, 2019) catch pinkies off the seawall and rocks; the VFA says pinkies are caught year-round on the reef just off here, with bigger snapper in warmer months.",
    "australian-salmon": "Forum anglers and Bite Compass: salmon are caught here, and schools can show up at any time (VFA).",
    calamari: "A forum angler targets squid here from a boat or kayak; land-based squid reports are thin. Occasional.",
    "sand-flathead": "Only Bite Compass lists flathead on the sand edges between reef patches. Occasional.",
    "silver-trevally": "Only Bite Compass lists trevally under berley. Occasional." } },
  "sandringham-breakwater": { occ: ["calamari"], why: {
    snapper: "FishingMad: many snapper caught here over the years, best October to March; a forum angler has seen 60–70 cm snapper off the wall (2023). Reedy's Rigs names Sandringham-side shallow ground. Another angler blanked, so it is not a sure thing. Local favourite.",
    "king-george-whiting": "FishingMad: a very common catch in the warmer months and at night, in clearings in the weed.",
    garfish: "FishingMad (float rig with small baits) and Bite Compass.",
    "sand-flathead": "FishingMad: flathead on plastics along the wall.",
    "australian-salmon": "FishingMad: salmon caught casting plastics.",
    "silver-trevally": "FishingMad: trevally caught on plastics near the moored yachts.",
    calamari: "Bite Compass calls it an occasional bonus, and a forum angler has never caught one here. Occasional." } },
  "princes-pier": { occ: ["mulloway", "garfish"], why: {
    snapper: "The old timber stumps beyond the deck act as a reef: Bite Compass, FishingMad and forum anglers all name Princes Pier for snapper and pinkies, best on a high tide at first and last light.",
    "black-bream": "Bream live in the timber (Bite Compass; forum).",
    "sand-flathead": "Flathead on the sand edges (Bite Compass; a forum angler caught them on plastics).",
    "australian-salmon": "Salmon on metal lures (forum), and Bite Compass lists them from March to September.",
    mulloway: "A forum angler mentions a chance of mulloway, and Bite Compass says they turn up now and then. Occasional.",
    garfish: "Bite Compass says garfish pass by in season. Occasional." } },
  "lagoon-pier": { occ: ["gummy-shark", "silver-trevally", "garfish", "calamari"], why: {
    snapper: "Forum anglers say they have caught many snapper off Lagoon Pier (2019); Bite Compass lists pinkies all year and bigger snapper in spring, especially after rain flushes the Yarra.",
    "sand-flathead": "Flathead are the steadiest fish over the sand in the warmer months (Bite Compass; forum).",
    "australian-salmon": "Small salmon caught on bait in front of the pier (forum, 2021); Bite Compass.",
    "gummy-shark": "One forum angler caught a gummy here. Occasional.",
    "silver-trevally": "Visit under berley (Bite Compass); one forum report. Occasional.",
    garfish: "Visit under berley (Bite Compass); one forum report. Occasional.",
    calamari: "'Now and then in clear water' (Bite Compass); one forum report. Occasional." } },
  "black-rock-beach-choc": { why: {
    calamari: "Choc's spot – local knowledge: Choc, an experienced local angler, catches squid here (24 Oct 2026). Background: Beachsafe describes sandstone reef off the beach, and in 2018 a forum angler saw squid caught off the rocks by the Black Rock jetty car park, about 1 km north-west.",
    garfish: "Choc's spot – local knowledge: Choc catches garfish here (24 Oct 2026). FishingMad says the weedy ground around Black Rock suits garfish, squid and whiting." } },
  "north-road-rocks-choc": { why: {
    calamari: "Choc's spot – local knowledge: Choc, an experienced local angler, catches squid here (24 Oct 2026). A squid-fishing guide also lists the North Road boat ramp among Melbourne squid spots.",
    garfish: "Choc's spot – local knowledge: Choc catches garfish here (24 Oct 2026)." } },
  "williamstown-beach-rocks-choc": { why: {
    calamari: "Choc's spot – local knowledge: Choc, an experienced local angler, catches squid here (24 Oct 2026). A boat angler on the Fishing Victoria forum (2020) says the rock wall near Williamstown Beach almost never fails for squid, in 2–4 m close to the wall." } },
  "spotswood-bank-choc": { why: {
    snapper: "Choc's spot – local knowledge: Choc, an experienced local angler, catches snapper here (24 Oct 2026). The VFA and FishingMad list snapper at the Warmies, 1 km downstream (best January to March).",
    "gummy-shark": "Choc's spot – local knowledge: Choc catches gummy sharks here (24 Oct 2026). FishingMad lists gummy sharks at the Warmies and in the lower Yarra." } },
  "francis-st-lookout-choc": { why: {
    snapper: "Choc's spot – local knowledge: Choc, an experienced local angler, catches snapper here (24 Oct 2026). FishingMad lists snapper (pinkies) in the lower Yarra from October to April.",
    mulloway: "Choc's spot – local knowledge: Choc catches mulloway here (24 Oct 2026). FishingMad and Bite Compass name mulloway as the lower Yarra's trophy fish, best after dark on a tide change.",
    "black-bream": "Choc's spot – local knowledge: Choc catches bream here (24 Oct 2026). Bream are the lower Yarra's steadiest fish (FishingMad; Bite Compass)." } },
  "lynchs-bridge-choc": { why: {
    "black-bream": "Choc's spot – local knowledge: Choc, an experienced local angler, catches bream here (24 Oct 2026). FishingMad says bream and mullet are the most likely catch at Lynch Bridge; the VFA says black bream are the most common fish in this part of the river.",
    snapper: "Choc's spot – local knowledge: Choc catches pinkies here (24 Oct 2026). FishingMad says pinkies move into the channel in the warmer months; the VFA lists pinkie snapper in the lower Maribyrnong.",
    "estuary-perch": "Choc's spot – local knowledge: Choc catches estuary perch here (24 Oct 2026). FishingMad says the estuary perch action can be frantic on warm, still evenings; the river has been heavily stocked with them." } },
  "chifley-drive-choc": { why: {
    "black-bream": "Choc's spot – local knowledge: Choc, an experienced local angler, catches bream here (24 Oct 2026). The VFA says black bream are the most common fish in the Maribyrnong below Solomons Ford.",
    "estuary-perch": "Choc's spot – local knowledge: Choc catches estuary perch here (24 Oct 2026). The Maribyrnong has been heavily stocked with estuary perch (FishingMad)." } },
  "bolte-bridge-creek-mouth-choc": { why: {
    "black-bream": "Choc's spot – local knowledge: Choc, an experienced local angler, catches bream here (24 Oct 2026). FishingMad also reports bream around the Docklands structure and at the Moonee Ponds Creek mouth.",
    snapper: "Choc's spot – local knowledge: Choc catches snapper and pinkies (small snapper) here (24 Oct 2026). FishingMad lists snapper and pinkies at Docklands.",
    mulloway: "Choc's spot – local knowledge: Choc catches mulloway here (24 Oct 2026). FishingMad lists mulloway at Docklands, often near bridges and pylons. The normal mulloway season scoring still applies." } },
  "river-esplanade-pier-choc": { why: {
    "black-bream": "Choc's spot – local knowledge: Choc, an experienced local angler, catches bream here (24 Oct 2026). The City of Melbourne says bream are the most common of 19 fish species recorded in Docklands.",
    snapper: "Choc's spot – local knowledge: Choc catches snapper and pinkies (small snapper) here (24 Oct 2026). The City of Melbourne lists snapper as common in Docklands.",
    mulloway: "Choc's spot – local knowledge: Choc catches mulloway here (24 Oct 2026). The City of Melbourne lists mulloway in Docklands. The normal mulloway season scoring still applies." } },
  "punt-road-landing-choc": { why: {
    "black-bream": "Choc's spot – local knowledge: Choc, an experienced local angler, catches bream here (24 Oct 2026). The VFA lists black bream in the Yarra below Dights Falls.",
    mulloway: "Choc's spot – local knowledge: Choc catches mulloway here (24 Oct 2026). The VFA records mulloway to 20 kg below Dights Falls, and WeekendNotes names Punt Road as a Yarra mulloway spot. The normal mulloway season scoring still applies." } },
  "black-rock-jetty": { occ: ["garfish", "sand-flathead", "australian-salmon"], why: {
    snapper: "Bite Compass and FishingMad: a cast from the end reaches snapper water; Parks Victoria says the jetty gives year-round access to a good variety of fish. A forum angler lost a big red off the rocks at Black Rock in 2023.",
    calamari: "Forum anglers caught squid off Black Rock pier (2018); FishingMad and Bite Compass say calamari fire when the water is clear.",
    "king-george-whiting": "Bite Compass and FishingMad: whiting on the sand with light gear.",
    garfish: "Only Bite Compass lists garfish on a float. Occasional.",
    "sand-flathead": "Only Bite Compass lists flathead. Occasional.",
    "australian-salmon": "Pinkies and salmon are a year-round fishery on the inshore reef (Bite Compass), but few reports from the jetty itself. Occasional." } },
  "beaumaris-pier": { occ: ["snapper"], why: {
    calamari: "Forum anglers caught squid off Beaumaris pier (2018); a 2026 local squid guide calls it a sheltered night squid spot; FishingMad says squid are good in seasonal parts of the year.",
    garfish: "FishingMad: good numbers of garfish and squid in seasonal parts of the year.",
    snapper: "Only Bite Compass-style summaries mention snapper at dawn and dusk. Occasional." } },
};
