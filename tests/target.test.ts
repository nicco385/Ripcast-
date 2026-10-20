// Scenario checks for "Target a fish". Run: npm run test:target
import assert from "node:assert/strict";
import { planSpecies, bestTargets, sessionWindow, scoreHour, profile } from "../src/target";
import { LAND, type Raw } from "../src/where";
import { dayStart, fmt } from "../src/astro";
import { TIDE_START, TIDE_END } from "../src/tides";

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

// 12. Tonight's targets: sensible list, no out-of-season species
const sw = sessionWindow(oct);
const bt = bestTargets(wx("2026-10-21", 10, 180), sw.from, sw.to, { now: oct });
ok("best targets tonight: 3 in-season species", () => { assert.equal(sw.label, "Tonight"); assert.equal(bt.length, 3); assert.ok(!bt.some((p) => p.profile.slug === "garfish" && p.notes.length)); });
console.log("\nHeadlines:\n", [g1, g2, s3, s4, s5, g7, g8].map((p) => `  [${p.verdict}] ${p.headline}`).join("\n"), "\n Tonight:", bt.map((p) => `${p.profile.name} ${p.verdict} @ ${p.spots[0].spot.name}`).join(" | "));
console.log(`\n${n} checks passed`);
