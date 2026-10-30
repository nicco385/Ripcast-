/** Shore-fishing tips from four experts, merged by topic. Paraphrased (not copied) from their videos,
 * podcasts and articles; checked Oct 2026. Each tip links to the exact source. */
export type Person = { id: string; name: string; who: string; links: { t: string; u: string }[] };
export const PEOPLE: Person[] = [
  { id: "lee", name: "Lee Rayner", who: "Victorian – Lee Rayner's Fishing Edge TV, ex-Rex Hunt co-host", links: [{ t: "Lee Rayner's Fishing Edge on YouTube", u: "https://www.youtube.com/@leeraynerfishing" }] },
  { id: "brett", name: "Brett Reed", who: "Victorian – Reedy's Rigs, Frankston rig maker", links: [{ t: "Reedy's Rigs on YouTube", u: "https://www.youtube.com/@ReedysRigs" }, { t: "reedysrigs.com", u: "https://reedysrigs.com" }, { t: "Reedy's Rigs snapper guide (both bays)", u: "https://reedysrigs.com/fishing/snapper-fishing-port-phillip-westernport/" }] },
  { id: "brendan", name: "Brendan Wing", who: "Victorian – YouFishTV, Western Port", links: [{ t: "YouFishTV on YouTube", u: "https://www.youtube.com/@YouFishTV" }] },
  { id: "roger", name: "Roger Osborne", who: "NSW – 40+ years beach, lake and river fishing", links: [{ t: "Roger Osborne Fishing on YouTube", u: "https://www.youtube.com/@RogerOsborneFishing" }, { t: "rogersfishing.com", u: "https://www.rogersfishing.com" }] },
];
export type Cred = { p: string; title: string; src: string };
/** inGuide: the same advice is already written in that fish's guide, so it isn't repeated in the guide's expert card. */
export type Tip = { t: string; by: Cred[]; species?: string[]; inGuide?: boolean };
export type TipGroup = { id: string; icon: string; title: string; note?: string; tips: Tip[] };

const YT = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const R = (title: string, id: string): Cred => ({ p: "roger", title, src: YT(id) });
const READ = R("How to READ a BEACH (8 key points)", "7ZGO4qSiXk4");
const RIGS = R("Beach Fishing Rigs – 6 killer rigs", "I-At3GWOU-c");
const BAITS = R("Best baits for beach fishing", "4ic2McqSamk");
const L_HOW: Cred = { p: "lee", title: "How to catch snapper (video)", src: YT("Hto3sF7raHA") };
const L_POD: Cred = { p: "lee", title: "Australian Lure Fishing podcast ep. 276 – Melbourne snapper", src: "https://podcasts.apple.com/au/podcast/melbourne-snapper-with-lee-rayner/id1447917143?i=1000493579463" };
const L_WIN: Cred = { p: "lee", title: "Australian Lure Fishing podcast ep. 513 – winter options around Melbourne", src: "https://podcasts.apple.com/au/podcast/episode-513-five-best-winter-fishing-options-around/id1447917143?i=1000562062163" };
const L_EP: Cred = { p: "lee", title: "Australian Lure Fishing podcast ep. 435 – Melbourne estuary perch", src: "https://podcasts.apple.com/au/podcast/melbourne-estuary-perch-with-lee-rayner/id1447917143?i=1000538876204" };
const L_GAR: Cred = { p: "lee", title: "Break out the sea gars (Fishing Monthly)", src: "https://fishingmonthly.com.au/break-out-the-sea-gars-catching-garfish-for-food-and-bait/" };
const B_KGW: Cred = { p: "brett", title: "What King George whiting actually do (video)", src: YT("OkzefHG7hig") };
const B_KGWG: Cred = { p: "brett", title: "King George whiting guide (reedysrigs.com)", src: "https://reedysrigs.com/king-george-whiting-fishing-guide/" };
const B_SNAP: Cred = { p: "brett", title: "Snapper fishing Port Phillip & Western Port guide", src: "https://reedysrigs.com/fishing/snapper-fishing-port-phillip-westernport/" };
const B_LB10: Cred = { p: "brett", title: "10 land-based snapper tips", src: "https://reedysrigs.com/10-tips-catching-australian-snapper-landbased/" };
const B_MORN: Cred = { p: "brett", title: "Mornington Pier land-based snapper", src: "https://reedysrigs.com/mornington-pier-fishing-landbased-tip/" };
const W_LOGIC: Cred = { p: "brendan", title: "Our snapper fishing logic – step by step (video)", src: YT("lop5xAw65y8") };

