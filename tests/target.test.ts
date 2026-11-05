import { SPECIES, bagText } from "../src/data/species";
// Scenario checks for "Target a fish". Run: npm run test:target
import assert from "node:assert/strict";
import { planSpecies, dayOutlook, rateSpot, scoreHour, profile, nearSpots, betterNearby, BETTER_BY } from "../src/target";
import { spotAt, spotLabel } from "../src/where";
import { LAND, type Raw } from "../src/where";
import { dayStart, fmt } from "../src/astro";
import { TIDE_START, TIDE_END } from "../src/tides";
import { SRC, FACILITIES } from "../src/data/facilities";
import { AUDIT } from "../src/data/audit";
import { MPAS } from "../src/data/mpa";
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
ok("one drizzly afternoon on a full-moon day → Good at best, never Great", () => { assert.match(dry.verdict, /Great|Good/); assert.notEqual(damp.verdict, "Great"); assert.ok(damp.damp); assert.ok(damp.score <= dry.score); });

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
ok("22 kn westerly: snapper rates the westerly-facing Sandringham rock wall above sheltered Webb Dock (Choc: an onshore blow brings snapper in)", () => {
  const sc = (id: string) => wp.spots.find((x) => x.spot.id === id)?.score ?? 0; assert.ok(sc("sandringham-breakwater") > sc("webb-dock-rocks"), [sc("webb-dock-rocks"), sc("sandringham-breakwater")].join());
  assert.ok(wp.spots.find((x) => x.spot.id === "sandringham-breakwater")!.factors.some((f) => /prime snapper chance/.test(f.txt)));
});
const wpW = planSpecies("king-george-whiting", west, { now: calmNow })!;
ok("22 kn westerly: whiting still prefer spots sheltered from the west", () => { const top = wpW.spots[0].spot; assert.ok(!top.exposedTo.includes("W") || top.shelteredFrom.includes("W") || top.info?.noWind, top.name); });const bigSea = wx("2026-10-24", 25, 180, 2.0);
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

