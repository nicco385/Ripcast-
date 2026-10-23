// Scenario checks for "Target a fish". Run: npm run test:target
import assert from "node:assert/strict";
import { planSpecies, dayOutlook, rateSpot, scoreHour, profile, nearSpots, betterNearby, BETTER_BY } from "../src/target";
import { spotAt, spotLabel } from "../src/where";
import { LAND, type Raw } from "../src/where";
import { dayStart, fmt } from "../src/astro";
import { TIDE_START, TIDE_END } from "../src/tides";
import { SRC, FACILITIES } from "../src/data/facilities";
import { AUDIT } from "../src/data/audit";
import { isOcc } from "../src/data/spots";

const TZ = "Australia/Melbourne", H = 3600000;
const at = (s: string) => new Date(s).getTime(); // ISO with offset
function wx(day: string, wind: number | ((h: number) => number), dir: number, wave: number | null = null): Record<string, Raw> {
  const t0 = dayStart(day, TZ), out: Record<string, Raw> = {};
  const t: string[] = [], w: number[] = [], g: number[] = [], d: number[] = [], wv: (number | null)[] = [];
  for (let i = 0; i < 48; i++) { const ti = t0 + i * H; t.push(fmt(ti, TZ).slice(0, 13) + ":00"); const k = typeof wind === "number" ? wind : wind(i); w.push(k); g.push(k * 1.4); d.push(dir); wv.push(wave); }
  for (const s of LAND) out[s.id] = { t, wind: w, gust: g, dir: d, wave: wave == null ? [] : wv };
  return out;
}
let n = 0; const ok = (name: string, f: () => void) => { f(); n++; console.log("✓", name); };
console.log(`tide data ${fmt(TIDE_START(), TZ)} → ${fmt(TIDE_END(), TZ)}`);

// 1. Calm summer day: garfish should be good, daytime, rising tide preferred
const feb = at("2027-02-10T07:00:00+11:00");
const g1 = planSpecies("garfish", wx("2027-02-10", 4, 0), { now: feb })!;
ok("calm Feb day → garfish Good/Great", () => { assert.match(g1.verdict, /Great|Good/); assert.match(g1.headline, /to target garfish/); });
ok("garfish best window is in daylight", () => { const h = Number(fmt(g1.spots[0].peak, TZ).slice(11, 13)); assert.ok(h >= 6 && h <= 20, `peak ${h}`); });

// 2. Blowing 25 kn westerly all day: garfish poor, headline says windy, top spot sheltered from the west
const g2 = planSpecies("garfish", wx("2027-02-10", 25, 270), { now: feb })!;
ok("25 kn westerly → garfish Poor, 'too windy'", () => { assert.equal(g2.verdict, "Poor"); assert.match(g2.headline, /windy/i); });
ok("windy: best garfish spot is sheltered from the west", () => assert.ok(g2.spots[0].spot.shelteredFrom.includes("W") || g2.spots[0].spot.info?.noWind, g2.spots[0].spot.name));
ok("calm beats windy for garfish", () => assert.ok(g1.spots[0].score > g2.spots[0].score + 15));

// 3. Spring snapper, 14 kn southerly: south-facing spots stirred up → good, evening/night
const oct = at("2026-10-21T12:00:00+11:00");
const s3 = planSpecies("snapper", wx("2026-10-21", 14, 180), { now: oct })!;
ok("Oct 14 kn southerly → snapper Good/Great", () => assert.match(s3.verdict, /Great|Good/));
ok("snapper headline mentions the southerly stirring the water", () => assert.match(s3.headline, /southerly.*stirring/i));
ok("snapper top spot faces the wind", () => assert.ok(s3.spots[0].spot.exposedTo.includes("S"), s3.spots[0].spot.name));
ok("snapper peak is dawn, dusk or night", () => { const h = Number(fmt(s3.spots[0].peak, TZ).slice(11, 13)); assert.ok(h >= 17 || h <= 8, `peak ${h}`); });
// 4. Same day dead calm: snapper still fishable but not better than the stirred-up day
const s4 = planSpecies("snapper", wx("2026-10-21", 3, 0), { now: oct })!;
ok("snapper: stirred-up southerly beats flat calm", () => assert.ok(s3.spots[0].score > s4.spots[0].score));
// 5. 30 kn gale: snapper Poor
const s5 = planSpecies("snapper", wx("2026-10-21", 30, 200), { now: oct })!;
ok("30 kn gale → snapper Poor/Fair, never Good", () => assert.match(s5.verdict, /Poor|Fair/));

