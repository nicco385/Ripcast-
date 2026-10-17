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
