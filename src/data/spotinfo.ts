import type { Spot } from "./spots";

export type Area = "northwest" | "rivers" | "freshwater" | "east" | "peninsula" | "bellarine" | "westernport";
export const AREAS: Record<Area, { name: string; blurb: string }> = {
  northwest: { name: "Hobsons Bay & Werribee", blurb: "Williamstown, Altona and Werribee on the bay's north-west corner." },
  rivers: { name: "Yarra & Maribyrnong", blurb: "City rivers, including the Warmies at Newport." },
  freshwater: { name: "Freshwater (Albert Park Lake & upper Yarra)", blurb: "No tides here. Perch, redfin and trout in the city's lake and the freshwater Yarra." },
  east: { name: "Bayside & Frankston", blurb: "Port Melbourne and St Kilda down to Seaford and Patterson River." },
  peninsula: { name: "Mornington Peninsula", blurb: "Mornington, Dromana, Rosebud, Rye, Sorrento and Portsea." },
  bellarine: { name: "Geelong & Bellarine", blurb: "Geelong, Portarlington, St Leonards and Queenscliff." },
  westernport: { name: "Western Port", blurb: "Flinders to Tooradin and Phillip Island." },
};

export type Status = { closed: true; note: string; url: string; asOf: string };
export type Info = Partial<Omit<Spot, "id">> & {
  area: Area;
  /** "vfa" = species/tips taken from the VFA Go Fishing pages; "local" = general local knowledge, not an official list; "choc" = a spot from Choc's own fishing (first-hand local knowledge). */
  src: "vfa" | "local" | "choc";
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
  /** Angler-report adjustments to the ranking, per fish: + for local favourites, - where local reports are weaker than an official listing. Reasons live in data/audit.ts. */
  local?: Record<string, number>;
  /** A short "read this first" banner for spots with access rules (e.g. a working port). */
  notice?: string;
  /** Hazards and safety points shown on the spot page. */
  hazards?: string[];
  /** Keys into SRC (data/facilities.ts): where the fish list and tips come from. */
  sources?: string[];
  /** A personal angler report, clearly labelled as anecdotal. */
  report?: { items: { t: string; photo?: { src: string; cap: string } }[]; note: string };
};