// 6. Gummy shark: night beats day
const gp = profile("gummy-shark")!, merr = LAND.find((s) => s.species.includes("gummy-shark"))!, W6 = wx("2026-10-21", 8, 0)[merr.id];
ok("gummy: 10 pm scores higher than 1 pm", () => assert.ok(scoreHour(gp, merr, W6, at("2026-10-21T22:00:00+11:00")).score > scoreHour(gp, merr, W6, at("2026-10-21T13:00:00+11:00")).score));

// 7. No weather: never Good/Great, says so
const g7 = planSpecies("garfish", null, { now: feb })!;
ok("no weather → capped at Fair with a note", () => { assert.match(g7.verdict, /Fair|Poor/); assert.ok(g7.notes[0].includes("No wind forecast")); });

// 8. Out of season: garfish in September (VFA peak Nov–Jul) is marked down and explained
const sep = at("2026-09-15T12:00:00+10:00");
const g8 = planSpecies("garfish", wx("2026-09-15", 4, 0), { now: sep })!;
ok("garfish in September → note + lower score", () => { assert.ok(g8.notes.some((x) => x.includes("out of their main season"))); assert.ok(g8.spots[0].score < g1.spots[0].score); });

// 9. Big waves at rocky spots → flagged to avoid
const rocks = LAND.find((s) => s.type === "rocks" && s.facing != null)!;
const rk = scoreHour(profile("snapper")!, rocks, wx("2026-10-21", 12, rocks.facing!, 2.2)[rocks.id], at("2026-10-21T19:00:00+11:00"));
ok("2.2 m waves blowing onto rocks → avoid, score ≤ 25", () => { assert.ok(rk.avoid); assert.ok(rk.score <= 25); });

// 10. Squid like clear water: a strong onshore blow scores lower than calm
const sq = profile("calamari")!, stk = LAND.find((s) => s.id === "st-kilda-pier")!;
ok("squid: calm beats 18 kn onshore", () => assert.ok(scoreHour(sq, stk, wx("2026-10-21", 3, 0)[stk.id], at("2026-10-21T18:00:00+11:00")).score > scoreHour(sq, stk, wx("2026-10-21", 18, 180)[stk.id], at("2026-10-21T18:00:00+11:00")).score + 15));

// 11. Mulloway: rain bonus; night beats midday
const mp = profile("mulloway")!, ms = LAND.find((s) => s.species.includes("mulloway"))!, W11 = wx("2026-10-21", 8, 0)[ms.id];
ok("mulloway: after rain scores higher", () => assert.ok(scoreHour(mp, ms, W11, at("2026-10-21T21:00:00+11:00"), { rain24: 15 }).score > scoreHour(mp, ms, W11, at("2026-10-21T21:00:00+11:00"), { rain24: 0 }).score));

