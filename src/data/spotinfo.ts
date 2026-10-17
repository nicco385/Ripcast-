import type { Spot } from "./spots";

export type Area = "northwest" | "rivers" | "freshwater" | "east" | "peninsula" | "bellarine" | "westernport";
export const AREAS: Record<Area, { name: string; blurb: string }> = {
  northwest: { name: "Hobsons Bay & Werribee", blurb: "Williamstown, Altona and Werribee on the bay's north-west corner." },
  rivers: { name: "Yarra & Maribyrnong", blurb: "City rivers, including the Warmies at Newport." },
  freshwater: { name: "Freshwater (Albert Park Lake & upper Yarra)", blurb: "No tides here. Perch, redfin and trout in the city's lake and the freshwater Yarra." },
  east: { name: "Bayside & Frankston", blurb: "St Kilda down to Seaford and Patterson River." },
  peninsula: { name: "Mornington Peninsula", blurb: "Mornington, Dromana, Rosebud, Rye, Sorrento and Portsea." },
  bellarine: { name: "Geelong & Bellarine", blurb: "Geelong, Portarlington, St Leonards and Queenscliff." },
  westernport: { name: "Western Port", blurb: "Flinders to Tooradin and Phillip Island." },
};

export type Status = { closed: true; note: string; url: string; asOf: string };
export type Info = Partial<Omit<Spot, "id">> & {
  area: Area;
  /** "vfa" = species/tips taken from the VFA Go Fishing pages; "local" = general local knowledge, not an official list. */
  src: "vfa" | "local";
  hot?: string[];
  other?: string[];
  status?: Status;
  /** Lower Yarra / Maribyrnong health advice applies. */
  eat?: boolean;
  /** Wind shelter is not mapped for this spot. */
  noWind?: boolean;
  /** Freshwater, not tidal: no tide times or sea waves. */
  fresh?: boolean;
  /** A photo shown on the spot guide, with an honest caption. */
  photo?: { src: string; cap: string };
  /** Spot-specific rules, shown in their own card. */
  rules?: string[];
  /** A personal angler report, clearly labelled as anecdotal. */
  report?: { items: { t: string; photo?: { src: string; cap: string } }[]; note: string };
};