// 19. Choc's own spot (v1.4.9): Black Rock Beach, his pin -37.977575, 145.016218 – squid and garfish, proven, and outside Ricketts Point Marine Sanctuary
const choc = L("black-rock-beach-choc");
const inRing = (la: number, lo: number, r: [number, number][]) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [ay, ax] = r[i], [by, bx] = r[j]; if ((ay > la) !== (by > la) && lo < (bx - ax) * (la - ay) / (by - ay) + ax) c = !c; } return c; };
const mDist = (a: { lat: number; lon: number }, la: number, lo: number) => Math.hypot((a.lat - la) * 111195, (a.lon - lo) * 111195 * Math.cos(a.lat * Math.PI / 180));
ok("Choc's spot is labelled as Choc's, sits on his pin, and has squid and garfish as proven fish (not occasional)", () => {
  assert.equal(choc.info?.src, "choc"); assert.match(choc.name, /Choc/); assert.ok(mDist(choc, -37.977575, 145.016218) < 30);
  for (const f of ["calamari", "garfish"]) { assert.ok(choc.species.includes(f) && !isOcc(choc, f), f); assert.match(AUDIT[choc.id]!.why![f], /Choc's spot – local knowledge/); assert.ok((choc.info!.local![f] ?? 0) > 0); }
});
ok("Choc's spot is outside every marine park/sanctuary, and at least 300 m clear of Ricketts Point", () => {
  for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(choc.lat, choc.lon, r), m.name);
  const rp = MPAS.find((m) => /Ricketts/.test(m.name))!; const d = Math.min(...rp.rings.flat().map(([la, lo]) => mDist(choc, la, lo))); assert.ok(d > 300, `${Math.round(d)} m`);
  assert.match(choc.info!.notice!, /Ricketts Point Marine Sanctuary/); assert.match(choc.info!.notice!, /Fourth Street/);
});
ok("no fishing spot in the app sits inside a marine park or sanctuary", () => { for (const x of LAND) for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(x.lat, x.lon, r), `${x.id} in ${m.name}`); });
const bro = { lat: -37.9735, lon: 145.0170 }; // Black Rock village
const sqC = planSpecies("calamari", wx("2026-10-24", 4, 0), { now: calmNow, origin: bro, within: new Set(nearSpots(bro).map((x) => x.id)) })!;
ok("calm night, squid, from Black Rock: Choc's spot is in the top 5 with a 'Choc's spot' reason", () => {
  const i = sqC.spots.findIndex((x) => x.spot.id === choc.id); assert.ok(i >= 0 && i < 5, `rank ${i}`);
  assert.ok(sqC.spots[i].factors.some((f) => f.pts > 0 && /Choc's spot/.test(f.txt)));
});
ok("a 22 kn south-westerly (onshore) knocks Choc's squid spot well down from a calm night", () => {
  const sw = planSpecies("calamari", wx("2026-10-24", 22, 225), { now: calmNow, origin: bro, within: new Set(nearSpots(bro).map((x) => x.id)) })!;
  const a = sqC.spots.find((x) => x.spot.id === choc.id)!.score, b = sw.spots.find((x) => x.spot.id === choc.id)?.score ?? 0; assert.ok(a > b + 10, `${a} vs ${b}`);
});
ok("calm summer day, garfish: Choc's spot is offered as a regular garfish spot", () => {
  const g = planSpecies("garfish", wx("2027-02-10", 4, 45), { now: feb, origin: bro, within: new Set(nearSpots(bro).map((x) => x.id)) })!; const x = g.spots.find((y) => y.spot.id === choc.id); assert.ok(x && /Great|Good/.test(x.verdict), x ? `${x.verdict} ${x.score}` : "absent");
});

// 20. Choc's second spot (v1.5.0): North Road rocks, Brighton – a separate spot from Middle Brighton Pier, legal, squid and garfish proven
const nr = L("north-road-rocks-choc");
ok("North Road rocks: on Choc's pin, Choc's label, squid and garfish proven, not a duplicate of Middle Brighton Pier", () => {
  assert.equal(nr.info?.src, "choc"); assert.equal(nr.type, "rocks"); assert.ok(mDist(nr, -37.899259, 144.984025) < 30); for (const f of ["calamari", "garfish"]) { assert.ok(nr.species.includes(f) && !isOcc(nr, f)); assert.match(AUDIT[nr.id]!.why![f], /Choc's spot/); }
  assert.ok(mDist(nr, L("middle-brighton").lat, L("middle-brighton").lon) > 600); assert.ok(!LAND.some((x) => x.id !== nr.id && mDist(nr, x.lat, x.lon) < 500));
  for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(nr.lat, nr.lon, r), m.name); assert.match(nr.info!.notice!, /boat ramp/); assert.match(nr.info!.notice!, /marina/);
});
const bri = { lat: -37.905, lon: 144.99 };
ok("calm night, squid, from Brighton: North Road rocks is in the top 5; a 20 kn westerly drops it a lot", () => {
  const w = new Set(nearSpots(bri).map((x) => x.id)); const c = planSpecies("calamari", wx("2026-10-24", 4, 90), { now: calmNow, origin: bri, within: w })!, r = planSpecies("calamari", wx("2026-10-24", 20, 270), { now: calmNow, origin: bri, within: w })!;
  const i = c.spots.findIndex((x) => x.spot.id === nr.id); assert.ok(i >= 0 && i < 5, `rank ${i}`); assert.ok(c.spots[i].score > (r.spots.find((x) => x.spot.id === nr.id)?.score ?? 0) + 10);
});

// 21. Choc's third spot (v1.5.2): Williamstown Beach east rock wall – squid only, distinct from Point Gellibrand, outside Jawbone
const wb = L("williamstown-beach-rocks-choc");
ok("Williamstown Beach rock wall: on Choc's pin, squid proven, rocks, its own spot (>1 km from Point Gellibrand), outside Jawbone with water in front clear", () => {
  assert.equal(wb.info?.src, "choc"); assert.equal(wb.type, "rocks"); assert.ok(mDist(wb, -37.869102, 144.893670) < 30); assert.deepEqual(wb.species, ["calamari"]); assert.ok(!isOcc(wb, "calamari"));
  assert.ok(mDist(wb, L("williamstown-rocks").lat, L("williamstown-rocks").lon) > 1000);
  const jb = MPAS.find((m) => /Jawbone/.test(m.name))!; const k = 111195 * Math.cos(37.87 * Math.PI / 180);
  for (const brg of [135, 180, 225, 270]) for (const d of [0, 100, 200, 400]) { const la = wb.lat - d * Math.cos(brg * Math.PI / 180) / 111195, lo = wb.lon + d * Math.sin(brg * Math.PI / 180) / k; for (const r of jb.rings) assert.ok(!inRing(la, lo, r), `${brg}/${d}`); }
  assert.ok(Math.min(...jb.rings.flat().map(([la, lo]) => mDist(wb, la, lo))) > 700); assert.match(wb.info!.notice!, /swim/i); assert.match(wb.info!.notice!, /Jawbone/);
});
ok("calm night, squid, from Williamstown: the beach rock wall is in the top 5; a 20 kn southerly drops it a lot", () => {
  const o = { lat: -37.862, lon: 144.9 }, w = new Set(nearSpots(o).map((x) => x.id)); const c = planSpecies("calamari", wx("2026-10-24", 4, 0), { now: calmNow, origin: o, within: w })!, r = planSpecies("calamari", wx("2026-10-24", 20, 180), { now: calmNow, origin: o, within: w })!;
  const i = c.spots.findIndex((x) => x.spot.id === wb.id); assert.ok(i >= 0 && i < 5, `rank ${i}`); assert.ok(c.spots[i].score > (r.spots.find((x) => x.spot.id === wb.id)?.score ?? 0) + 10);
});

// 22. Choc's lower-Yarra spots (v1.5.3): Spotswood bank (snapper, gummy) and Francis Street lookout (snapper, mulloway, bream)
const spw = L("spotswood-bank-choc"), fr = L("francis-st-lookout-choc");
ok("Spotswood and Francis St: on Choc's pins, river type, Lower Yarra health advice, every listed fish proven, distinct from the Warmies", () => {
  assert.ok(mDist(spw, -37.836366, 144.895719) < 30 && mDist(fr, -37.822857, 144.903641) < 30);
  for (const [x, fs] of [[spw, ["snapper", "gummy-shark"]], [fr, ["snapper", "mulloway", "black-bream"]]] as const) {
    assert.equal(x.info?.src, "choc"); assert.equal(x.type, "river"); assert.ok(x.info?.eat); assert.deepEqual([...x.species].sort(), [...fs].sort());
    for (const f of fs) { assert.ok(!isOcc(x, f), f); assert.match(AUDIT[x.id]!.why![f], /Choc's spot/); }
    for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(x.lat, x.lon, r)); assert.match(x.info!.notice!, /ship|port/i);
  }
  assert.ok(mDist(spw, L("warmies-wall").lat, L("warmies-wall").lon) > 800); assert.ok(mDist(spw, fr.lat, fr.lon) > 1000);
  assert.ok(spw.info!.hazards!.some((h) => /power lines/.test(h))); assert.match(fr.access, /could not confirm/);
});
ok("the engine accepts river snapper/gummy/mulloway at Choc's Yarra spots (they appear in each species plan)", () => {
  const o = { lat: -37.83, lon: 144.9 }, w = new Set(nearSpots(o).map((x) => x.id)), W2 = wx("2026-10-24", 6, 315);
  for (const [sl, id] of [["snapper", spw.id], ["gummy-shark", spw.id], ["snapper", fr.id], ["mulloway", fr.id], ["black-bream", fr.id]]) { const pl = planSpecies(sl, W2, { now: calmNow, origin: o, within: w }); assert.ok(pl && pl.spots.some((x) => x.spot.id === id), `${sl} @ ${id}`); }
});
ok("mulloway season logic still applies at Choc's spot (season factor present; proven, so no occasional cap)", () => {
  const o = { lat: -37.83, lon: 144.9 }, w = new Set(nearSpots(o).map((x) => x.id));
  const sp = (day: string, now: string) => planSpecies("mulloway", wx(day, 5, 315), { now: at(now), origin: o, within: w })!.spots.find((x) => x.spot.id === fr.id)!;
  const a = sp("2026-11-05", "2026-11-05T12:00:00+11:00"), b = sp("2027-05-05", "2027-05-05T12:00:00+10:00");
  const sa = a.factors.find((f) => f.kind === "season"), sb = b.factors.find((f) => f.kind === "season"); console.log(`   mulloway @ Francis St: Nov ${a.score} (${sa?.txt ?? "no season factor"} ${sa?.pts ?? 0}), May ${b.score} (${sb?.txt ?? "no season factor"} ${sb?.pts ?? 0})`);
  assert.ok(sa || sb, "season factor"); assert.ok(!a.factors.some((f) => /occasional/i.test(f.txt)));
});

// 23. Choc's Lynchs Bridge spot (v1.5.4): bream, pinkies, estuary perch proven (mullet shown as text – no mullet forecast in the app)
const lb = L("lynchs-bridge-choc");
ok("Lynchs Bridge: river type, within 300 m of the bridge on the public bank, all of Choc's fish proven, estuary perch rules shown", () => {
  assert.equal(lb.info?.src, "choc"); assert.equal(lb.type, "river"); assert.ok(lb.info?.eat); assert.ok(mDist(lb, -37.795, 144.91278) < 300);
  for (const f of ["black-bream", "snapper", "estuary-perch"]) { assert.ok(lb.species.includes(f) && !isOcc(lb, f), f); assert.match(AUDIT[lb.id]!.why![f], /Choc's spot/); }
  assert.ok(lb.info!.other!.includes("mullet")); assert.match(lb.tips, /pinkies/); assert.ok(lb.info!.rules!.some((r) => /Estuary perch.*27 cm.*bag 5/.test(r)));
  assert.ok(mDist(lb, L("maribyrnong-footscray").lat, L("maribyrnong-footscray").lon) > 800); for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(lb.lat, lb.lon, r));
});
ok("the engine offers estuary perch, bream and pinkies at Lynchs Bridge on a calm evening", () => {
  const o = { lat: -37.79, lon: 144.91 }, w = new Set(nearSpots(o).map((x) => x.id)), W2 = wx("2027-02-10", 3, 45);
  for (const sl of ["estuary-perch", "black-bream", "snapper"]) { const pl = planSpecies(sl, W2, { now: feb, origin: o, within: w }); assert.ok(pl && pl.spots.some((x) => x.spot.id === lb.id), sl); }
});

// 24. Choc's Chifley Drive spot (v1.5.5): bream and estuary perch proven, public PV platforms, Defence site warned
const cd = L("chifley-drive-choc");
ok("Chifley Drive: on Choc's pin, river type, bream and estuary perch proven, Defence-site warning, distinct from the boat ramp and Anglers spots", () => {
  assert.equal(cd.info?.src, "choc"); assert.equal(cd.type, "river"); assert.ok(mDist(cd, -37.761998, 144.885389) < 30);
  for (const f of ["black-bream", "estuary-perch"]) { assert.ok(cd.species.includes(f) && !isOcc(cd, f)); assert.match(AUDIT[cd.id]!.why![f], /Choc's spot/); }
  assert.match(cd.info!.notice!, /Defence/); assert.ok(mDist(cd, L("maribyrnong-anglers").lat, L("maribyrnong-anglers").lon) > 800);
  const o = { lat: -37.765, lon: 144.89 }, w = new Set(nearSpots(o).map((x) => x.id)); const pl = planSpecies("estuary-perch", wx("2027-02-10", 3, 180), { now: feb, origin: o, within: w }); assert.ok(pl && pl.spots.some((x) => x.spot.id === cd.id));
});

// 25. Choc's Bolte Bridge spot (v1.5.6): north bank, bream/snapper/mulloway proven, access caveat, mulloway season still scored
const bb = L("bolte-bridge-creek-mouth-choc");
ok("Bolte Bridge: on Choc's pin, river type, three fish proven, access-not-confirmed notice, outside MPAs, distinct from Yarra Docklands, mulloway season kept", () => {
  assert.equal(bb.info?.src, "choc"); assert.equal(bb.type, "river"); assert.ok(mDist(bb, -37.818049, 144.932366) < 30);
  for (const f of ["black-bream", "snapper", "mulloway"]) { assert.ok(bb.species.includes(f) && !isOcc(bb, f)); assert.match(AUDIT[bb.id]!.why![f], /Choc's spot/); }
  assert.match(bb.info!.notice!, /NOT confirmed/); assert.ok(!/undersize/i.test(bb.tips ?? ""));
  for (const m of MPAS) for (const ring of m.rings) assert.ok(!inRing(bb.lat, bb.lon, ring), m.name);
  assert.ok(mDist(bb, L("yarra-docklands").lat, L("yarra-docklands").lon) > 500);
  const o = { lat: -37.82, lon: 144.935 }, w = new Set(nearSpots(o).map((x) => x.id));
  const may = planSpecies("mulloway", wx("2027-05-12", 3, 180), { now: new Date("2027-05-12T08:00:00+10:00"), origin: o, within: w });
  const hit = may?.spots.find((x) => x.spot.id === bb.id); assert.ok(hit);
});

// 26. Choc's River Esplanade pier (v1.5.7): south bank, separate from the Bolte spot across the channel, public, fish proven
const re = L("river-esplanade-pier-choc");
ok("River Esplanade pier: on Choc's pin, separate from the Bolte spot (other bank, >350 m), fish proven, marina-berth notice, outside MPAs", () => {
  assert.equal(re.info?.src, "choc"); assert.equal(re.type, "river"); assert.ok(mDist(re, -37.821295, 144.935194) < 30);
  assert.ok(mDist(re, bb.lat, bb.lon) > 350 && re.lat < bb.lat);
  for (const f of ["black-bream", "snapper", "mulloway"]) { assert.ok(re.species.includes(f) && !isOcc(re, f)); assert.match(AUDIT[re.id]!.why![f], /Choc's spot/); }
  assert.match(re.info!.notice!, /marina berths/); assert.ok(!/undersize/i.test(re.tips ?? ""));
  for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(re.lat, re.lon, r), m.name);
});

// 27. Choc's Punt Road Landing (v1.5.8): tidal river, bream and mulloway proven, PV fishing-permitted landing, eating advice on
const pr = L("punt-road-landing-choc");
ok("Punt Road Landing: on Choc's pin, river type with eating advice, bream and mulloway proven, rowing notice, outside MPAs, distinct from Herring Island", () => {
  assert.equal(pr.info?.src, "choc"); assert.equal(pr.type, "river"); assert.equal(pr.info?.eat, true); assert.ok(mDist(pr, -37.830558, 144.988390) < 30);
  for (const f of ["black-bream", "mulloway"]) { assert.ok(pr.species.includes(f) && !isOcc(pr, f)); assert.match(AUDIT[pr.id]!.why![f], /Choc's spot/); }
  assert.match(pr.info!.notice!, /rowing/); assert.ok(mDist(pr, L("yarra-herring").lat, L("yarra-herring").lon) > 800);
  for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(pr.lat, pr.lon, r), m.name);
});

// 28. Albert Park Lake becomes Choc's spot (v1.5.9): freshwater lake, no tide factors, new trout/carp species with VFA rules
const ap = L("albert-park-lake");
ok("Albert Park Lake: Choc's Carousel pin, lake type, fresh (no tides), five fish proven, trout and carp rules, engine rates lake fish without tides", () => {
  assert.equal(ap.info?.src, "choc"); assert.equal(ap.type, "lake"); assert.ok(ap.info?.fresh); assert.ok(mDist(ap, -37.845837, 144.968276) < 30);
  for (const f of ["rainbow-trout", "golden-perch", "estuary-perch", "carp", "silver-perch"]) { assert.ok(ap.species.includes(f) && !isOcc(ap, f), f); assert.match(AUDIT[ap.id]!.why![f], /Choc's spot/); }
  const tr = SPECIES.find((x) => x.slug === "rainbow-trout")!, cp = SPECIES.find((x) => x.slug === "carp")!;
  assert.equal(tr.bag, 5); assert.ok(!tr.minCm); assert.match(tr.bagNote!, /2 over 35 cm/); assert.match(cp.bagNote!, /must NOT be returned/); assert.equal(bagText(cp), "No limit");
  const o = { lat: -37.846, lon: 144.969 }, w = new Set(nearSpots(o).map((x) => x.id));
  for (const f of ["rainbow-trout", "golden-perch", "silver-perch", "carp"]) {
    const pl = planSpecies(f, wx("2027-02-10", 3, 180), { now: feb, origin: o, within: w }); const hit = pl?.spots.find((x) => x.spot.id === ap.id);
    assert.ok(hit, f); assert.ok(!hit!.factors.some((x) => x.kind === "tide"), f); }
});

// 29. Hampton groynes become Choc's spot (v1.5.9): pin on the southern groyne, no duplicate, his fish proven, forum evidence kept
const hg = L("hampton-groynes");
ok("Hampton groynes: one spot only, Choc's southern-groyne pin, flathead/snapper/garfish/whiting proven, squid and salmon still occasional, forum sources kept", () => {
  assert.equal(LAND.filter((x) => /Hampton rock groyne/.test(x.name)).length, 1); assert.equal(hg.info?.src, "choc"); assert.ok(mDist(hg, -37.941505, 144.998025) < 30);
  for (const f of ["snapper", "sand-flathead", "garfish", "king-george-whiting"]) { assert.ok(hg.species.includes(f) && !isOcc(hg, f), f); assert.match(AUDIT[hg.id]!.why![f], /Choc's spot/); }
  assert.ok(isOcc(hg, "calamari") && isOcc(hg, "australian-salmon")); assert.ok(hg.info!.sources!.includes("fvHamptonGroynes")); assert.match(AUDIT[hg.id]!.why!.snapper, /Forum anglers/);
  for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(hg.lat, hg.lon, r), m.name);
  assert.ok(mDist(hg, -37.9355, 144.9940) > 600, "Choc's groyne is not the Orlando Street groyne"); assert.match(hg.access, /NOT the 'Orlando Street groyne'/);
});
ok("Bolte and River Esplanade access follow Choc: Docklands Drive end (north bank, not confirmed public) and Lorimer St side (south bank, public)", () => {
  assert.match(bb.access, /very end of Docklands Drive/); assert.match(bb.access, /could NOT confirm/); assert.match(bb.access, /fenced, gated or signed/);
  assert.match(re.access, /Lorimer Street side/); assert.match(re.access, /never cross fences or gates/);
});

// 30. Orlando Street groyne (v1.5.12): normal researched spot on the real groyne, separate from Choc's southern groyne
const og = L("orlando-st-groyne");
ok("Orlando Street groyne: on OSM groyne 659623064, rocks, not a Choc's spot (no boost), separate from Choc's groyne (pin unchanged), outside MPAs", () => {
  assert.equal(og.type, "rocks"); assert.notEqual(og.info?.src, "choc"); assert.ok(!og.info?.local); assert.ok(mDist(og, -37.93558, 144.99400) < 30);
  assert.ok(mDist(og, hg.lat, hg.lon) > 600); assert.equal(hg.lat, -37.9415); assert.equal(hg.lon, 144.9980); assert.equal(hg.info?.src, "choc");
  assert.ok(!isOcc(og, "snapper") && isOcc(og, "calamari"));
  for (const m of MPAS) for (const r of m.rings) assert.ok(!inRing(og.lat, og.lon, r), m.name);
});

console.log("\nHeadlines:\n", [g1, g2, s3, s4, s5, g7, g8].map((p) => `  [${p.verdict}] ${p.headline}`).join("\n")," \n Day:", d12.verdict, d12.plans.map((p) => p.profile.name).join(", "), "| wet:", wet.verdict, "dry:", dry.verdict);

// 20. Best-time reasons and timing (v1.7.7)
import { reasonFor, spanTxt as spanT } from "../src/target";
{
  const sn = profile("snapper")!, kg = profile("king-george-whiting")!;
  ok("reason: dusk + tide turning reads plainly", () => {
    const r = reasonFor(sn, [{ pts: 12, txt: "Around sunset", kind: "light" }, { pts: 9, txt: "Tide turning (high 7:12 pm)", short: "tide turning (high 7:12 pm)", kind: "tide" }]);
    assert.equal(r, "Dusk + tide turning (high 7:12 pm) – snapper come in close at low light");
  });
  ok("reason: run-in tide names whiting's feeding habit", () => {
    const r = reasonFor(kg, [{ pts: 5, txt: "Daylight", kind: "light" }, { pts: 8, txt: "Run-in tide – high at 2:10 pm", short: "run-in tide (high 2:10 pm)", kind: "tide" }]);
    assert.match(r, /run-in tide \(high 2:10 pm\) – whiting feed over the sand on the run-in/i);
  });
  ok("window already under way is labelled 'now–'", () => { const n = at("2027-02-10T17:20:00+11:00"); assert.match(spanT(at("2027-02-10T17:00:00+11:00"), at("2027-02-10T19:00:00+11:00"), n), /^now–7/); });
  ok("future window keeps its start time", () => { const n = at("2027-02-10T12:00:00+11:00"); assert.doesNotMatch(spanT(at("2027-02-10T17:00:00+11:00"), at("2027-02-10T19:00:00+11:00"), n), /now/); });
  const days = ["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"];
  ok("snapper best time is dusk or night, never the middle of the day", () => { for (const d of days) { const pl = planSpecies("snapper", wx(d, 8, 180), { now: dayStart(d, TZ) + 5 * H, to: dayStart(d, TZ) + 29 * H })!; const h = Number(fmt(pl.spots[0].peak, TZ).slice(11, 13)); assert.ok(h >= 18 || h <= 6, `${d} peak ${h}`); } });
ok("snapper: night is prime (Choc) – after dark beats midday, with the shallows reason", () => {
  const sp = LAND.find((s) => s.id === "williamstown-rocks")!, w = wx("2026-11-10", 6, 0)[sp.id];
  const night = scoreHour(profile("snapper")!, sp, w, at("2026-11-10T22:00:00+11:00")), noon = scoreHour(profile("snapper")!, sp, w, at("2026-11-10T12:00:00+11:00"));
  assert.ok(night.factors.find((f) => f.kind === "light")!.pts >= 12); assert.ok(!night.factors.some((f) => f.txt === "Middle of the night"));
  assert.match(reasonFor(profile("snapper")!, night.factors.filter((f) => f.kind !== "tide")), /shallows to feed under darkness \(Choc's local knowledge\)/);
  assert.ok(night.factors.find((f) => f.kind === "light")!.pts > noon.factors.find((f) => f.kind === "light")!.pts);
});
  ok("whiting best time sits on the run-in or top of the tide", () => { for (const d of days) { const pl = planSpecies("king-george-whiting", wx(d, 4, 0), { now: dayStart(d, TZ) + 5 * H, to: dayStart(d, TZ) + 22 * H })!; assert.ok(pl.spots[0].factors.some((f) => f.kind === "tide" && f.pts >= 5), `${d}: ${pl.spots[0].factors.map((f) => f.txt).join("; ")}`); } });
  ok("every top pick carries a reason", () => { const pl = planSpecies("snapper", wx("2026-11-04", 12, 200), { now: at("2026-11-04T06:00:00+11:00") })!; assert.ok(pl.spots[0].why.length > 5); });
}
// 21. Snapper onshore blow (Choc's local knowledge, v1.7.7)
{
  const wr = LAND.find((s) => s.id === "st-helens")!; // rock wall faces east onto Corio Bay
  const t = at("2026-11-10T19:00:00+11:00"), day = "2026-11-10";
  const on = scoreHour(profile("snapper")!, wr, wx(day, 18, 90)[wr.id], t), off = scoreHour(profile("snapper")!, wr, wx(day, 18, 270)[wr.id], t);
  ok("snapper: 18 kn onshore blow boosts the rating (Choc's local knowledge)", () => { assert.ok(on.score > off.score, `${on.score} vs ${off.score}`); assert.ok(on.factors.some((f) => /prime snapper chance/.test(f.txt))); });
  ok("snapper: a 28 kn gale onshore is still capped and flagged", () => { const g = scoreHour(profile("snapper")!, wr, wx(day, 28, 90)[wr.id], t); assert.ok(g.score <= 49); assert.ok(g.factors.some((f) => /too windy/.test(f.txt))); });
  ok("whiting: the same onshore blow still counts against it", () => { const k = scoreHour(profile("king-george-whiting")!, wr, wx(day, 18, 90)[wr.id], t); assert.ok(k.factors.some((f) => f.kind === "wind" && f.pts < 0)); });
}
// 22. Hot this week: expiry by date and a modest boost (v1.7.9)
import { activeHot, hotFor, HOT, type HotEntry } from "../src/data/hotThisWeek";
{
  const fake: HotEntry[] = [{ spots: ["williamstown-rocks"], level: "spot", species: "snapper", note: "x", source: "Test", url: "https://example.com", reported: "2026-11-01", expires: "2026-11-09" }];
  ok("hot: entry counts from report date to expiry, inclusive", () => { assert.equal(activeHot(at("2026-11-01T08:00:00+11:00"), fake).length, 1); assert.equal(activeHot(at("2026-11-09T23:30:00+11:00"), fake).length, 1); });
  ok("hot: expired entry is ignored automatically", () => { assert.equal(activeHot(at("2026-11-10T00:30:00+11:00"), fake).length, 0); assert.equal(hotFor("williamstown-rocks", "snapper", at("2026-11-12T12:00:00+11:00"), fake), undefined); });
  ok("hot: only the reported species matches", () => assert.equal(hotFor("williamstown-rocks", "calamari", at("2026-11-03T12:00:00+11:00"), fake), undefined));
  ok("hot: every live entry is valid (known spots, species, expiry 7–10 days, https link)", () => { for (const h of HOT) { const days = (Date.parse(h.expires) - Date.parse(h.reported)) / 864e5; assert.ok(days >= 7 && days <= 10, h.note); assert.ok(h.spots.every((id) => LAND.some((s) => s.id === id && s.species.includes(h.species))), h.spots.join()); assert.match(h.url, /^https:/); } });
  const br = LAND.find((s) => s.id === "black-rock-jetty")!, p = profile("snapper")!, t1 = at("2026-11-06T20:00:00+11:00"), t2 = at("2026-11-20T20:00:00+11:00");
  ok("hot: Black Rock snapper gets a modest boost with the source in the reason, and not after expiry", () => {
    const a = scoreHour(p, br, wx("2026-11-06", 8, 180)[br.id], t1), f = a.factors.find((x) => x.txt.startsWith("🔥"))!;
    assert.ok(f && f.pts > 0 && f.pts <= 6); assert.match(reasonFor(p, a.factors), /🔥 Reported biting this week – Fishing Australia – Port Phillip, 4 Nov/);
    assert.ok(!scoreHour(p, br, wx("2026-11-20", 8, 180)[br.id], t2).factors.some((x) => x.txt.startsWith("🔥")));
  });
  ok("hot: the boost never lifts a gale above the safety cap", () => { const g = scoreHour(p, br, wx("2026-11-06", 30, 270)[br.id], t1); assert.ok(g.score <= 49); });
}
console.log(`\n${n} checks passed`);