// 12. One engine: the day rating equals the best fish-and-spot from Target a fish over the same window and spots
const W12 = wx("2026-10-21", 10, 180), origin = { lat: -37.86, lon: 144.9 };
const d12 = dayOutlook(W12, "2026-10-21", { now: oct, origin });
const within = new Set(nearSpots(origin).map((s) => s.id));
const best12 = Math.max(...["snapper", "calamari", "silver-trevally", "black-bream", "sand-flathead"].map((sl) => planSpecies(sl, W12, { now: oct, from: d12.from, to: d12.to, within })?.spots[0]?.score ?? 0));
ok("Today rating = best Target-a-fish result (same engine)", () => assert.ok(d12.score >= best12 && d12.plans[0].spots[0].score === d12.score));
ok("Where rating for a spot matches Target a fish for its best fish", () => { const s = LAND.find((x) => x.id === "st-kilda-pier")!; const r = rateSpot(s, W12[s.id], d12.from, d12.to)!; const pl = planSpecies(r.profile.slug, W12, { now: oct, from: d12.from, to: d12.to, within: new Set([s.id]) })!; assert.equal(r.score, pl.spots[0].score); });

// 13. Rain: a showery day can't be Great or Good, even near the full moon
function wetWx(day: string): Record<string, Raw> { const w = wx(day, 6, 0); for (const k in w) { w[k].pop = w[k].t.map(() => 75); w[k].rain = w[k].t.map(() => 0.4); } return w; }
const fullMoonDay = "2026-10-26";
const dry = dayOutlook(wx(fullMoonDay, 6, 0), fullMoonDay, { now: at("2026-10-26T05:00:00+11:00"), origin });
const wet = dayOutlook(wetWx(fullMoonDay), fullMoonDay, { now: at("2026-10-26T05:00:00+11:00"), origin });
ok("drizzly full-moon day → Fair or worse, and below the dry day", () => { assert.match(wet.verdict, /Fair|Poor/); assert.ok(wet.showery); assert.ok(wet.score < dry.score); });
const heavy = (() => { const w = wx(fullMoonDay, 6, 0); for (const k in w) w[k].rain = w[k].t.map(() => 3); return dayOutlook(w, fullMoonDay, { now: at("2026-10-26T05:00:00+11:00"), origin }); })();
ok("steady rain → Poor or Fair", () => assert.match(heavy.verdict, /Fair|Poor/));
const damp = (() => { const w = wx(fullMoonDay, 6, 0); for (const k in w) { w[k].pop = w[k].t.map(() => 0); w[k].rain = w[k].t.map(() => 0); const i = w[k].t.findIndex((t) => t.endsWith("T15:00")); if (i >= 0) { w[k].pop![i] = 65; } } return dayOutlook(w, fullMoonDay, { now: at("2026-10-26T05:00:00+11:00"), origin }); })();
ok("one drizzly afternoon on a full-moon day → Good at best, never Great", () => { assert.equal(dry.verdict, "Great"); assert.notEqual(damp.verdict, "Great"); assert.ok(damp.damp); });

// 13. Species audit (21 Oct 2026): occasional species are labelled and never a top pick
import { SPOTS } from "../src/data/spots";
const sqA = planSpecies("calamari", wx("2027-04-15", 4, 0), { now: at("2027-04-15T04:00:00+10:00") })!;
ok("squid: Kerferd Road is only 'occasional' and capped at Fair", () => { const k = sqA.spots.find((x) => x.spot.id === "kerferd-pier")!; assert.ok(k.score <= 64); assert.ok(k.factors.some((f) => /occasional/.test(f.txt))); });
ok("squid: top pick is a proven squid spot", () => assert.ok(!sqA.spots[0].spot.occ?.includes("calamari"), sqA.spots[0].spot.name));
ok("squid never listed at river, estuary or lake spots", () => assert.ok(SPOTS.filter((s) => ["estuary", "river", "lake"].includes((s as { type?: string }).type ?? "") || s.info?.fresh).every((s) => !s.species.includes("calamari"))));
ok("every VFA hot-spot fish is in the spot's list", () => assert.ok(SPOTS.every((s) => (s.info?.hot ?? []).every((h) => s.species.includes(h)))));
const kgOct = planSpecies("king-george-whiting", wx("2026-10-24", 4, 0), { now: at("2026-10-24T04:00:00+11:00") })!;
ok("whiting in October (month before VFA season) is a shoulder month, not 'out of season'", () => { assert.ok(kgOct.spots[0].factors.some((f) => /Just outside/.test(f.txt))); assert.ok(kgOct.notes.some((n) => n.includes("just outside"))); });
const sqS = planSpecies("calamari", wx("2027-04-15", 21, 190), { now: at("2027-04-15T04:00:00+10:00") })!;
ok("21 kn southerly: squid at a sheltered north-facing pier is Fair at best, and the pick is sheltered", () => { assert.ok(sqS.spots[0].score <= 64); assert.ok(sqS.spots[0].spot.shelteredFrom.includes("S"), sqS.spots[0].spot.name); });

