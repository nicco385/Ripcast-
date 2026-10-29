/** Tips from Roger Osborne Fishing (NSW). Paraphrased from his videos, checked Oct 2026.
 * Only tips that suit land-based fishing in Victoria are kept. */
export const ROGER = {
  channel: "https://www.youtube.com/@RogerOsborneFishing",
  site: "https://www.rogersfishing.com",
};
export type Tip = { t: string; src: string; title: string; species?: string[] };
export type TipGroup = { id: string; icon: string; title: string; note?: string; tips: Tip[] };
const V = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const READ = { src: V("7ZGO4qSiXk4"), title: "How to READ a BEACH (8 key points)" };
const RIGS = { src: V("I-At3GWOU-c"), title: "Beach Fishing Rigs – 6 killer rigs" };
const BAITS = { src: V("4ic2McqSamk"), title: "Best baits for beach fishing" };

export const TIP_GROUPS: TipGroup[] = [
  { id: "plan", icon: "🗓️", title: "Plan your trip", tips: [
    { t: "Check the forecast a few days ahead – wave height, wind strength, wind direction and the tide. If it's very rough or very windy, pick another day.", ...READ },
    { t: "Decide which fish you're after before you leave home. That decides your hook, sinker, line and bait.", ...READ },
    { t: "Best times: first light until just after sunrise, and the last hour before dark into the first hour of night. Overcast or rainy days can fish well all day; bright sun in the middle of the day is usually slow.", ...READ },
    { t: "If one time or spot doesn't work, try it again at another time. Every trip teaches you something.", src: V("qp3R1OrS6ew"), title: "Roger's #1 tip" },
  ] },
  { id: "beach", icon: "🌊", title: "Reading a beach", note: "Gutters and rips are for surf beaches (e.g. the ocean side of the Mornington Peninsula or Bellarine). Most Port Phillip Bay beaches are calm – see the last tip.", tips: [
    { t: "Sandbars are where the waves break. Gutters and holes are the deeper water between them.", ...READ },
    { t: "Waves stir up crabs, worms and other food on the sandbar and wash it over the edge into the deeper gutter. Cast onto the bar, wait a minute, then drag your bait just off the edge.", ...READ, species: ["king-george-whiting", "black-bream", "sand-flathead", "australian-salmon"] },
    { t: "Stay away from the rip itself – the current is too strong to hold the bottom. Fish the start (head) of the gutter where the current is gentler.", src: V("PG4WGpSQafo"), title: "How to use RIPS in beach fishing" },
    { t: "The rocky edge where a beach meets a headland holds food and fish – including whiting right next to the rocks, and bigger fish that hunt them.", ...READ, species: ["king-george-whiting", "mulloway"] },
    { t: "River and creek mouths are a food trap – small fish and prawns get flushed out, especially on a run-out tide.", ...READ, species: ["mulloway", "black-bream", "australian-salmon"] },
    { t: "When the wind blows from one end, fish the sheltered end of the beach near the headland – the far end gets strong sweep.", ...READ },
    { t: "Calm, flat beach with no gutters? The fish patrol right along the shore edge, so you don't need to cast far.", ...READ },
  ] },
  { id: "find", icon: "🔎", title: "Finding the fish", tips: [
    { t: "Don't just cast and wait. Make a long cast, then wind in a little at a time and pause. When you get a bite, cast back to that same spot.", ...READ },
    { t: "No bite after 5–10 minutes? Try left, right, or walk 20 metres along.", ...READ },
  ] },
  { id: "rigs", icon: "🪝", title: "Rigs", tips: [
    { t: "Running sinker rig: ball sinker on the main line, then a swivel, then a 40–50 cm leader to the hook. The line slides through the sinker so the fish doesn't feel the weight.", ...RIGS },
    { t: "Whiting: same rig with a long-shank hook (suits worms and yabbies). Roger's favourite whiting rig is a two-hook paternoster: star sinker on a snap swivel at the bottom, and two droppers with long-shank hooks about 50 cm apart.", ...RIGS, species: ["king-george-whiting"] },
    { t: "Bream: running sinker rig with a 3/0 hook – takes prawns, worms, yabbies, pilchard, fish strips or pipis.", ...RIGS, species: ["black-bream"] },
    { t: "Whole pilchard on ganged hooks with a short leader (about 15–20 cm) so it casts well. Good for salmon, flathead and mulloway.", ...RIGS, species: ["australian-salmon", "sand-flathead", "mulloway"] },
    { t: "Stinger rig for half a pilchard, a fish strip or squid: 4/0 main hook with a small size-4 'stinger' hook below, on a 35 cm leader. Catches bream, flathead, snapper and more.", ...RIGS, species: ["black-bream", "sand-flathead", "snapper"] },
    { t: "Mulloway: big 9/0 hook (add a 5/0 second hook for fish fillets or squid), star sinker that slides on its own short line, and 15 kg line all through.", ...RIGS, species: ["mulloway"] },
    { t: "Use a snap swivel on the sinker so you can swap to a heavier or lighter one as conditions change.", ...RIGS },
  ] },
  { id: "bait", icon: "🦐", title: "Baits & how to put them on", tips: [
    { t: "Pilchards (from tackle shops and servos) catch bream, flathead, salmon and mulloway. On ganged hooks, the top hook goes through the eye. Or cut one in half for two smaller baits.", ...BAITS },
    { t: "Half hitch: loop the line once around the end of the bait to hold it firm on the hook. Roger uses this on almost every bait.", ...BAITS },
    { t: "Fish strips (slabs): go in through the flesh and out the skin, and keep the hook point showing. For bream, shave the strip thin so the hook can still bite.", ...BAITS, species: ["black-bream", "sand-flathead", "snapper"] },
    { t: "Squid: a small tapered strip (about 5 cm) for bream; a long strip (about 14 cm) on two big hooks for mulloway and snapper.", ...BAITS, species: ["black-bream", "mulloway", "snapper"] },
    { t: "Worms: feed the hook into the worm's mouth and thread it up the middle, keeping the hook in the centre.", ...BAITS, species: ["king-george-whiting"] },
    { t: "Yabbies / nippers: thread from the tail up the shank to the head, then add a half hitch. Cast gently – they're soft. Top bait for whiting and bream.", ...BAITS, species: ["king-george-whiting", "black-bream"] },
    { t: "Nippers: snap off the top part of the claw so it can't bite you, but leave the white claw on – it stands out in the water.", src: V("UIAEW7mPibI"), title: "How I rig my nipper bait" },
    { t: "Pumping yabbies: the first pull just gets you down to the right depth. Then push the pump to the bottom of the hole and take a full, slow pull – pulls two to four bring up most of the yabbies.", ...BAITS },
    { t: "Live poddy mullet: hook through the back, above the backbone, so it stays alive. Great for mulloway and big flathead.", ...BAITS, species: ["mulloway", "sand-flathead"] },
  ] },
  { id: "flathead", icon: "🐟", title: "Flathead", tips: [
    { t: "Look for sand where shallow water drops into deeper water. Flathead sit on sand, often right beside weed – not on top of the weed.", src: V("MI3mwvCziyE"), title: "The BEST spot to fish for flathead", species: ["sand-flathead"] },
    { t: "Check Google Earth before you go to find shallow sandy edges you can reach from shore. Low light is the best time.", src: V("MI3mwvCziyE"), title: "The BEST spot to fish for flathead", species: ["sand-flathead"] },
  ] },
];

export const LEFT_OUT = "Left out: NSW-only fish (sand whiting, tailor, luderick), NSW places, and his beach-worming lessons (a paid course on his website). Victoria has its own rules on collecting bait like pipis and yabbies – check the VFA before you collect.";

export const tipsFor = (slug: string) => TIP_GROUPS.flatMap((g) => g.tips.filter((t) => t.species?.includes(slug)));
