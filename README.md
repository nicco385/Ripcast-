# Choc's Spot – land-based fishing for Victoria

**Live app:** https://nicco385.github.io/Ripcast-/ (open it in a phone browser and use *Add to Home screen*)

Choc's Spot shows land-based anglers around Port Phillip Bay and Victoria where to fish today and when. It ranks piers, beaches and rocks using live wind, waves, tide and season data.

| Cover | Today | Where to fish | 7 days |
|---|---|---|---|
| ![](shot-cover5.png) | ![](shot-final-today.png) | ![](shot-final-where.png) | ![](shot-final-week.png) |
| **Map** | **Catches** | **Info** | **Cover (bottom)** |
| ![](shot-final-map.png) | ![](shot-final-log.png) | ![](shot-final-rules.png) | ![](shot-cover5-bottom.png) |

## Features
- **Cover screen:** today's live call (Go, Maybe or Wait), the score, shortcuts and target species
- **Today:** fishing score out of 100 with reasons, live weather, wind and gusts in knots, pressure trend, waves, swell, sea temperature, solunar feeding times, sunrise and sunset, moon, approximate tides and a 24-hour strip
- **Where to fish:** the top 5 land-based spots for the wind and waves right now or later today, with the best time, target species, directions and a distance filter
- **What's biting this month,** shown with species photos, plus links to the latest local fishing reports
- **7 days:** daily scores and feeding windows
- **Map:** 49 spots plus marine sanctuaries (no-fishing zones); tap anywhere to check conditions there
- **Catches:** a catch log that warns when a fish is under the legal size, with photos (stored on the device only)
- **Info:** Victorian size and bag limits, licence links, privacy, disclaimer and credits
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
- Weather & marine data: [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0)
- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, via Leaflet
- Rules summary: Victorian Fisheries Authority. Always check the official guide.

*Scores and tides are a guide only. Check BOM warnings and VFA rules, and fish safely.*