const PV = "https://www.parks.vic.gov.au/";
export const INFO: Record<string, Info> = {
  "st-kilda-pier": { area: "east", src: "local", hot: ["sand-flathead", "snapper"], access: "Car parking near Jacka Boulevard; the pier is a long walk to the end.", tips: "VFA names St Kilda as a hot spot for flathead and snapper." },
  "middle-brighton": { area: "east", src: "local", hot: ["snapper"], access: "The Esplanade, Brighton. Baths car park can fill early on weekends.", tips: "VFA names Brighton Pier as a snapper hot spot." },
  "mordialloc-pier": { area: "east", src: "vfa", hot: ["australian-salmon"], other: ["yellow-eye mullet"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "garfish", "king-george-whiting", "leatherjacket", "black-bream"],
    access: "Beach Road. Parking, toilets, playground, kiosk and a shelter on the pier.", tips: "VFA: autumn and winter are good on the pier. Bream and mullet in Mordialloc Creek beside it all year. Hot spot for salmon and mullet." },
  "frankston-pier": { area: "east", src: "local", access: "Kananook Creek car parks; a short walk from the station.", tips: "Local knowledge only – no VFA listing. Check the Reports tab for recent Frankston catches." },
  "mornington-pier": { area: "peninsula", src: "vfa", hot: ["leatherjacket"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "king-george-whiting", "leatherjacket", "garfish", "yellowtail-kingfish"],
    access: "Schnapper Point Drive. Plenty of parking, toilets and a kiosk.", tips: "VFA: good all year, best in summer and autumn. Cast into open water on the breakwater side, fish the quieter lee side, or drop straight down beside the pylons. Snapper season is busy – arrive early." },
  "rye-pier": { area: "peninsula", src: "local", access: "Point Nepean Road. Family friendly, with lights.", tips: "Local knowledge only – winter squid have been reported here (FishingMad). Check recent reports." },
  "sorrento-pier": { area: "peninsula", src: "vfa", hot: ["king-george-whiting"], other: ["barracouta"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "king-george-whiting", "leatherjacket"],
    access: "The Esplanade. Parking and toilets at the foot of the pier; cafes and shops nearby.", tips: "VFA: wide, roomy pier with deep water – but strong currents. Very busy in holidays and summer weekends; quieter times are easier." },
  "portsea-pier": { area: "peninsula", src: "local", status: { closed: true, asOf: "17 Oct 2026", url: PV + "news/2026/05/25/03/49/portsea-pier-maintenance-works-june-2026", note: "Closed since July 2026 for major repairs after storm damage. Parks Victoria expects it to finish before summer 2026, weather permitting – no firm date. Sorrento and Rye piers are suggested alternatives." }, tips: "Closed – see status." },
  "dromana-pier": { area: "peninsula", src: "local", status: { closed: true, asOf: "17 Oct 2026", url: "https://www.pisra.com.au/jetty-set-for-likely-autumn-opening/", note: "Closed for a full rebuild. A 1 Sep 2026 local update (via Better Boating Victoria) says reopening is likely March–April 2027 – not confirmed." }, tips: "Closed – see status." },
  "rosebud-pier": { area: "peninsula", src: "local", access: "Rosebud foreshore, with toilets and shops in town.", tips: "Local knowledge only – no VFA listing." },
  "safety-beach": { area: "peninsula", src: "local", access: "Marine Drive. Park and walk onto the sand.", tips: "Local knowledge only. A shallow beach – best when the tide is up." },
  "queenscliff-pier": { area: "bellarine", src: "vfa", hot: ["calamari"], other: ["yellow-eye mullet"], species: ["calamari", "australian-salmon", "sand-flathead", "silver-trevally", "garfish", "king-george-whiting"],
    access: "Symonds Street. Ample parking (incl. disabled), toilets, cafes and a swimming beach next to the pier.", tips: "VFA: long pier with a large shelter shed and a lower landing; best known for squid. Swan Bay (north-west) is a no-fishing marine park." },
  "st-leonards-pier": { area: "bellarine", src: "local", access: "Pier and ramp share the reserve.", tips: "Local knowledge only. Snapper from St Leonards jetty were reported in recent spring runs (FishingMad)." },
  "portarlington-pier": { area: "bellarine", src: "local", access: "Harbour car park, cafe and ramp.", tips: "Local knowledge only. FishingMad has reported snapper (spring) and whiting (autumn) from the Portarlington pier and break wall." },
  "cunningham-pier": { area: "bellarine", src: "vfa", hot: ["silver-trevally"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "garfish", "king-george-whiting", "leatherjacket"],
    access: "Western Beach, Geelong. Parking on and next to the pier, toilets and cafes.", tips: "VFA: large pier with deep water and room for many anglers; fishes all year, with different fish at different times." },
  "altona-pier": { area: "northwest", src: "local", access: "The Esplanade, Altona. Check local notices for works.", tips: "Local knowledge only. FishingMad reported a winter salmon school here." },
  "gem-pier": { area: "northwest", src: "local", access: "Nelson Place, Williamstown. HMAS Castlemaine is alongside – fish around it.", tips: "Local knowledge only. Ferguson Street Pier (VFA-listed) is nearby." },
  "kerferd-pier": { area: "east", src: "local", hot: ["sand-flathead"], access: "Kerferd Road, Albert Park. Street parking.", tips: "VFA names Kerferd Road Pier as a flathead hot spot." },
  "hampton-pier": { area: "east", src: "local", access: "Beach Road, Hampton. Tight parking on weekends.", tips: "Local knowledge only – no VFA listing." },
  "seaford-pier": { area: "east", src: "local", access: "Seaford foreshore car parks.", tips: "Local knowledge only – no VFA listing." },
  "patterson-shore": { area: "east", src: "vfa", hot: ["black-bream"], other: ["yellow-eye mullet"], species: ["black-bream", "australian-salmon", "mulloway", "sand-flathead", "silver-trevally"],
    access: "Launching Way (south side) gives jetties, landings and open bank. Parking, toilets and seats.", tips: "VFA: salmon and flathead from the rock wall at the mouth; bream, mullet, trevally and mulloway further up the river." },
  "werribee-jetties": { area: "northwest", src: "vfa", hot: ["sand-flathead"], other: ["yellow-eye mullet"], species: ["black-bream", "australian-salmon", "sand-flathead", "silver-trevally"],
    access: "Werribee South foreshore, with parking, toilets and a boat ramp.", tips: "VFA: jetties are good for bream; the beach gives good flathead in warmer months and large mullet in winter. Watch for boats. Point Cooke Marine Sanctuary is about 10 km north-east – no fishing inside." },
  "warmies-wall": { area: "rivers", src: "local", eat: true, access: "Newport. Parking is tight. Walk the channel – the boat ramp is for boats.", tips: "FishingMad: when the power-station pumps run, the warm outflow draws salmon (winter) and snapper (pinkies Jan–Mar) – look for steam as a guide. Never touch a blue-ringed octopus (venomous) – FishingMad has caught them here. Lower Yarra fish: see food-safety advice." },
  "yarra-docklands": { area: "rivers", src: "local", eat: true, tips: "Pinkies were reported here in autumn and winter (FishingMad). Lower Yarra fish: see food-safety advice." },
  "yarra-southbank": { area: "rivers", src: "local", eat: true, name: "Yarra – Southbank / Crown", lat: -37.8224, lon: 144.9585,
    species: ["estuary-perch", "black-bream", "silver-trevally", "mulloway", "snapper"],
    depth: "Not verified – a tidal river with deep water close to the wall",
    access: "The Southbank promenade along the Yarra in front of Crown, between Queensbridge Square and the Webb Bridge end. Trams and a short walk from Flinders Street and Southern Cross stations. The pin is approximate – the promenade is long and busy; walk it and find a gap.",
    tips: "Choc caught a 41 cm estuary perch here on a lure (see photo). Small lures and plastics along the wall and around any structure (the usual way to fish perch – see the estuary perch guide). Keep the footprint small: this is a busy promenade, not a pier – watch for walkers, cyclists and ferries, and keep your line out of the way. Check the Reports tab for recent catches.",
    photo: { src: "spots/yarra-southbank.webp", cap: "Southbank promenade at night, with Choc's estuary perch on the measuring mat." },
    rules: ["Estuary perch: min 27 cm, bag 5 (with Australian bass; no more than 2 bass). Keep whole until you are away from the water.", "Murray cod: only 55–75 cm, bag 1 in rivers. Closed season 1 Sep–30 Nov applies in the Yarra River.", "Redfin: no size or bag limit. Carp must not be put back.", "Always check the VFA's current rules before you keep a fish."] },
  "yarra-herring": { area: "rivers", src: "local", eat: true, tips: "Quieter bank fishing. Estuary perch are reported in the lower Yarra (FishingMad) – we found no VFA stocking record for the Yarra, so we can't say how many are wild or stocked. Murray cod: the closed season (1 Sep–30 Nov) applies in the Yarra River. Lower Yarra fish: see food-safety advice." },
  "maribyrnong-footscray": { area: "rivers", src: "local", eat: true, report: { items: [
    { t: "Report 1 – Choc caught a snapper in the lower Maribyrnong in late October (year not given) on garden worms. Size and exact spot not given." },
    { t: "Report 2 – a different, separate catch: Choc's estimate is about 78 cm, on pilchard (date and exact spot not given). That is at the large end for a snapper, and the size is his estimate – not measured or verified here.", photo: { src: "spots/maribyrnong-snapper.webp", cap: "Choc's snapper from the Maribyrnong (report 2; his estimate about 78 cm). Photo lightly retouched to hide a product label." } },
    { t: "Report 3 – another separate catch: a black bream, Choc's estimate about 45 cm, on garden worms (date and exact spot not given). That would be a very big bream: the VFA says black bream can reach about 60 cm but are commonly much smaller, and take around 9 years to reach the 28 cm legal size. The length is his estimate, not measured or verified here.", photo: { src: "spots/maribyrnong-bream.webp", cap: "Choc's black bream from the Maribyrnong (his estimate about 45 cm)." } },
    { t: "Report 4 – a separate catch: two snapper (pan-size, sizes not given), date not given. Choc used rabbit as bait – his own choice and unconventional, not advice from this app. Measure every snapper and check the rules below before keeping one.", photo: { src: "spots/maribyrnong-two-snapper.webp", cap: "Choc's two snapper from the Maribyrnong (report 4; sizes not given). Photo cropped to the fish." } } ],
    note: "All four are one angler's personal accounts, not VFA or official reports. Snapper do turn up in the lower river in spring (FishingMad lists them for the river), but treat these as one-offs." },  tips: "FishingMad reports bream after light rain, and estuary perch around the timber and jetties (the VFA stocked the river in 2018, 2019 and 2021). Try small surface lures on warm, calm evenings. Fish upstream of Solomons Ford (Avondale Heights) must not be eaten (PFAS)." },
  "maribyrnong-anglers": { area: "rivers", src: "local", eat: true, report: { items: [
    { t: "Report 1 – Choc caught a snapper in the lower Maribyrnong in late October (year not given) on garden worms. Size and exact spot not given." },
    { t: "Report 2 – a different, separate catch: Choc's estimate is about 78 cm, on pilchard (date and exact spot not given). That is at the large end for a snapper, and the size is his estimate – not measured or verified here.", photo: { src: "spots/maribyrnong-snapper.webp", cap: "Choc's snapper from the Maribyrnong (report 2; his estimate about 78 cm). Photo lightly retouched to hide a product label." } },
    { t: "Report 3 – another separate catch: a black bream, Choc's estimate about 45 cm, on garden worms (date and exact spot not given). That would be a very big bream: the VFA says black bream can reach about 60 cm but are commonly much smaller, and take around 9 years to reach the 28 cm legal size. The length is his estimate, not measured or verified here.", photo: { src: "spots/maribyrnong-bream.webp", cap: "Choc's black bream from the Maribyrnong (his estimate about 45 cm)." } },
    { t: "Report 4 – a separate catch: two snapper (pan-size, sizes not given), date not given. Choc used rabbit as bait – his own choice and unconventional, not advice from this app. Measure every snapper and check the rules below before keeping one.", photo: { src: "spots/maribyrnong-two-snapper.webp", cap: "Choc's two snapper from the Maribyrnong (report 4; sizes not given). Photo cropped to the fish." } } ],
    note: "All four are one angler's personal accounts, not VFA or official reports. Snapper do turn up in the lower river in spring (FishingMad lists them for the river), but treat these as one-offs." },  tips: "FishingMad reports bream and estuary perch (the VFA stocked the river in 2018, 2019 and 2021) – the jetties opposite the Anglers Tavern and Canning Reserve are named spots. Light lures along the timber. Fish upstream of Solomons Ford (Avondale Heights) must not be eaten (PFAS)." },
};