// 16. "Near" means near by road: a Williamstown map tap never picks Portarlington or Patterson River; Queenscliff never gets Sorrento
const wil = new Set(nearSpots({ lat: -37.867, lon: 144.913 }).map((s) => s.id)), qc = new Set(nearSpots({ lat: -38.267, lon: 144.661 }).map((s) => s.id));
ok("Williamstown map spot: no Portarlington or Patterson River in Today's picks", () => { assert.ok(!wil.has("portarlington-pier") && !wil.has("patterson-shore") && wil.has("gem-pier")); });
ok("Queenscliff: Sorrento (across the Heads) doesn't count as near", () => { assert.ok(!qc.has("sorrento-pier") && qc.has("queenscliff-pier")); });

// 17. Spot first: when the chosen place IS a spot, Today rates that spot (its own fish), and only notably better spots are offered
const ker = LAND.find((s) => s.id === "kerferd-pier")!;
ok("spotAt: same name, or a map tap within 300 m, is that spot; 1 km away is not", () => { assert.equal(spotAt({ name: ker.name, lat: ker.lat, lon: ker.lon })?.id, ker.id); assert.equal(spotAt({ name: "Near x", lat: ker.lat + 0.001, lon: ker.lon })?.id, ker.id); assert.equal(spotAt({ name: "Near x", lat: ker.lat + 0.01, lon: ker.lon }), undefined); });
const kd = dayOutlook(W12, "2026-10-21", { now: oct, origin: ker, only: ker, n: 5 }), ka = dayOutlook(W12, "2026-10-21", { now: oct, origin: ker, n: 8 });
ok("Today at Kerferd Road Pier: every pick is at Kerferd Road Pier and is one of its fish", () => { assert.ok(kd.plans.length > 0); for (const pl of kd.plans) { assert.equal(pl.spots[0].spot.id, ker.id); assert.ok(ker.species.includes(pl.profile.slug)); } });
ok("Nearby alternatives are other spots and at least BETTER_BY points better", () => { for (const b of betterNearby(ker, kd.score, ka)) { assert.notEqual(b.s.spot.id, ker.id); assert.ok(b.s.score >= kd.score + BETTER_BY); } });
ok("spotLabel: no double brackets", () => assert.equal(spotLabel("Ferguson Street Pier (Williamstown)"), "Ferguson Street Pier, Williamstown"));

