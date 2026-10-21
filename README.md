# Choc's Spot – land-based fishing for Victoria

**Live app:** https://nicco385.github.io/Ripcast-/ (open it in a phone browser and use *Add to Home screen*)

Choc's Spot shows land-based anglers around Port Phillip Bay and Victoria where to fish today and when. It ranks piers, beaches and rocks using live wind, waves, tide and season data.

| Today & tides | Where to fish | Fish guide | Reports |
|---|---|---|---|
| ![](screenshots-v11/01-today.png) | ![](screenshots-v11/04-where.png) | ![](screenshots-v11/07-species.png) | ![](screenshots-v11/10-reports.png) |

## Features
- **Today:** fishing score out of 100 with reasons, live weather, wind and gusts in knots, pressure trend, waves, swell, sea temperature, the fish in season now, solunar feeding times, sunrise and sunset, a 24-hour strip, and **official tide times** with a tide chart
- **Tides:** the Bureau of Meteorology's own predictions for 20 Victorian stations (Williamstown, St Kilda, Geelong, Queenscliff, Mornington, Flinders, Stony Point, Tooradin, Cowes, San Remo and more), stored in the app so they work offline. 7-day view for any station. Times match the BOM tables exactly. Tables run from Oct 2026 to 31 Dec 2027.
- **Where to fish:** the best land-based spots for the wind, waves, fish in season and tide, by area and distance. Each spot has a guide (fish, access, tips, tides, closures)
- **Fish guides:** 19 species, including the freshwater perch (estuary, golden, silver) and redfin for the city rivers and Albert Park Lake; with where to fish from the shore, season, best time and tide, rig, tackle, hooks, baits, lures, tips, handling and the VFA size and bag limit
- **What's biting:** a month-by-month calendar of fish movements for Port Phillip and Western Port
- **Reports:** curated, working links to current local reports, by area
- **Map:** the land-based spots plus marine sanctuaries (no-fishing zones); tap anywhere to check conditions there
- **Catches:** a catch log that warns when a fish is under the legal size (stored on the device only)
- **Back button works:** the Android back gesture and browser Back step through tabs, guides, the map and the spot picker
- Installable PWA that works offline with the last saved data, and safety warnings for wind, storms and swell

## Tech
Vite, React 18 and TypeScript, with no UI framework and hand-written CSS. The Leaflet map is code-split into its own chunk and only loads when the Map tab opens. The service worker (`public/sw.js`) caches the app shell. Images are WebP: the hero is about 52 KB and each species tile is about 6 KB, lazy-loaded. Deployed to GitHub Pages.

```bash
npm install
npm run dev                                  # local
GH_PAGES=1 npx vite build --outDir dist-pages  # Pages build
```
To rename the app, edit `APP_NAME` in `src/config.ts`. The cover, title and manifest all update.

## Credits
- Tide times and heights: Bureau of Meteorology tide predictions, © Commonwealth of Australia. Based on Bureau of Meteorology information that has subsequently been modified (reformatted into this app). Predictions are a guide only.
- Weather & marine data: [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0)
- Map data and marine park / sanctuary outlines © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL), via Leaflet
- Fonts: Barlow Condensed and Outfit (SIL Open Font License), bundled with the app
- Rules summary: Victorian Fisheries Authority, checked 13 October 2026. Always check the official guide.
- Fish seasons, spot details and tips: VFA Go Fishing pages (Port Phillip Bay, Western Port) and The Pelican's Pick; fish movements from FishingMad weekly reports, Peninsula Insider and Compleat Angler Dandenong (see the in-app sources).

*Scores and tides are a guide only. Check BOM warnings and VFA rules, and fish safely.*

- Tide dial (rising/falling + countdown), day tide graph with sunrise/sunset, moonrise/moonset, and solunar feeding times (traditional theory, guide only) – v1.2.0
- Target a fish (v1.3.0): pick a species and the app ranks the best land-based spots for the next 24 hours from forecast wind/waves, BOM tides, time of day, moon and season, with plain-English verdicts, best times and a quick rig tip. "Tonight's best targets" on Today. Scenario checks: `npm run test:target`.
- v1.4.0: one rating engine (src/target.ts) now drives Fishing today, Where, Target a fish and the 7-day forecast, so they always agree; rain/showers are weighted properly (a showery day is capped at Fair). Shorter Today screen, one "best time" per screen, "last checked" warnings on hand-entered closures/limits/reports and near the end of the tide tables, catch log with spot, photo (stored on the phone), edit/delete, auto-saved conditions and backup/restore, a Facilities card on every spot (src/data/facilities.ts – only checked facts, otherwise "Not known"), "Bait & tackle near here", an add-to-home-screen prompt, and snook/kingfish/Murray cod moved under "More fish".
- v1.4.1: accuracy audit. Every species at every spot checked against the VFA regional "where to fish" pages, VFA Go Fishing lists, FishingMad and Bite Compass spot guides, and local reports (src/data/audit.ts lists the changes and the reason for each). Fish that are only an odd catch at a spot are labelled "(occasional)" and can never be a top pick (capped at Fair). Kerferd Road, St Kilda, Hampton, Seaford, Safety Beach and St Helens squid are now "occasional". Season edges are softened (the month either side of the VFA season is a "shoulder", not "out of season"). Light-line fish at a sheltered pier in a 20–24 kn blow are Fair, not Poor. Night bonus is bigger only where pier lights are confirmed. All VFA bag/size limits re-checked, Sorrento and Ferguson Street pier map pins fixed, calendar/snook/squid guides tightened. Scenario printer: tests/scenarios.ts.