const WP: Omit<Info, "area" | "src">[] = [];
void WP;
const W = (id: string, name: string, lat: number, lon: number, shore: Spot["shore"], i: Omit<Info, "area" | "src">, access: string, tips: string, species: string[]): [Spot, Info] => [
  { id, name, kind: "pier", lat, lon, shore, species, tideNote: "", windNote: "", access, tips, exposedTo: [], shelteredFrom: [], tideLagHours: 0 },
  { area: "westernport", src: "vfa", noWind: true, ...i },
];
export const EXTRA: [Spot, Info][] = [
  [{ id: "ferguson-street-pier", name: "Ferguson Street Pier (Williamstown)", kind: "pier", lat: -37.8611, lon: 144.9066, shore: "north", depth: undefined,
    species: ["snapper", "sand-flathead", "silver-trevally", "australian-salmon", "garfish", "black-bream"], tideNote: "", windNote: "Hobsons Bay, faces north-east. Northerlies and easterlies put chop on the end; south-westerlies are the sheltered day.",
    access: "End of Ferguson Street. Parking nearby; toilets on The Strand and in Nelson Place; cafes close by.", tips: "VFA: fish close to the pylons for bream and trevally; cast as far as you can from the end for snapper and flathead. VFA hot spot for snapper.",
    exposedTo: ["N", "NE", "E"], shelteredFrom: ["S", "SW", "W"], tideLagHours: 0 },
    { area: "northwest", src: "vfa", hot: ["snapper"], other: ["yellow-eye mullet", "rock ling"] }],
  W("flinders-pier", "Flinders Jetty", -38.4757, 145.0272, "south", { other: ["wrasse", "barracouta", "short-finned pike"], hot: ["calamari"] },
    "End of Bass Street, in Bass Park. Toilets and parking at the pier; shops nearby.", "VFA: famous for big squid in spring. Best on the run-in (rising) tide. Cast onto sand patches for whiting; fish around the pylons for wrasse and leatherjackets.", ["calamari", "king-george-whiting", "australian-salmon", "silver-trevally", "leatherjacket"]),
  W("merricks-beach", "Merricks Beach", -38.3989, 145.1064, "south", { other: ["yellow-eye mullet"], hot: ["gummy-shark"] },
    "End of Merricks Beach Road. Car park at the end; toilets near the yacht club.", "VFA: fishes best at high tide, especially an early-morning high; an evening high can also be good. Fish at night for gummy shark.", ["king-george-whiting", "australian-salmon", "sand-flathead", "gummy-shark"]),
  W("stony-point-pier", "Stony Point Pier", -38.3725, 145.2247, "south", { other: ["yellow-eye mullet"] },
    "Western side of Western Port. Toilets and a car park nearby; general store across the road.", "VFA: fish can be right under the pier, so you often do not need to cast far. A few hours either side of high tide is best. Bait-fish style soft plastics and metal lures also work.", ["calamari", "king-george-whiting", "australian-salmon", "silver-trevally", "sand-flathead", "snapper"]),
  W("hastings-jetty", "Hastings Jetty", -38.3085, 145.1982, "south", {},
    "Skinner Street, Hastings. Car park at the pier base; toilets close by.", "VFA: fishing around high tide is most productive. Cast onto sand patches for flathead and whiting; silver trevally around the pylons.", ["king-george-whiting", "australian-salmon", "silver-trevally", "sand-flathead"]),
  W("tooradin-jetty", "Tooradin Inlet", -38.2141, 145.3788, "north", { other: ["yellow-eye mullet"] },
    "Tooradin foreshore. Parking, toilets, BBQs, shelters and a playground.", "VFA: light tackle and berley improve results; a running-sinker rig suits most fish. Use a float and small long-shank hooks for mullet. Best around high tide.", ["black-bream", "australian-salmon", "sand-flathead", "silver-trevally", "king-george-whiting", "estuary-perch"]),
  W("san-remo-pier", "San Remo Jetty", -38.5202, 145.3645, "south", { other: ["barracouta", "wrasse"] },
    "Marine Parade, before the bridge to Phillip Island. Toilets, BBQs, shops and a tackle store.", "VFA: very strong tidal currents – use heavy sinkers except around slack water. Fish a few hours either side of high tide.", ["calamari", "king-george-whiting", "australian-salmon", "silver-trevally", "snapper", "leatherjacket"]),
  W("cowes-jetty", "Cowes Jetty (Phillip Island)", -38.4468, 145.2398, "south", { other: ["barracouta"] },
    "End of Bass Street, Cowes. Toilets nearby; very busy in holidays.", "VFA: exposed in strong northerlies; southerlies are more comfortable. A paternoster rig suits most fish; a few hours either side of high tide is best.", ["calamari", "king-george-whiting", "australian-salmon", "silver-trevally", "gummy-shark", "elephant-fish", "snapper", "sand-flathead", "garfish"]),
  [{ id: "albert-park-lake", name: "Albert Park Lake", kind: "shore", lat: -37.8459, lon: 144.9695, shore: "mid", depth: "Shallow: about 1–2 m in most places, with some deeper holes (FishingMad)",
    species: ["golden-perch", "estuary-perch", "silver-perch", "redfin", "murray-cod"], tideNote: "", windNote: "", exposedTo: [], shelteredFrom: [], tideLagHours: 0,
    access: "Walk the lake's shore track (about 5 km round). Paid parking in several areas – watch the time limits. The pin is the middle of the lake. FishingMad names the carousel area and the yacht club pontoons (Aquatic Drive) as popular spots.",
    tips: "Weedy and shallow, so use shallow lures and light gear. Surface lures on warm calm evenings for estuary perch; slow-rolled plastics for golden perch; scrub worms for silver perch. Redfin are listed by the VFA but rarely caught here (FishingMad). Trout are stocked in winter and school holidays. Carp must not be put back. Take line and hooks home – there are swans, and Parks Victoria asks you not to touch sick or dead birds (bird flu alert)." },
    { area: "freshwater", src: "local", fresh: true, noWind: true, hot: [], other: ["rainbow trout", "European carp", "eels"] }],
  [{ id: "yarra-bend", name: "Yarra Bend Park (Yarra River)", kind: "shore", lat: -37.7938, lon: 145.0107, shore: "mid", depth: "Shallow, sluggish river",
    species: ["redfin", "estuary-perch"], tideNote: "", windNote: "", exposedTo: [], shelteredFrom: [], tideLagHours: 0,
    access: "Yarra Bend Park, Fairfield – car parks and walking tracks along the river. Fishing is not allowed in the grey-headed flying-fox colony area (FishingMad).",
    tips: "This stretch is above Dights Falls, so it is freshwater with no tide. FishingMad reports redfin, carp, eels and estuary perch. Small plastics, blades and spinners for redfin; surface lures at dusk for perch; worms or corn for carp. Do not leave line in the trees – flying-foxes get caught. Murray cod: the closed season (1 Sep–30 Nov) applies in the Yarra River. Fish from the river have health advice." },
    { area: "freshwater", src: "local", fresh: true, noWind: true, eat: true, other: ["European carp", "eels"] }],
];
