export type Species = {
  slug: string;
  name: string;
  aka?: string;
  scientific: string;
  minCm?: number;
  maxCm?: number;
  bag: number;
  bagNote?: string;
  measure?: string;
  filletOnWater: boolean;
  season: number[];
  peak: string;
  baits: string[];
  methods: string[];
  habitat: string;
  notes: string;
};

/** Season intensity per month, Jan–Dec, 0 quiet → 3 peak. */
export const SPECIES: Species[] = [
  {
    slug: "snapper",
    name: "Snapper",
    aka: "Red, pinky",
    scientific: "Chrysophrys auratus",
    minCm: 28,
    bag: 10,
    bagNote: "No more than 3 fish ≥ 40 cm",
    filletOnWater: false,
    season: [2, 1, 1, 1, 1, 0, 1, 2, 3, 3, 3, 2],
    peak: "Mid-October to mid-November",
    baits: ["Pilchard", "Squid head", "Silver whiting", "Saury"],
    methods: ["Paternoster", "Running sinker", "Soft plastic"],
    habitat: "Reef edges, channel lips and rubble in 6–20 m. Early-season fish push in shallow.",
    notes:
      "The bay's headline fishery. Schools enter from Bass Strait as water climbs through 13–16 °C. High, rising pressure and the last of the flood tide are the classic bite. After dark on the bigger piers is a real option once the run is on.",
  },
  {
    slug: "king-george-whiting",
    name: "King George whiting",
    aka: "KGW",
    scientific: "Sillaginodes punctata",
    minCm: 27,
    bag: 20,
    filletOnWater: false,
    season: [3, 3, 3, 2, 1, 1, 1, 1, 2, 2, 3, 3],
    peak: "December to March",
    baits: ["Pipi", "Bass yabby", "Squid strip", "Mussel"],
    methods: ["Light paternoster", "Running ball sinker"],
    habitat: "Sand-weed mosaic in 3–8 m — Rye Bank, Capel Sound, Indented Head, Safety Beach.",
    notes:
      "Must be kept whole or in carcass form until you leave the water. Light leaders, just enough lead to hold, and a berley trail of crushed pipi. 45 cm is a genuine bay belter.",
  },
  {
    slug: "calamari",
    name: "Southern calamari",
    aka: "Squid",
    scientific: "Sepioteuthis australis",
    bag: 10,
    bagNote: "Combined with all squid, octopus and cuttlefish",
    filletOnWater: true,
    season: [2, 2, 3, 3, 3, 2, 2, 2, 3, 3, 3, 2],
    peak: "Year-round; spring (spawning, bigger fish) and autumn (clear water)",
    baits: ["Cloth jig", "Prawn-imitation egi", "Live bait under a float"],
    methods: ["Egi jig", "Slow roll over weed"],
    habitat: "Weed beds in 3–6 m. Piers with light and structure after dark.",
    notes:
      "The most reliable year-round session in the bay. High tide ± two hours. Rye, Mornington, Queenscliff and Sorrento weed are the usual starting points. Size 2.5–3.5 jigs cover most of the water.",
  },
  {
    slug: "sand-flathead",
    name: "Sand flathead",
    aka: "Yank flathead",
    scientific: "Platycephalus bassensis",
    minCm: 27,
    bag: 20,
    bagNote: "Combined with other flathead except dusky",
    filletOnWater: true,
    season: [3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 3, 3],
    peak: "Year-round, best November to March",
    baits: ["Pilchard strip", "Squid", "Soft plastic grub"],
    methods: ["Drift paternoster", "Soft plastic on the sand"],
    habitat: "Open sand in 8–18 m across the middle of the bay.",
    notes:
      "Always-on protein. Drift until you mark a patch, then shorten the drift. Ebb tide draining the shallows often switches them on. Check you do not have a dusky — different slot limit.",
  },
  {
    slug: "australian-salmon",
    name: "Australian salmon",
    scientific: "Arripis spp. (eastern A. trutta in Port Phillip)",
    minCm: 21,
    bag: 20,
    bagNote: "Combined with Australian herring",
    filletOnWater: true,
    season: [1, 1, 2, 2, 3, 3, 3, 3, 3, 2, 1, 1],
    peak: "May to September",
    baits: ["Metal slug", "Pilchard", "Soft stickbait"],
    methods: ["Spin", "Cast metal", "Bait under a float"],
    habitat: "Heads, outer piers and surface bust-ups along the eastern shore.",
    notes:
      "Winter through early spring they push inside the Heads and run the eastern beaches. Watch for birds. Fast retrieve, keep the drag honest — they are not trout.",
  },
  {
    slug: "silver-trevally",
    name: "Silver trevally",
    scientific: "Pseudocaranx spp.",
    minCm: 20,
    bag: 20,
    filletOnWater: true,
    season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    peak: "Year-round around structure",
    baits: ["Pilchard cube", "Squid strip", "Small soft plastic"],
    methods: ["Bait among pylons", "Light spin"],
    habitat: "Pier pylons, reefs and breakwalls. St Kilda, Williamstown, Geelong.",
    notes:
      "The bay's best light-tackle scrap. Berley them up around pylons and keep the bait small. Autumn and winter they school tighter on the city piers.",
  },
  {
    slug: "black-bream",
    name: "Black bream",
    scientific: "Acanthopagrus butcheri",
    minCm: 28,
    bag: 10,
    bagNote: "Combined with other bream and tarwhine (Gippsland Lakes: 7, max 38 cm)",
    filletOnWater: false,
    season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    peak: "Year-round in the rivers",
    baits: ["Bass yabby", "Prawn", "Crab", "Soft plastic"],
    methods: ["Pontoon fishing", "Light bait", "Soft plastic"],
    habitat: "Werribee River, Patterson River, Yarra, Maribyrnong, Geelong waterfront pylons.",
    notes:
      "Keep whole until you leave the water. After rain the river mouths colour up and the bigger fish push out onto the flats. A rising tide into structure is the textbook session.",
  },
  {
    slug: "yellowtail-kingfish",
    name: "Yellowtail kingfish",
    aka: "Yellowtail",
    scientific: "Seriola lalandi",
    minCm: 60,
    bag: 2,
    filletOnWater: true,
    season: [3, 3, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3],
    peak: "December to March",
    baits: ["Live salmon", "Live squid", "Stickbait", "Popper"],
    methods: ["Live bait", "Surface lure", "Jig"],
    habitat: "The Rip, Portsea Pier, South Channel, current lines off the Heads.",
    notes:
      "Bag cut to 2 per person in October 2025. Portsea is the only land-based platform that regularly puts you in casting range. Treat The Rip as ocean water — go with the tide and a plan.",
  },
  {
    slug: "gummy-shark",
    name: "Gummy shark",
    scientific: "Mustelus antarcticus",
    minCm: 45,
    bag: 2,
    bagNote: "Combined with school shark; 45 cm partial length",
    measure: "Rear-most gill slit to the tail fin base",
    filletOnWater: false,
    season: [2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2],
    peak: "Summer nights on the sand",
    baits: ["Salmon head", "Squid", "Mullet fillet"],
    methods: ["Running sinker on the sand", "Night session"],
    habitat: "Open sand, channel edges, Mud Islands perimeter (outside the park).",
    notes:
      "Partial-length measurement, not total length. Keep in carcass form on the water. Night tides on the southern sand are the usual programme.",
  },
  {
    slug: "elephant-fish",
    name: "Elephant fish",
    aka: "Repshin",
    scientific: "Callorhinchus milii",
    bag: 1,
    filletOnWater: false,
    season: [0, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0, 0],
    peak: "April to May",
    baits: ["Squid", "Pilchard", "Salmon piece"],
    methods: ["Bait on sand in 8–14 m"],
    habitat: "Southern sand, Corio and the western shallows as the water cools.",
    notes:
      "Bag of one, no minimum size, must stay in carcass form. A short, sharp autumn run. Handle with care — the plough is not decoration.",
  },
  {
    slug: "garfish",
    name: "Southern garfish",
    aka: "Beakie",
    scientific: "Hyporhamphus melanochir",
    bag: 40,
    bagNote: "Combined, all garfish species",
    filletOnWater: true,
    season: [3, 3, 2, 2, 2, 1, 1, 2, 3, 3, 3, 3],
    peak: "September to February",
    baits: ["Maggots", "Silverfish sliver", "Bread berley"],
    methods: ["Float", "Unweighted bait under a light berley trail"],
    habitat: "Shallow flats and pier shadows on a making tide — Safety Beach, Rye, Frankston.",
    notes:
      "Berley is the whole game. A fine trail of bread and tuna oil, tiny hooks, and stay still. Rising tide over the flats is when they come to you.",
  },
  {
    slug: "mulloway",
    name: "Mulloway",
    aka: "Jewfish",
    scientific: "Argyrosomus japonicus",
    minCm: 60,
    bag: 5,
    filletOnWater: true,
    season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    peak: "After rain, night tides",
    baits: ["Live mullet", "Live squid", "Soft plastic"],
    methods: ["Live bait", "Soft plastic along walls"],
    habitat: "Yarra and Maribyrnong, Patterson River, Warmies, Hobsons Bay after dark.",
    notes:
      "The city's quietly serious fish. Best in autumn and winter; night tides against structure, and the lower river after rain (VFA-funded tagging; FishingMad).",
  },
  {
    slug: "snook",
    name: "Snook",
    aka: "Longfin pike",
    scientific: "Sphyraena novaehollandiae",
    minCm: 30,
    bag: 10,
    bagNote: "Combined with longfin pike",
    filletOnWater: true,
    season: [2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2],
    peak: "Warm months over weed",
    baits: ["Wobbler", "Soft plastic", "Fly"],
    methods: ["Troll", "Cast over weed"],
    habitat: "Weed edges, 3–8 m, southern and eastern bay.",
    notes:
      "Troll a small wobbler along the weed line at first light. They come in bursts. Keep a wet rag on the teeth.",
  },
  {
    slug: "leatherjacket",
    name: "Leatherjacket",
    aka: "Six-spined and others",
    scientific: "Monacanthidae",
    bag: 20,
    bagNote: "Combined, all leatherjacket species",
    filletOnWater: true,
    season: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    peak: "Year-round on reef and pylons",
    baits: ["Squid", "Pilchard", "Prawn"],
    methods: ["Small bait on paternoster", "Lure around pylons"],
    habitat: "Reef, tyre reefs, pier pylons — Carrum reef, Frankston, Williamstown.",
    notes:
      "No minimum size. Nuisance on snapper gear, excellent on light tackle. Small hooks and a tight drag; they nibble rather than smash.",
  },
  {
    slug: "estuary-perch",
    name: "Estuary perch",
    aka: "E-perch, EP",
    scientific: "Macquaria colonorum",
    minCm: 27,
    bag: 5,
    bagNote: "Combined with Australian bass; no more than 2 bass",
    filletOnWater: false,
    season: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    peak: "Warmer months (rough local guide)",
    baits: ["Prawn", "Yabby", "Scrub worm"],
    methods: ["Light spin along timber", "Surface lures on warm calm evenings"],
    habitat: "Lower Yarra, Maribyrnong, Albert Park Lake, Tooradin Inlet.",
    notes: "Keep whole until you leave the water. Easy to mix up with Australian bass, and the bag is shared.",
  },
  {
    slug: "golden-perch",
    name: "Golden perch",
    aka: "Yellowbelly",
    scientific: "Macquaria ambigua",
    minCm: 30,
    bag: 5,
    filletOnWater: false,
    season: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    peak: "Warmer months (rough local guide)",
    baits: ["Scrub worm", "Yabby"],
    methods: ["Slow-rolled soft plastics", "Lipless cranks and blades"],
    habitat: "Albert Park Lake (stocked by the VFA).",
    notes: "Freshwater native, different from estuary perch. Keep whole until away from the water.",
  },
  {
    slug: "silver-perch",
    name: "Silver perch",
    scientific: "Bidyanus bidyanus",
    minCm: 30,
    bag: 5,
    bagNote: "Lakes and waters south of the Great Dividing Range. None from rivers north of the range.",
    filletOnWater: false,
    season: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    peak: "Warmer months (rough local guide)",
    baits: ["Scrub worm", "Shrimp", "Yabby"],
    methods: ["Running sinker or float rig"],
    habitat: "Albert Park Lake (stocked by the VFA).",
    notes: "Keep whole until away from the water.",
  },
  {
    slug: "redfin",
    name: "Redfin",
    aka: "English perch",
    scientific: "Perca fluviatilis",
    bag: 0,
    bagNote: "No bag limit",
    filletOnWater: true,
    season: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    peak: "All year",
    baits: ["Worm", "Yabby", "Maggot"],
    methods: ["Small plastics and blades near snags"],
    habitat: "Freshwater Yarra (e.g. Yarra Bend), upper Maribyrnong; rare in Albert Park Lake.",
    notes: "Introduced pest: the VFA encourages anglers not to put it back. No size or bag limit.",
  },
  {
    slug: "murray-cod",
    name: "Murray cod",
    scientific: "Maccullochella peelii",
    minCm: 55,
    maxCm: 75,
    bag: 2,
    bagNote: "1 in rivers, 2 in Albert Park Lake. Legal size 55–75 cm only. Closed 1 Sep–30 Nov in the Yarra River.",
    filletOnWater: false,
    season: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    peak: "No reliable source for city waters",
    baits: [],
    methods: [],
    habitat: "Stocked in Albert Park Lake; rarely reported.",
    notes: "Only fish 55–75 cm may be kept. Keep whole until away from the water.",
  },
];

export const bagText = (s: Species) => (s.slug === "redfin" ? "No limit" : String(s.bag));
export const sizeText = (s: Species) => (s.minCm && s.maxCm ? `${s.minCm}–${s.maxCm} cm only` : s.minCm ? `${s.minCm} cm` : "None");

export function speciesBySlug(slug: string) {
  return SPECIES.find((s) => s.slug === slug);
}

export function seasonLabel(level: number) {
  if (level >= 3) return "Peak";
  if (level === 2) return "On";
  if (level === 1) return "Quiet";
  return "Off";
}