const PV = "https://www.parks.vic.gov.au/";
export const INFO: Record<string, Info> = {
  "st-kilda-pier": { area: "east", src: "local", hot: ["sand-flathead", "snapper"], access: "Car parking near Jacka Boulevard; the pier is a long walk to the end.", tips: "VFA names St Kilda as a hot spot for flathead and snapper." },
  "middle-brighton": { area: "east", src: "local", hot: ["snapper"], access: "The Esplanade, Brighton. Baths car park can fill early on weekends.", tips: "VFA names Brighton Pier as a snapper hot spot." },
  "mordialloc-pier": { area: "east", src: "vfa", hot: ["australian-salmon"], other: ["yellow-eye mullet"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "garfish", "king-george-whiting", "leatherjacket", "black-bream"],
    access: "Beach Road. Parking, toilets, playground, kiosk and a shelter on the pier.", tips: "VFA: autumn and winter are good on the pier. Bream and mullet in Mordialloc Creek beside it all year. Hot spot for salmon and mullet. Tip from Lee Rayner (Australian Lure Fishing Podcast, May 2022): for squid, fish the reef side of the pier, not over the clean sand." },
  "frankston-pier": { area: "east", src: "local", access: "Kananook Creek car parks; a short walk from the station.", tips: "VFA's Port Phillip guide says the artificial reef here holds flathead, snapper, leatherjackets, salmon, trevally and calamari, and garfish come in under berley. Fish the reef side of the pier. Check the Reports tab for recent Frankston catches." },
  "mornington-pier": { area: "peninsula", src: "vfa", hot: ["leatherjacket"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "king-george-whiting", "leatherjacket", "garfish", "yellowtail-kingfish"],
    access: "Schnapper Point Drive. Plenty of parking, toilets and a kiosk.", tips: "VFA: good all year, best in summer and autumn. Cast into open water on the breakwater side, fish the quieter lee side, or drop straight down beside the pylons. Snapper season is busy – arrive early." },
  "rye-pier": { area: "peninsula", src: "local", access: "Point Nepean Road. Family friendly, with lights.", tips: "A proper squid pier: FishingMad says calamari are the most targeted fish at Rye, and the VFA calls the southern Peninsula a calamari ground. Fish the weed edges at dawn, dusk or under the lights. Whiting and garfish in the warmer months." },
  "sorrento-pier": { area: "peninsula", src: "vfa", hot: ["king-george-whiting"], other: ["barracouta"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "king-george-whiting", "leatherjacket"],
    access: "The Esplanade. Parking and toilets at the foot of the pier; cafes and shops nearby.", tips: "VFA: wide, roomy pier with deep water – but strong currents. Very busy in holidays and summer weekends; quieter times are easier." },
  "portsea-pier": { area: "peninsula", src: "local", status: { closed: true, asOf: "17 Oct 2026", url: PV + "news/2026/05/25/03/49/portsea-pier-maintenance-works-june-2026", note: "Closed since July 2026 for major repairs after storm damage. Parks Victoria expects it to finish before summer 2026, weather permitting – no firm date. Sorrento and Rye piers are suggested alternatives." }, tips: "Closed – see status." },
  "dromana-pier": { area: "peninsula", src: "local", status: { closed: true, asOf: "17 Oct 2026", url: "https://www.pisra.com.au/jetty-set-for-likely-autumn-opening/", note: "Closed for a full rebuild. A 1 Sep 2026 local update (via Better Boating Victoria) says reopening is likely March–April 2027 – not confirmed." }, tips: "Closed – see status." },
  "rosebud-pier": { area: "peninsula", src: "local", access: "Rosebud foreshore, with toilets and shops in town.", tips: "FishingMad lists squid, garfish, whiting, flathead, salmon, trevally and the odd snapper here. Squid over the weed beds off the end; whiting on the sand patches in summer." },
  "safety-beach": { area: "peninsula", src: "local", access: "Marine Drive. Park and walk onto the sand.", tips: "Local knowledge only. A shallow beach – best when the tide is up." },
  "queenscliff-pier": { area: "bellarine", src: "vfa", hot: ["calamari"], other: ["yellow-eye mullet"], species: ["calamari", "australian-salmon", "sand-flathead", "silver-trevally", "garfish", "king-george-whiting"],
    access: "Symonds Street. Ample parking (incl. disabled), toilets, cafes and a swimming beach next to the pier.", tips: "VFA: long pier with a large shelter shed and a lower landing; best known for squid. Swan Bay (north-west) is a no-fishing marine park." },
  "st-leonards-pier": { area: "bellarine", src: "local", access: "Pier and ramp share the reserve.", tips: "Famous for squid – VFA and FishingMad both name it, with calamari over the weed beds most of the year. VFA also lists whiting, salmon, pinkies, flathead, trevally and leatherjackets. Snapper were reported in recent spring runs (FishingMad)." },
  "portarlington-pier": { area: "bellarine", src: "local", access: "Harbour car park, cafe and ramp.", tips: "VFA lists garfish, salmon, flathead, pinkies and big snapper from the pier. FishingMad has reported snapper (spring), whiting (autumn) and squid over the nearby weed beds." },
  "cunningham-pier": { area: "bellarine", src: "vfa", hot: ["silver-trevally"], species: ["calamari", "australian-salmon", "snapper", "sand-flathead", "silver-trevally", "garfish", "king-george-whiting", "leatherjacket"],
    access: "Western Beach, Geelong. Parking on and next to the pier, toilets and cafes.", tips: "VFA: large pier with deep water and room for many anglers; fishes all year, with different fish at different times." },
  "altona-pier": { area: "northwest", src: "local", access: "The Esplanade, Altona. Check local notices for works.", tips: "VFA's Port Phillip guide: pinkies, flathead, leatherjackets and salmon on the reefs, bream under the pier, and whiting off the sides over the weed. The same guide mentions calamari there, but real catch reports from the pier are very rare (old or new pier), so the app treats squid here as occasional – boats catch them out from the pier and towards Point Cook. Garfish come up under a light berley. FishingMad reported a big winter salmon school here." },
  "gem-pier": { area: "northwest", src: "local", access: "Nelson Place, Williamstown. HMAS Castlemaine is alongside – fish around it.", tips: "VFA: bream are the best target here, with pinkies and flathead, and occasional salmon, trevally and garfish. Ferguson Street Pier (VFA hot spot) is nearby." },
  "kerferd-pier": { area: "east", src: "local", hot: ["sand-flathead"], local: { snapper: 4 }, access: "Kerferd Road, Albert Park. Street parking.", tips: "VFA names Kerferd Road Pier as a flathead hot spot." },
  "hampton-pier": { area: "east", src: "local", access: "Sandringham Harbour, off Jetty Road, beside Sandringham Yacht Club. Paid parking at the harbour car park; toilets near the harbour beach.", tips: "Rebuilt and reopened on 19 Jan 2026 (Bayside City Council) inside Sandringham Harbour: a short timber pier with a 24 m floating pontoon for boat users. Fish from the pier or the breakwater wall, never where boats tie up. We could not find recent catch reports for the new pier itself – the breakwater next door (Sandringham Breakwater) is the better-known spot for snapper, whiting and garfish.",
    sources: ["pvHampton", "baysideHampton", "fmSandy"], hazards: ["Boats come and go all day – keep lines clear of the pontoon and the harbour entrance.", "Deep water and no jumping or diving (Parks Victoria)."] },
  "seaford-pier": { area: "east", src: "local", access: "Seaford foreshore car parks.", tips: "VFA: a long pier over sand. Casting metal lures for salmon is the most reliable bet; garfish under berley; snapper, whiting and calamari only now and then." },
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
    { t: "Report 4 – a separate catch: two pinkies (juvenile snapper) on rabbit bait, date and sizes not given. The bait was Choc's own choice and is unconventional – not advice from this app.", photo: { src: "spots/maribyrnong-two-snapper.webp", cap: "Choc's two pinkies (juvenile snapper) from the Maribyrnong (report 4; sizes not given). Photo cropped to the fish." } } ],
    note: "All four are one angler's personal accounts, not VFA or official reports. Snapper do turn up in the lower river in spring (FishingMad lists them for the river), but treat these as one-offs." },  tips: "FishingMad reports bream after light rain, and estuary perch around the timber and jetties (the VFA stocked the river in 2018, 2019 and 2021). Try small surface lures on warm, calm evenings. Fish upstream of Solomons Ford (Avondale Heights) must not be eaten (PFAS)." },
  "maribyrnong-anglers": { area: "rivers", src: "local", eat: true, report: { items: [
    { t: "Report 1 – Choc caught a snapper in the lower Maribyrnong in late October (year not given) on garden worms. Size and exact spot not given." },
    { t: "Report 2 – a different, separate catch: Choc's estimate is about 78 cm, on pilchard (date and exact spot not given). That is at the large end for a snapper, and the size is his estimate – not measured or verified here.", photo: { src: "spots/maribyrnong-snapper.webp", cap: "Choc's snapper from the Maribyrnong (report 2; his estimate about 78 cm). Photo lightly retouched to hide a product label." } },
    { t: "Report 3 – another separate catch: a black bream, Choc's estimate about 45 cm, on garden worms (date and exact spot not given). That would be a very big bream: the VFA says black bream can reach about 60 cm but are commonly much smaller, and take around 9 years to reach the 28 cm legal size. The length is his estimate, not measured or verified here.", photo: { src: "spots/maribyrnong-bream.webp", cap: "Choc's black bream from the Maribyrnong (his estimate about 45 cm)." } },
    { t: "Report 4 – a separate catch: two pinkies (juvenile snapper) on rabbit bait, date and sizes not given. The bait was Choc's own choice and is unconventional – not advice from this app.", photo: { src: "spots/maribyrnong-two-snapper.webp", cap: "Choc's two pinkies (juvenile snapper) from the Maribyrnong (report 4; sizes not given). Photo cropped to the fish." } } ],
    note: "All four are one angler's personal accounts, not VFA or official reports. Snapper do turn up in the lower river in spring (FishingMad lists them for the river), but treat these as one-offs." },  tips: "FishingMad reports bream and estuary perch (the VFA stocked the river in 2018, 2019 and 2021) – the jetties opposite the Anglers Tavern and Canning Reserve are named spots. Light lures along the timber. Fish upstream of Solomons Ford (Avondale Heights) must not be eaten (PFAS)." },
};