// 18. Local-angler spots (v1.4.8): Webb Dock, Hampton, Williamstown, Sandringham rocks, Princes/Lagoon piers, Black Rock, Beaumaris
const NEWIDS = ["webb-dock-rocks", "hampton-groynes", "williamstown-rocks", "sandringham-breakwater", "princes-pier", "lagoon-pier", "black-rock-jetty", "beaumaris-pier"];
const L = (id: string) => LAND.find((x) => x.id === id)!;
ok("8 new spots exist, sit on the bay (not inland) and have fish, access and an evidence note for every fish", () => {
  for (const id of NEWIDS) { const x = L(id); assert.ok(x, id); assert.ok(x.lat < -37.8 && x.lat > -38.05 && x.lon > 144.9 && x.lon < 145.06, id); assert.ok(x.species.length >= 3 && x.access.length > 30, id);
    for (const sp of x.species) assert.ok(AUDIT[id]?.why?.[sp], `${id}/${sp} has no evidence note`); assert.ok((x.info?.sources?.length ?? 0) >= 2, id + " sources"); }
});
ok("every source key used by a spot or its facilities exists in the source list", () => {
  for (const id of NEWIDS.concat("hampton-pier")) { for (const k of L(id).info?.sources ?? []) assert.ok(SRC[k]?.u.startsWith("https://"), `${id}: ${k}`); for (const k of FACILITIES[id]?.src ?? []) assert.ok(SRC[k], `${id} facilities: ${k}`); }
});
ok("rock grounds are typed rocks; every new spot's exposed and sheltered winds don't overlap", () => {
  for (const id of ["webb-dock-rocks", "hampton-groynes", "williamstown-rocks", "sandringham-breakwater"]) assert.equal(L(id).type, "rocks", id);
  for (const id of NEWIDS) assert.ok(!L(id).exposedTo.some((d) => L(id).shelteredFrom.includes(d)), id);
});
ok("Hampton Pier pin is at the rebuilt pier inside Sandringham Harbour, not inland in Hampton village", () => { const h = L("hampton-pier"); assert.ok(Math.abs(h.lat + 37.9448) < 0.003 && h.lon < 144.998 && h.lon > 144.99, `${h.lat},${h.lon}`); assert.ok(!/Willis/.test(JSON.stringify(FACILITIES["hampton-pier"])), "old Willis St note gone"); });
ok("Webb Dock tells the truth about port access: working port, public trail only, no crossing barriers", () => {
  const x = L("webb-dock-rocks"); assert.match(x.info!.notice!, /working port/i); assert.match(x.info!.notice!, /barrier|fence|gate/i); assert.match(x.info!.notice!, /trail/i); assert.ok((x.info!.hazards ?? []).length >= 3);
  assert.ok(x.info!.sources!.includes("pomVisit") && x.info!.sources!.includes("pomMap"));
});
ok("unknown facts are marked Not known, not guessed (Webb Dock toilets and lights, Hampton groynes lights)", () => { assert.equal(FACILITIES["webb-dock-rocks"].toilets.has, "unknown"); assert.equal(FACILITIES["webb-dock-rocks"].lights.has, "unknown"); assert.equal(FACILITIES["hampton-groynes"].lights.has, "unknown"); assert.equal(FACILITIES["beaumaris-pier"].lights.has, "unknown"); });
ok("occasional fish are marked occasional (and only fish the spot lists)", () => {
  assert.ok(isOcc(L("webb-dock-rocks"), "mulloway") && isOcc(L("hampton-groynes"), "calamari") && isOcc(L("beaumaris-pier"), "snapper") && !isOcc(L("webb-dock-rocks"), "snapper"));
  for (const id of NEWIDS) for (const o of L(id).occ ?? []) assert.ok(L(id).species.includes(o), `${id}: ${o}`);
});
// engine: calm spring night, snapper
const calmN = wx("2026-10-24", 4, 315), calmNow = at("2026-10-24T12:00:00+11:00");
const sn = planSpecies("snapper", calmN, { now: calmNow, within: new Set(LAND.filter((x) => Math.hypot(x.lat + 37.87, x.lon - 144.92) < 0.08).map((x) => x.id)) })!;
const rank = (id: string) => sn.spots.findIndex((x) => x.spot.id === id);
ok("calm night snapper: Webb Dock rock wall is offered, and ranks above Ferguson Street Pier", () => { assert.ok(rank("webb-dock-rocks") >= 0 && rank("webb-dock-rocks") < 3, `rank ${rank("webb-dock-rocks")}`); assert.ok(rank("ferguson-street-pier") < 0 || rank("webb-dock-rocks") < rank("ferguson-street-pier")); });
ok("local adjustment shows as a reason: Webb Dock +6 'Local favourite', Ferguson Street Pier snapper marked quieter than its listing", () => {
  assert.ok(sn.spots[rank("webb-dock-rocks")].factors.some((f) => f.pts === 6 && /Local favourite/.test(f.txt)));
  const fs = planSpecies("snapper", calmN, { now: calmNow })!.spots.find((x) => x.spot.id === "ferguson-street-pier"); assert.ok(fs && fs.factors.some((f) => f.pts === -4 && /Quieter than its VFA listing/.test(f.txt)));
  assert.ok(fs!.factors.some((f) => f.txt.includes("VFA hot spot")), "still VFA hot");
});
ok("the spot is never dropped: Ferguson Street Pier is still in the snapper list", () => assert.ok(planSpecies("snapper", calmN, { now: calmNow })!.spots.some((x) => x.spot.id === "ferguson-street-pier")));
// engine: wind exposure matters per spot
const west = wx("2026-10-24", 22, 270), wp = planSpecies("snapper", west, { now: calmNow })!;
ok("22 kn westerly: Webb Dock (sheltered from the west) beats Hampton groynes and Sandringham rock wall (open to the west)", () => {
  const sc = (id: string) => wp.spots.find((x) => x.spot.id === id)?.score ?? 0; assert.ok(sc("webb-dock-rocks") > sc("hampton-groynes") + 5 && sc("webb-dock-rocks") > sc("sandringham-breakwater") + 5, [sc("webb-dock-rocks"), sc("hampton-groynes"), sc("sandringham-breakwater")].join());
});
const bigSea = wx("2026-10-24", 25, 180, 2.0);
ok("2 m waves on a southerly: exposed rock grounds are flagged as stay-off (Williamstown rocks face south-east)", () => {
  const pl = planSpecies("snapper", bigSea, { now: calmNow })!; const w = pl.spots.find((x) => x.spot.id === "williamstown-rocks"); assert.ok(!w || w.avoid || w.verdict === "Poor", w ? `${w.verdict} ${w.score}` : "absent");
});
ok("squid on a calm night: a pier with no confirmed lights (Beaumaris) is not ranked above Middle Brighton on a lights claim", () => {
  const sq = planSpecies("calamari", wx("2026-10-24", 4, 0), { now: calmNow })!; const b = sq.spots.find((x) => x.spot.id === "beaumaris-pier"), m = sq.spots.find((x) => x.spot.id === "middle-brighton"); assert.ok(b && m && b.score <= m.score, `${b?.score} vs ${m?.score}`);
});
ok("squid on rock groynes (Hampton) is occasional and never outranks a regular squid pier", () => {
  const sq = planSpecies("calamari", wx("2026-10-24", 4, 0), { now: calmNow })!; const i = sq.spots.findIndex((x) => x.spot.id === "hampton-groynes"), j = sq.spots.findIndex((x) => !isOcc(x.spot, "calamari") && x.verdict !== "Poor"); assert.ok(i < 0 || sq.spots.slice(0, i).some((x) => !isOcc(x.spot, "calamari")) || j < 0);
});
ok("Today at Webb Dock rates Webb Dock itself, with its own fish only", () => {
  const w = L("webb-dock-rocks"), o = dayOutlook(wx("2026-10-24", 5, 315), "2026-10-24", { now: calmNow, origin: w, only: w, n: 5 }); assert.ok(o.plans.length > 0); for (const pl of o.plans) { assert.equal(pl.spots[0].spot.id, w.id); assert.ok(w.species.includes(pl.profile.slug)); }
});

console.log("\nHeadlines:\n", [g1, g2, s3, s4, s5, g7, g8].map((p) => `  [${p.verdict}] ${p.headline}`).join("\n")," \n Day:", d12.verdict, d12.plans.map((p) => p.profile.name).join(", "), "| wet:", wet.verdict, "dry:", dry.verdict);
console.log(`\n${n} checks passed`);