export const TIP_GROUPS: TipGroup[] = [
  { id: "plan", icon: "🗓️", title: "Plan your trip", tips: [
    { t: "Check the forecast a few days ahead – wave height, wind strength and direction, and the tide. If it's very rough or very windy, pick another day.", by: [READ] },
    { t: "Decide which fish you're after before you leave home. That decides your hook, sinker, line and bait. Have a plan rather than just turning up.", by: [READ, B_KGW] },
    { t: "Low light is best: first light to just after sunrise, and the last hour before dark into early night. Overcast days can fish all day; bright midday sun is usually slow.", by: [READ, B_KGW, B_LB10] },
    { t: "Tide changes matter. The few hours around a change are when most bites come – try to line up dawn or dusk with a tide change.", by: [B_KGWG, L_WIN] },
    { t: "Land-based snapper often bite well in a big blow with a low barometer – the opposite of boat fishing.", by: [L_POD], species: ["snapper"], inGuide: true },
    { t: "Keep trying different times and spots, and make your own reports rather than chasing other people's. Every trip teaches you something.", by: [R("Roger's #1 tip", "qp3R1OrS6ew"), B_KGW] },
    { t: "Believe you'll catch one. Be organised – net, bait and rig ready – so you don't fumble when the bite comes.", by: [B_KGW, L_HOW] },
  ] },
  { id: "spots", icon: "📍", title: "Victorian spot tips", note: "From Lee and Brett, who fish Melbourne's bays. Always check the VFA rules and the spot's own page in this app.", tips: [
    { t: "Mornington Pier snapper: the reef runs about halfway down the pier. After strong westerlies the water dirties and snapper feed on the reef edge about 15 m out – cast just past it on the west side.", by: [B_MORN], species: ["snapper"] },
    { t: "Mornington Pier wind: south-west is best, southerly is excellent, and a strong westerly pushes snapper in tight to the reef. A northerly blows straight in your face – the hardest.", by: [B_MORN], species: ["snapper"] },
    { t: "Big tides in the five days before a full or new moon are prime for snapper. Fish 2 hours either side of high tide; the run-in is extra good early in the season.", by: [B_MORN], species: ["snapper"] },
    { t: "Squid: focus on Frankston to Sorrento in clear water. At Mordialloc Pier, fish the reef side, not the clean sand.", by: [L_WIN], species: ["calamari"], inGuide: true },
    { t: "Winter bream and estuary perch school up in the Yarra, Maribyrnong, Patterson and Werribee. Find the school – there are long stretches with no fish. Estuaries are a good option when the bay is too rough.", by: [L_WIN], species: ["black-bream", "estuary-perch"] },
    { t: "Estuary perch are also stocked in Albert Park Lake, with fish of 40 cm or more.", by: [L_WIN], species: ["estuary-perch"] },
  ] },
  { id: "beach", icon: "🌊", title: "Reading a beach", note: "Gutters and rips are for surf beaches (e.g. the ocean side of the Mornington Peninsula or Bellarine). Most Port Phillip Bay beaches are calm – see the last tip.", tips: [
    { t: "Sandbars are where the waves break. Gutters and holes are the deeper water between them.", by: [READ] },
    { t: "Waves stir up crabs and worms on the sandbar and wash them into the gutter. Cast onto the bar, wait a minute, then drag your bait just off the edge.", by: [READ], species: ["king-george-whiting", "black-bream", "sand-flathead", "australian-salmon"] },
    { t: "Stay away from the rip itself – too strong to hold the bottom. Fish the start (head) of the gutter where the current is gentler.", by: [R("How to use RIPS in beach fishing", "PG4WGpSQafo")] },
    { t: "The rocky edge where a beach meets a headland holds food and fish – including whiting right next to the rocks, and bigger fish that hunt them.", by: [READ], species: ["king-george-whiting", "mulloway"] },
    { t: "River and creek mouths are a food trap – small fish and prawns get flushed out, especially on a run-out tide.", by: [READ], species: ["mulloway", "black-bream", "australian-salmon"] },
    { t: "In a strong wind, fish the sheltered end of the beach near the headland.", by: [READ] },
    { t: "Calm, flat beach with no gutters? Fish patrol right along the shore edge, so you don't need to cast far.", by: [READ] },
  ] },
  { id: "where", icon: "🔎", title: "Finding the fish", tips: [
    { t: "Whiting sit on the edge where weed meets sand – not in the middle of the weed or the middle of the sand.", by: [B_KGWG], species: ["king-george-whiting"] },
    { t: "Flathead sit on sand where shallow water drops into deeper water, often beside weed. Use Google Earth to find sandy edges you can reach from shore.", by: [R("The BEST spot to fish for flathead", "MI3mwvCziyE")], species: ["sand-flathead"] },
    { t: "Squid lay eggs on seagrass – fish the edge of the weed beds, especially in spring.", by: [W_LOGIC], species: ["calamari"], inGuide: true },
    { t: "Snapper from land: look for reef edges, rocky points, breakwalls and drop-offs, and watch for birds or bait splashing on the surface.", by: [B_LB10], species: ["snapper"] },
    { t: "Don't just cast and wait. Cast long, wind in a little and pause; when you get a bite, cast back to that spot.", by: [READ] },
    { t: "No bite? Move – but give a spot about 10–15 minutes first.", by: [READ, B_KGW] },
    { t: "Stay quiet in shallow water – snapper spook easily.", by: [B_LB10], species: ["snapper"] },
  ] },
  { id: "rigs", icon: "🪝", title: "Rigs", tips: [
    { t: "Running sinker rig: ball sinker on the main line, swivel, then a 40–50 cm leader to the hook. The line slides through the sinker so the fish doesn't feel the weight.", by: [RIGS] },
    { t: "Use the lightest sinker that will hold the bottom – you'll feel bites better.", by: [B_KGWG, B_SNAP] },
    { t: "Whiting: long-shank hook (size 4–6) or a small circle hook. Roger and Brett both use a two-hook paternoster; Brett also uses his single-hook rig in shallow water.", by: [RIGS, B_KGWG], species: ["king-george-whiting"] },
    { t: "Bream: running sinker rig with a 3/0 hook – takes prawns, worms, yabbies, pilchard, fish strips or pipis.", by: [RIGS], species: ["black-bream"] },
    { t: "Brett's simple pier snapper rig: big ball sinker (3–4 oz), a bead, 20 lb leader and one sharp suicide hook. Lift the rod to steer fish over snags.", by: [B_MORN], species: ["snapper"] },
    { t: "Two snelled hooks about 10 cm apart hold a whole pilchard, silver whiting or squid head for snapper.", by: [L_HOW, B_SNAP], species: ["snapper"], inGuide: true },
    { t: "Whole pilchard on ganged hooks with a short leader (15–20 cm) so it casts well. Good for salmon, flathead and mulloway.", by: [RIGS], species: ["australian-salmon", "sand-flathead", "mulloway"] },
    { t: "Stinger rig for half a pilchard, a fish strip or squid: a 4/0 hook with a small size-4 'stinger' hook below. Catches bream, flathead and snapper.", by: [RIGS], species: ["black-bream", "sand-flathead", "snapper"] },
    { t: "Use a snap swivel or lead clip on the sinker so you can swap weights quickly as conditions change.", by: [RIGS, B_KGWG] },
  ] },
  { id: "bait", icon: "🦐", title: "Baits & how to use them", tips: [
    { t: "Fresh bait beats frozen. Catching your own squid first is the top snapper bait.", by: [B_LB10, W_LOGIC], species: ["snapper"], inGuide: true },
    { t: "Whiting: carry pipi, squid and mussel. Squid works when they're biting freely; switch to fresh pipi or mussel when it gets tough.", by: [B_KGW], species: ["king-george-whiting"], inGuide: true },
    { t: "Use smaller baits for snapper so they swallow them in one go. A tough bait like a whiting head stays on for ages and is usually taken by a big fish.", by: [L_HOW], species: ["snapper"] },
    { t: "Pilchards (from tackle shops and servos) catch bream, flathead, salmon and mulloway. On ganged hooks the top hook goes through the eye; or cut one in half for two baits.", by: [BAITS] },
    { t: "Half hitch: loop the line once around the end of the bait to hold it firm. Works on almost every bait.", by: [BAITS] },
    { t: "Fish strips: go in through the flesh and out the skin, and keep the hook point showing. Shave strips thin for bream.", by: [BAITS], species: ["black-bream", "sand-flathead", "snapper"] },
    { t: "Squid: a small tapered strip (about 5 cm) for bream; a long strip (about 14 cm) on two big hooks for mulloway and snapper.", by: [BAITS], species: ["black-bream", "mulloway", "snapper"] },
    { t: "Yabbies / nippers: thread from the tail up the shank to the head, add a half hitch, and cast gently. Snap off the top of the nipper's claw so it can't bite, but leave the white claw – it stands out.", by: [BAITS, R("How I rig my nipper bait", "UIAEW7mPibI")], species: ["king-george-whiting", "black-bream"] },
    { t: "Live poddy mullet: hook through the back, above the backbone, so it stays alive. Great for mulloway and big flathead.", by: [BAITS], species: ["mulloway", "sand-flathead"] },
    { t: "Berley: finely chopped pilchards for snapper. For garfish use a very fine berley (e.g. tuna oil on bread crumbs) so it attracts them without filling them up.", by: [L_HOW, L_GAR], species: ["snapper", "garfish"], inGuide: true },
  ] },
  { id: "bite", icon: "🎣", title: "Hooking & landing", tips: [
    { t: "Snapper: don't strike. Leave the rod in the holder (a baitrunner reel helps), engage and wind as the fish runs – the hook sets itself.", by: [L_HOW], species: ["snapper"], inGuide: true },
    { t: "Re-cast or re-bait every 5–10 minutes so fresh scent keeps going out.", by: [L_HOW], species: ["snapper"], inGuide: true },
    { t: "Whiting: when the bite goes quiet, hold the rod and strike rather than sitting back. Otherwise wait for the rod to load up, then lift smoothly.", by: [B_KGW, B_KGWG], species: ["king-george-whiting"], inGuide: true },
    { t: "Near the net a fish often makes a last dive – don't tighten the drag then; let the rod bend to soak up the lunge.", by: [L_HOW], species: ["snapper"] },
  ] },
  { id: "lures", icon: "🐠", title: "Lures (bream, perch, squid)", tips: [
    { t: "Bream and estuary perch: small soft plastics on light jig heads worked near the bottom or down the front of a snag; small hard-body lures work too. Don't overwork the lure – subtle twitches and pauses.", by: [L_WIN], species: ["black-bream", "estuary-perch"] },
    { t: "Estuary perch: Lee fishes around the top of the tide. Give each snag more than one or two casts – fish move between snags with the tide.", by: [L_EP], species: ["estuary-perch"] },
    { t: "Squid from land: size 3.0–3.5 jigs. Cast long, let it sink to the bottom, then give two sharp rips and wind between. Or hang a jig under a float just above the bottom.", by: [L_WIN], species: ["calamari"], inGuide: true },
  ] },
];

export const LEFT_OUT = "Left out: boat-only methods (sounders, trolling, anchoring), NSW-only fish and places, brand-name gear picks, and paid courses. Check the VFA before collecting bait like pipis or yabbies.";

export const tipsFor = (slug: string) => TIP_GROUPS.flatMap((g) => g.tips.filter((t) => t.species?.includes(slug) && !t.inGuide));
export const personOf = (id: string) => PEOPLE.find((p) => p.id === id)!;
