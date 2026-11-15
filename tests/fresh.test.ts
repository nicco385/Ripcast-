import assert from "node:assert/strict";
import { WX_FRESH_MS, isWxFresh, agoText, fetchedWhen } from "../src/lib";

let n = 0;
const ok = (name: string, f: () => void) => { f(); n++; console.log("✓", name); };

const now = Date.parse("2026-11-15T19:10:00+11:00");

ok("fresh under 30 minutes", () => {
  assert.equal(isWxFresh(now - 29 * 60 * 1000, now), true);
  assert.equal(WX_FRESH_MS, 30 * 60 * 1000);
});
ok("stale at 30 minutes", () => {
  assert.equal(isWxFresh(now - 30 * 60 * 1000, now), false);
  assert.equal(isWxFresh(now - 31 * 60 * 1000, now), false);
});
ok("agoText just now / minutes / hours / days", () => {
  assert.equal(agoText(now, now), "just now");
  assert.equal(agoText(now - 5 * 60 * 1000, now), "5 min ago");
  assert.equal(agoText(now - 3 * 60 * 60 * 1000, now), "3 hours ago");
  assert.equal(agoText(now - 1 * 24 * 60 * 60 * 1000, now), "1 day ago");
  // 5169 min is the stale figure from the 15 Nov phone screenshot (~3.5 days)
  assert.equal(agoText(now - 5169 * 60 * 1000, now), "3 days ago");
});
ok("fetchedWhen is a readable date and time", () => {
  const s = fetchedWhen(now - 5169 * 60 * 1000);
  assert.match(s, /Nov/);
  assert.match(s, /\d/);
  assert.match(s, /am|pm/i);
});

console.log(`${n} fresh-weather checks passed`);
