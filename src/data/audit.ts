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
    "sand-flathead": "VFA hot spot; FishingMad lists flathead.", snapper: "FishingMad: pinkies and snapper are the main summer target.", garfish: "FishingMad list.",
    calamari: "Not in FishingMad's Kerferd list; only old forum posts of the odd squid. Murky inner-bay water." } },
  "hampton-pier": { occ: ["calamari"], why: { calamari: "No recent Hampton squid reports found, and FishingMad's Sandringham breakwater guide next door doesn't list squid." } },
  "seaford-pier": { add: ["australian-salmon"], occ: ["calamari", "snapper"], why: {
    "australian-salmon": "VFA: casting for salmon is 'more reliable' here.", calamari: "VFA: calamari 'occasionally'.", snapper: "VFA: 'occasionally, a good snapper'." } },
  "altona-pier": { add: ["king-george-whiting", "garfish", "australian-salmon", "black-bream"], why: {
    calamari: "VFA: calamari and whiting off the sides of the pier over weed.", "king-george-whiting": "VFA (western Port Phillip page).",
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
};
