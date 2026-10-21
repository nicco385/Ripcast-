// Prints top picks per species under realistic scenarios. Run: npx esbuild tests/scenarios.ts --bundle --platform=node --format=cjs --outfile=/tmp/sc.cjs && node /tmp/sc.cjs
import { planSpecies, PROFILES } from "../src/target";
import { LAND, type Raw } from "../src/where";
import { dayStart, fmt } from "../src/astro";
import { TIDE_START, TIDE_END } from "../src/tides";
const TZ = "Australia/Melbourne", H = 3600000;
function wx(day: string, wind: number, dir: number): Record<string, Raw> {
  const t0 = dayStart(day, TZ), out: Record<string, Raw> = {}; const t: string[] = [], w: number[] = [], g: number[] = [], d: number[] = [];
  for (let i = 0; i < 48; i++) { t.push(fmt(t0 + i * H, TZ).slice(0, 13) + ":00"); w.push(wind); g.push(wind * 1.4); d.push(dir); }
  for (const s of LAND) out[s.id] = { t, wind: w, gust: g, dir: d, wave: [] };
  return out;
}
console.log(`tides ${fmt(TIDE_START(), TZ)} → ${fmt(TIDE_END(), TZ)}`);
const days = (process.env.DAYS ?? "2027-01-15,2027-04-15,2027-07-15,2026-10-24").split(",");
const winds: [string, number, number][] = [["calm", 5, 0], ["S20", 20, 190], ["W22", 22, 270]];
const only = process.env.SP?.split(",");
for (const p of PROFILES) { if (only && !only.includes(p.slug)) continue;
  console.log(`\n=== ${p.slug}`);
  for (const d of days) for (const [wn, k, dir] of winds) {
    const now = dayStart(d, TZ) + 4 * H;
    const pl = planSpecies(p.slug, wx(d, k, dir), { now, from: now, to: now + 24 * H });
    if (!pl) { console.log(d, wn, "none"); continue; }
    console.log(`${d} ${wn.padEnd(4)} ${pl.verdict.padEnd(5)} | ` + pl.spots.slice(0, 3).map((s) => `${s.spot.id}@${fmt(s.peak, TZ).slice(11, 13)}h ${s.score}`).join(", ") + (process.env.V ? `\n    ${pl.headline}\n    ${pl.spots[0].factors.map((f) => `${f.pts > 0 ? "+" : ""}${f.pts} ${f.txt}`).join("; ")}` : ""));
  }
}