const WP: Omit<Info, "area" | "src">[] = [];
void WP;
const W = (id: string, name: string, lat: number, lon: number, shore: Spot["shore"], i: Omit<Info, "area" | "src">, access: string, tips: string, species: string[]): [Spot, Info] => [
  { id, name, kind: "pier", lat, lon, shore, species, tideNote: "", windNote: "", access, tips, exposedTo: [], shelteredFrom: [], tideLagHours: 0 },
  { area: "westernport", src: "vfa", noWind: true, ...i },
];
export const EXTRA: [Spot, Info][] = [
  [{ id: "ferguson-street-pier", name: "Ferguson Street Pier (Williamstown)", kind: "pier", lat: -37.8590, lon: 144.9041, shore: "north", depth: undefined,
    species: ["snapper", "sand-flathead", "silver-trevally", "australian-salmon", "garfish", "black-bream"], tideNote: "", windNote: "Hobsons Bay, faces north-east. Northerlies and easterlies put chop on the end; south-westerlies are the sheltered day.",
    access: "End of Ferguson Street. Parking nearby; toilets on The Strand and in Nelson Place; cafes close by.", tips: "VFA: fish close to the pylons for bream and trevally; cast as far as you can from the end for snapper and flathead. VFA hot spot for snapper.",
    exposedTo: ["N", "NE", "E"], shelteredFrom: ["S", "SW", "W"], tideLagHours: 0 },
    { area: "northwest", src: "vfa", hot: ["snapper"], local: { snapper: -4 }, other: ["yellow-eye mullet", "rock ling"] }],
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
  W("corinella-pier", "Corinella Pier", -38.4072, 145.4223, "south", { hot: ["elephant-fish"] },
    "Peters Street, Corinella, next to the caravan park, on the east side of Western Port. General store nearby (VFA).",
    "VFA: a deep channel runs right beside the pier – you don't need to cast more than about 5 m. Use bigger hooks and baits for gummy shark, elephant fish and mulloway; a few hours around high tide is best. Brendan Wing (YouFishTV) fishes for big mulloway by boat in the channels just off Corinella, mainly around sunset and sunrise near a tide change, with fresh squid. A mulloway from the pier is a rare bonus, not a sure thing.",
    ["king-george-whiting", "sand-flathead", "gummy-shark", "elephant-fish", "mulloway"]),
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
  [{ id: "st-helens", name: "St Helens boat ramp & rock walls (Geelong)", kind: "shore", lat: -38.12, lon: 144.3595, shore: "west", species: ["snapper", "sand-flathead", "king-george-whiting", "calamari"],
    tideNote: "", windNote: "", exposedTo: [], shelteredFrom: [], tideLagHours: 0, depth: "Not verified",
    access: "Swinburne Street, North Geelong, on Corio Bay. Car park beside the three-lane boat ramp, with toilets, a fish-cleaning table, picnic facilities and a free boat ramp run with the Coast Guard. The City of Greater Geelong lists the St Helens Harbour rock walls with pole holders and solar lighting, and a St Helens jetty (Bay or Swinburne Street). Coordinates are approximate (from a map listing).",
    tips: "Local reviews say you can fish from the shore beside the ramp and breakwater, and name snapper (including pinkies), squid, flathead and whiting. We found no VFA listing for this spot, so treat the fish list as local knowledge. Keep clear of boats and the ramp lanes, and take line and hooks home. Check the Reports tab for recent Geelong catches." },
    { area: "bellarine", src: "local", noWind: true,
    report: { items: [
      { t: "Choc caught a snapper over 40 cm (his estimate) at St Helens on a small blade lure. Date not given. The length is his estimate, not measured or verified here.", photo: { src: "spots/sthelens-lure.webp", cap: "Choc's snapper from St Helens, with the small blade lure it took (his estimate: over 40 cm). The photo has a graphic effect added." } },
      { t: "The same fish, held beside the water at the St Helens rock wall.", photo: { src: "spots/sthelens-choc.webp", cap: "Choc with his St Helens snapper (his estimate: over 40 cm)." } } ],
      note: "This is one angler's personal account, not a VFA or official report." } }],

  // ---- Added 23 Oct 2026: local land-based favourites the VFA list leaves out. Coordinates checked on OpenStreetMap. Proven/occasional fish and the evidence behind each are in data/audit.ts. ----
  [{ id: "webb-dock-rocks", name: "Webb Dock rock wall (Port Melbourne)", kind: "shore", lat: -37.8452, lon: 144.9155, shore: "mid", depth: "Not verified",
    species: ["snapper", "sand-flathead", "silver-trevally", "australian-salmon", "black-bream", "gummy-shark", "mulloway"], tideNote: "",
    windNote: "The wall faces east across the bay. Westerlies and north-westerlies blow off the land and keep it workable; an easterly or south-easterly blows straight on to the rocks and is rough and dangerous.",
    access: "Park at the Sandridge Yacht Club car park or along The Boulevard (anglers report both are free all day), then walk the public Webb Dock Trail south along the rock wall – about a 10-minute walk to the first spots (FishingMad). The trail and its lookout are public; the dock behind it is a secured working port.",
    tips: "Snaggy rocks – cast past them, keep the rod high and carry plenty of spares. FishingMad's rig: running sinker, swivel and 50 cm of strong leader to a pilchard tail or small squid head; a paternoster with raw chicken for pinkies; heavy-head soft plastics for flathead. Pinkies come on the incoming high tide and flathead on the outgoing low (FishingMad). Dawn and after-midnight tide changes have produced bigger snapper on blue bait or pilchard (forum). Summer is the big snapper time and anglers fish here day and night (FishingMad). Reedy's Rigs says early-season snapper come in very shallow after dark (about 2.5–4 m) and that land-based anglers catch them at night at places like Webb Dock. Sea stars steal baits – check them often. Fish near other anglers, not on top of them.",
    exposedTo: ["NE", "E", "SE", "S"], shelteredFrom: ["W", "NW", "SW"], tideLagHours: 0 },
    { area: "east", src: "local", local: { snapper: 6 }, sources: ["fmWebb", "fmBest", "reedySept", "reedyEarly", "fvWebb12", "fvWebb23", "pomVisit", "pomNews", "pomMap", "pomSust", "vfaWest"],
      notice: "Working port. Only the public Webb Dock Trail and its rock wall are open to you – the Port of Melbourne says the trail has normal 24-hour public access. The dock behind it is secured: stay on the trail and never cross a gate, fence or barrier, and obey any signs or port staff. The port had planned drain works on the trail's southern section for 12–17 Oct 2026 (its page was last updated 24 Sep, so we can't tell if they are finished) – check their updates page if part of the trail looks fenced off.",
      hazards: ["Slippery, uneven rock with deep water at the edge. Wear grippy shoes; a lifejacket is sensible, especially at night.", "Big ships and ferries berth right behind you – watch for wash and keep gear and lines off the trail.", "Landing fish off the rocks is hard – a long-handled net helps (FishingMad).", "We could not confirm lighting along the wall. Take a headlamp and a mate at night."],
      rules: ["Public access is the Webb Dock Trail only. The Port of Melbourne notes that security and safety rules keep the rest of the port closed to the public, and a beach inside the dock is also restricted.", "The Port of Melbourne put fishing-line recycling bins on the Webb Dock Trail (Seal the Loop). Please use them."] }],

  [{ id: "hampton-groynes", name: "Hampton rock groynes", kind: "shore", lat: -37.9397, lon: 144.9975, shore: "east", depth: "Not verified",
    species: ["snapper", "calamari", "sand-flathead", "australian-salmon", "king-george-whiting"], tideNote: "",
    windNote: "The groynes face west-south-west. Anglers say light south-westerly or north-westerly winds are best for pinkies; a strong straight westerly sends waves over the rocks – stay off. Calm northerly or easterly days leave clearer water for squid and whiting on the sand between groynes.",
    access: "Beach Road, Hampton, where the Bay Trail meets the beach. There are two rock groynes about 200 m apart (OpenStreetMap); the pin is on the northern one. Anglers talk about 'the end of the Orlando Street groyne' but we couldn't confirm which one that is. Street parking is limited and busy in summer.",
    tips: "Very snaggy – locals lose a lot of sinkers and rigs, so bring spares and use a paternoster. Pinkies and the odd snapper come at dawn and dusk, in rough weather or after a few windy days. Pilchard, squid or silver whiting; toadies strip baits fast. If the rocks fish poorly, walk a few minutes south to the sandy Sandringham breakwater, which anglers say gives more fish in summer.",
    exposedTo: ["SW", "W", "NW"], shelteredFrom: ["NE", "E", "SE"], tideLagHours: 0 },
    { area: "east", src: "local", sources: ["fvHamptonGroynes", "fvHamptonWindy", "fvHamptonSquid", "fvSnapperSeason", "bcGroynes", "reedySept"],
      hazards: ["Weedy rock groynes are slippery and waves wash over them in a westerly – if water is breaking across the rocks, fish from the beach instead.", "No railings or deck. Small children need close supervision; a lifejacket is sensible at the end.", "Swimmers use the beach between the groynes in summer – cast away from them."] }],

  [{ id: "williamstown-rocks", name: "Williamstown seawall & rocks (Point Gellibrand)", kind: "shore", lat: -37.8710, lon: 144.9059, shore: "north", depth: "Not verified",
    species: ["snapper", "australian-salmon", "calamari", "sand-flathead", "silver-trevally"], tideNote: "",
    windNote: "The point looks south-east to south over Hobsons Bay. Northerlies and westerlies leave it calm; southerly and south-westerly chop wash the lower rocks.",
    access: "Battery Road, Williamstown. Car parks by the Timeball Tower (east end) and the Quarry Picnic Area; the seawall car park in front of the Timeball Tower is another starting point. Stay east of the Jawbone Marine Sanctuary, west of Williamstown Beach – it is no-take, including bait collection.",
    tips: "Anglers say cast across from the end of the seawall (in front of Williamstown Beach), not straight out to the south, where it is all snaggy reef. Pinkies and salmon are caught all year, with bigger snapper in the warmer months. Dawn and dusk tide changes are best. Paternoster with a teardrop sinker and lots of spares; metal lures for salmon schools. Squid and flathead are only occasional from the rocks.",
    exposedTo: ["E", "SE", "S", "SW"], shelteredFrom: ["N", "NW", "W"], tideLagHours: 0 },
    { area: "northwest", src: "local", sources: ["fvWillPiers", "fvWillGloucester", "bcGellibrand", "vfaWest", "reedyEarly", "reedySept"],
      hazards: ["Wet bluestone and rocks are slippery and drop into deep water – grippy shoes, and keep children off the rocks.", "A southerly can wash spray over the lower rocks.", "Watch for cyclists and walkers on the Bay Trail behind you."] }],

  [{ id: "sandringham-breakwater", name: "Sandringham breakwater (rock wall)", kind: "shore", lat: -37.9420, lon: 144.9930, shore: "east", depth: "Not verified (about 3–4 m of water 10 m off the end, per one angler)",
    species: ["snapper", "king-george-whiting", "garfish", "sand-flathead", "australian-salmon", "silver-trevally", "calamari"], tideNote: "",
    windNote: "The outer wall faces west into the bay and takes westerly and south-westerly chop, which can wash over the rocks. The harbour side is calm in almost anything. Whiting and squid like clear water after a run of northerly or easterly days. A 24-knot southerly was too rough to fish.",
    access: "Jetty Road, Sandringham, beside the yacht club and footy oval. Public car park (paid – by app or card). Fish only the breakwater rock wall and the permitted areas: the marina has signed the marina area as no fishing, and locals ask anglers not to fish across the harbour entrance, because of boats and lines in propellers.",
    tips: "Best on the rising tide – low tide is shallow and snaggy. FishingMad says snapper are best October to March, after a few windy days. Use a 9–12 ft surf rod and a heavy sinker to reach deeper ground, or walk the wall flicking plastics towards the moored yachts (keep your distance) and out to open water. Whiting on pipis in the weedy clearings (warm months and at night), garfish under a float, and pinkies on a paternoster with pilchard, squid or chicken. Two forum anglers (2023) say the outside is mostly sand, so snapper chances are better from the very end of the wall, casting back toward the reefy beach side; the inside holds pinkies and flatties. Take your rubbish.",
    exposedTo: ["SW", "W", "NW", "N"], shelteredFrom: ["E", "SE", "NE"], tideLagHours: 0 },
    { area: "east", src: "local", local: { snapper: 4 }, sources: ["fmSandy", "bcSandy", "fvSandyWall", "fvHamptonGroynes", "syc", "reedySept"],
      hazards: ["Breakwater rocks are slippery and uneven, and waves wash them in a strong westerly – stay off the outer face when waves are breaking.", "Steep rocks: take a light and a mate in the evening, and a long rod to lift fish and tackle.", "Boats at the harbour entrance and pens – never cast across the channel. Hook and line damage to boats has been reported."],
      rules: ["In the bay's shallow edge zone you may only collect marine worms, bass yabbies and cephalopods as bait – no mussels, crabs or periwinkles off the rocks (VFA rules)."] }],

  [{ id: "princes-pier", name: "Princes Pier (Port Melbourne)", kind: "pier", lat: -37.8419, lon: 144.9269, shore: "north", depth: "Not verified",
    species: ["snapper", "black-bream", "sand-flathead", "australian-salmon", "mulloway", "garfish"], tideNote: "",
    windNote: "Points south into the top of the bay: northerlies are offshore and calm, while southerlies and south-westerlies push chop along the deck.",
    access: "End of Pier Street / Beach Street, Port Melbourne, just west of Station Pier. Signed street parking, time-limited and busy on warm days. Only the restored deck is public – fish where the signs allow, and never climb out onto the old timber stumps. Station Pier next door is a secured port – don't wander onto it.",
    tips: "Cast toward the old stumps: the timber piles hold snapper and pinkies, bream and flathead, and you will lose some rigs. High tide at first and last light is the usual call. Soft plastics (3–4 in) on light jig heads, or a running-sinker or paternoster rig with pilchard, squid or silver whiting; metal lures for salmon. If the end is taken, fish in closer to the gates – anglers report good fish halfway along.",
    exposedTo: ["SE", "S", "SW"], shelteredFrom: ["NE", "N", "NW"], tideLagHours: 0 },
    { area: "east", src: "local", local: { snapper: 4 }, sources: ["bcPrinces", "fvPortMel18", "fvPortMel21", "fvPortMelbSection", "mpPrinces"],
      hazards: ["The stump field is a snag graveyard and a danger if you fall in – keep children back and don't climb on the piles.", "Wet timber is slippery. Ships working at Station Pier next door make wash.", "Watch your back-cast on a busy promenade."] }],

  [{ id: "lagoon-pier", name: "Lagoon Pier (Port Melbourne)", kind: "pier", lat: -37.8460, lon: 144.9388, shore: "north", depth: "Not verified",
    species: ["snapper", "sand-flathead", "australian-salmon", "gummy-shark", "silver-trevally", "garfish", "calamari"], tideNote: "",
    windNote: "Looks south-west over the bay. Northerlies and easterlies are the comfortable days; one regular says an incoming tide with a southerly blowing is best for snapper. Brown Yarra water after rain can reach here but Port Melbourne is a little sheltered from it.",
    access: "Beach Street / Beaconsfield Parade, Port Melbourne, between Station Pier and Kerferd Road Pier. Public toilets, cafes, kiosks and restaurants are a short walk (Parks Victoria). Street parking is metered and busy.",
    tips: "Popular – get there early for a spot at the bend or the end. Cast a paternoster or running sinker with pilchard or squid toward the end at dusk, or 3–4 in soft plastics over the sand. Flathead are the steadiest fish in the warmer months; pinkies are about all year, with bigger snapper in spring, especially after rain flushes the Yarra (Bite Compass, forum). One regular likes an incoming tide with a southerly blowing.",
    exposedTo: ["S", "SW", "W"], shelteredFrom: ["N", "NE", "E", "SE"], tideLagHours: 0 },
    { area: "east", src: "local", local: { snapper: 4 }, sources: ["pvLagoon", "fmLagoon", "bcLagoon", "fvLagoonKerferd", "fvLagoon21"],
      hazards: ["Shallow areas and submerged objects – no jumping or diving (Parks Victoria).", "Crowded at the end; check your back-cast."] }],

  [{ id: "black-rock-jetty", name: "Black Rock Jetty (Half Moon Bay)", kind: "pier", lat: -37.9684, lon: 145.0097, shore: "east", depth: "Not verified",
    species: ["snapper", "calamari", "king-george-whiting", "garfish", "sand-flathead", "australian-salmon"], tideNote: "",
    windNote: "Half Moon Bay is protected from most weather, so the jetty fishes when the open bay is choppy. A southerly or south-westerly still pushes chop round the end. Clear water after a few calm days suits whiting and squid; snapper like low light and stirred-up water.",
    access: "Cerberus Way, off Beach Road, Black Rock (Half Moon Bay boat ramp). Parks Victoria says the car park is often scarce in busy months; public toilets are a short distance away. Never cast across the boat-launch lanes. Don't cast toward the HMVS Cerberus wreck – it has a protected zone – and Ricketts Point Marine Sanctuary (no-take) is a short way south-east.",
    tips: "A cast from the end reaches snapper water: running sinker with pilchard or squid at dusk or on a tide change. Lighter gear for whiting on the sand, jigs along the weed edges for squid when the water is clear, and a float for garfish. Fish before the weekend boat-launch rush.",
    exposedTo: ["S", "SW", "W"], shelteredFrom: ["N", "NE", "E"], tideLagHours: 0 },
    { area: "east", src: "local", sources: ["pvBlackRock", "fmBlackRock", "bcBlackRock", "fvSquidHelp"],
      hazards: ["One of the busiest ramps in the bay – watch for trailers and reversing cars.", "The rock wall and wet decking are slippery.", "Stay out of the Cerberus protected zone (permit needed) and Ricketts Point Marine Sanctuary."] }],

  // Choc's own spot (24 Oct 2026): his Google Maps pin -37.977575, 145.016218. Checked against Parks Victoria's Ricketts Point
  // Marine Sanctuary map: the sanctuary's shore boundary marker (end of Fourth Street, 37°58'51"S 145°01'04"E) is about 390 m south-east.
  [{ id: "black-rock-beach-choc", name: "Black Rock Beach – Choc's spot", kind: "shore", lat: -37.9776, lon: 145.0162, shore: "east",
    depth: "Not verified. Surf Life Saving's Beachsafe says the beach is steep, with deep water close in.",
    species: ["calamari", "garfish"], tideNote: "Best tide here: not known yet.",
    windNote: "The beach faces south-west (Beachsafe). Light north to east winds blow off the land and leave the water calm and clear, which squid and garfish like. A south-westerly or westerly blows straight in, waves break on the reef and the water goes dirty – give it a day or two to clear.",
    access: "South end of Black Rock Beach, at the foot of the bluff below Beach Road, near Second Street. Walk down from the foreshore car park just south of Black Rock Life Saving Club (about 100 m north), then along the beach or the Bay Trail. Ricketts Point Marine Sanctuary starts about 390 m further south – stay north of Fourth Street.",
    tips: "Choc's own spot: he rates it for squid and garfish. Surf Life Saving says there are sandstone reefs just off this beach. For squid, cast a size 2.5–3.0 jig over the reef and weed edges in clear water, around dusk and into the night. For garfish, use a light float rig with a fine-wire size 10–12 long-shank hook, a small bait (maggot, silverfish or pipi) and a fine berley trail. A slow tide is usually easier with a float. We don't know the best tide or time here yet.",
    exposedTo: ["W", "SW", "S"], shelteredFrom: ["N", "NE", "E"], tideLagHours: 0 },
    { area: "east", src: "choc", local: { calamari: 3, garfish: 3 },
      sources: ["pvRicketts", "osmRicketts", "bsBlackRock", "bsQuietCorner", "baysideBeaches", "fvBlackRockMordy", "fmBlackRock"],
      notice: "No fishing south of here: Ricketts Point Marine Sanctuary starts about 390 m south-east, at the end of Fourth Street. The shore boundary marker is near emergency marker BCC 149, just north of Quiet Corner. Inside the sanctuary, all fishing and collecting are banned, with heavy penalties. Fish here or further north, and cast straight out, not towards Quiet Corner.",
      rules: ["Ricketts Point Marine Sanctuary (Parks Victoria): no fishing of any kind and no taking bait, shells or animals. It runs from Quiet Corner to Table Rock and about 500 m offshore, marked by yellow piles and buoys. To report a fishing offence, call 13 FISH (13 3474)."],
      hazards: ["Sandstone reef and wet rock are very slippery. Wear grippy shoes.", "Waves break over the reef, especially at low tide or in a south-westerly (Beachsafe). Deep water lies close to the beach.", "The beach narrows to a seawall walkway at high tide – check you can walk back.", "We could not confirm any lights. Take a headlamp and go with a mate at night.", "Stay off the bluff and cliff faces."] }],

  // Choc's second spot (24 Oct 2026): his pin -37.899259, 144.984025 – the rock revetment just south of the North Road boat ramp,
  // Brighton (Bayside's North Road Foreshore Masterplan: "existing rockwork" between the boat ramp and Dudley Street). About 920 m
  // north of Middle Brighton Pier, so it's a separate spot, not the pier or its breakwall. No marine park within 9 km.
  [{ id: "north-road-rocks-choc", name: "North Road rocks, Brighton – Choc's spot", kind: "shore", lat: -37.8993, lon: 144.9840, shore: "east",
    depth: "Not verified.",
    species: ["calamari", "garfish"], tideNote: "Best tide here: not known yet.",
    windNote: "This shore faces west (Bayside). Light east or north-east winds blow off the land and leave the water calm and clear, which suits squid and garfish. Westerlies and north-westerlies (mostly winter) and southerlies and south-westerlies (mostly summer) push waves on to the rocks, sometimes over the path, and muddy the water (Bayside's North Road Foreshore Masterplan).",
    access: "On the Bay Trail, about 120 m south of the North Road boat ramp and jetty, Brighton, opposite Chatsworth Avenue. Park in the North Road (B1) foreshore car park by North Point Café – it's busy on weekends. Then walk south along the path and step down carefully on to the rocks. Middle Brighton Pier and the Royal Brighton Yacht Club marina are about 900 m further south.",
    tips: "Choc's own spot: he rates it for squid and garfish. The shore here is a rock wall with a small rocky point. For squid, cast a size 2.5–3.0 jig and work it slowly back over the weed and rock edges in clear water, around dusk and into the night. For garfish, use a light float rig, a fine-wire size 10–12 long-shank hook, a small bait (maggot, silverfish or pipi) and a fine berley trail. We don't know the best tide or time here yet.",
    exposedTo: ["W", "SW", "NW"], shelteredFrom: ["E", "NE", "SE"], tideLagHours: 0 },
    { area: "east", src: "choc", local: { calamari: 3, garfish: 3 },
      sources: ["baysideNorthRoad", "bvBrightonRamp", "rbycMarina", "sqPPB"],
      notice: "Fish from the rocks only. Keep well clear of the North Road boat ramp and jetty while boats are launching, and of any moored boats. Middle Brighton Pier and the Royal Brighton Yacht Club marina are about 900 m south; there's no fishing from the marina (yacht club rules). This spot is not in a marine park or sanctuary – the nearest are more than 9 km away.",
      hazards: ["Loose, uneven boulders that are slippery when wet. Wear grippy shoes and keep three points of contact.", "In westerly or south-westerly blows, waves wash over the rocks and sometimes over the path (Bayside).", "Cyclists move fast on the Bay Trail behind you – keep rods and gear off the path.", "We could not confirm any lights on the rocks. Take a headlamp and go with a mate at night.", "Native rakali (water rats) live in these rocks – take all line, hooks and bait scraps home."] }],

  // Choc's third spot (24 Oct 2026): his pin -37.869102, 144.893670 – the rock groyne at the east end of Williamstown Beach.
  // About 1.1 km west of the Point Gellibrand spot. Jawbone Marine Sanctuary's most easterly shore point (Parks Victoria:
  // 37°52'03"S 144°53'01"E) is about 900 m west; the swimming-only zone is off the beach on the west side.
  [{ id: "williamstown-beach-rocks-choc", name: "Williamstown Beach east rock wall – Choc's spot", kind: "shore", lat: -37.8691, lon: 144.8937, shore: "north",
    depth: "Not verified. A local boat angler says squid are caught in about 2–4 m right beside the wall.",
    species: ["calamari"], tideNote: "Best tide here: not known yet.",
    windNote: "The wall points out into the bay and faces south to south-west. Northerly to easterly winds blow off the land and keep the water calm and clean, which squid like. A southerly or south-westerly blows straight on and muddies the water – give it a day or two to clear.",
    access: "At the east end of Williamstown Beach, off the Esplanade, Williamstown, next to the life saving club. Walk out along the rock groyne from the car park behind it. Hobsons Bay City Council says fishing is available from the rocky outcrops at either end of the beach. Williamstown Beach station is about a 10-minute walk.",
    tips: "Choc's own spot for squid. A local boat angler (2020) says the wall almost never fails for squid, at any time of day, in 2–4 m of water close to the rocks – an easy cast from the wall. It's snaggy reef, so use slow-sinking size 2.5–3.0 jigs, a heavier leader (about 20 lb, so a snagged jig can be pulled free) and plenty of spare jigs. Clean water is best. We don't know the best tide or time here yet.",
    exposedTo: ["S", "SW", "W"], shelteredFrom: ["N", "NE", "E"], tideLagHours: 0 },
    { area: "northwest", src: "choc", local: { calamari: 3 },
      sources: ["hbBeach", "hbFishing", "fvWillySquid", "pvJawbone", "osmJawbone", "swSwimmers"],
      notice: "Swimmers: there's a swimming-only zone off the beach (yellow poles), and swimmers have been tangled in lines cast from these rocks. Cast south, out into the bay, never towards the beach or the swimmers. Jawbone Marine Sanctuary (no fishing) starts about 900 m west, past the far end of the beach – don't fish there.",
      rules: ["Jawbone Marine Sanctuary (Parks Victoria): no fishing or collecting of any kind. It starts about 900 m west of this spot, past the west end of Williamstown Beach."],
      hazards: ["Wet, uneven rock – slippery. Wear grippy shoes.", "Snaggy reef – expect to lose jigs. Never climb down the rocks to free one.", "Waves wash on to the wall in a strong southerly or south-westerly.", "We could not confirm any lights. Take a headlamp and go with a mate at night.", "Busy beach in summer – watch your back-cast for people on the rocks."] }],

  [{ id: "beaumaris-pier", name: "Beaumaris Pier (Pelican Quays)", kind: "pier", lat: -37.9912, lon: 145.0445, shore: "east", depth: "Not verified",
    species: ["calamari", "garfish", "snapper"], tideNote: "",
    windNote: "A small pier tucked into Keefers Cove, protected on three sides. A southerly blows straight into the pocket and chops it up; most other winds are fine if the water is clean.",
    access: "Park in the public parking above, around Beach Road, Ray Street and Charman Road, and walk down Pelican Quays to the small public gate beside the Beaumaris Motor Yacht Squadron. The lower car park is for squadron members only. Never fish toward Ricketts Point Marine Sanctuary (no-take).",
    tips: "A compact, quiet squid spot: night is usually best on a calm evening with clean water. Size 2.5 jigs, short casts along the pier edge, pylons and weed/sand edges. Garfish are the other main catch; snapper are only an occasional bonus. Check the squadron's public webcam before you go. Carry your rod carefully through the small gate at night.",
    exposedTo: ["S", "SE"], shelteredFrom: ["N", "NE", "E", "SW", "W", "NW"], tideLagHours: 0 },
    { area: "east", src: "local", sources: ["sqBeaumaris", "fmBeaumaris", "fvSquidHelp"],
      hazards: ["Small shared space with boats, fences and a narrow gate – keep casts away from boat movement and other anglers.", "Southerly chop makes the pier uncomfortable."] }],
];
