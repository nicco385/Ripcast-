# Choc's Spot – store listing (v1.0.0)

**App name:** Choc's Spot
**Short description (Google Play, max 80 chars):**
Best land-based fishing spots in Victoria for today's wind, tide & weather.

**Subtitle (App Store, max 30 chars):** Know where they're biting

**Category:** Sports (secondary: Weather) · **Content rating:** Everyone / 4+ · **Price:** Free · **Country:** Australia

## Full description
Know where they're biting. Choc's Spot is a simple fishing app for land-based anglers around Port Phillip Bay and Victoria. Pick a fish and a shore, and the wind, tide and how you get there decide the rest.

What you get:
• A fishing score out of 100 for today and the next 6 days, with the reasons behind it
• Where to fish: the top piers, beaches and rocks for the current wind and waves, with the best time to go and what to target
• Live weather, wind and gusts in knots, rain and air pressure
• Ocean waves, swell and sea temperature (inside Port Phillip Bay, where the wave model isn't reliable, it tells you to go by the wind instead)
• Sunrise, sunset, moon phase and the best feeding times (solunar)
• Approximate tides where the model is reliable, with links to the official BOM tide tables
• Safety warnings for strong wind, storms and big swell
• What's biting this month, and links to the latest local fishing reports
• A map of 43 land-based spots and boat marks, with every marine park and sanctuary around Port Phillip, Western Port and the nearby coast outlined in red (no fishing). The app never suggests a spot inside one.
• A catch log that warns you when a fish is under the legal size
• Size and bag limits for 15 species, checked against the VFA on 13 October 2026, with links to the official rules and fishing licences

Private by design: there are no accounts, ads or tracking. Your location and your catch log stay on your phone.

The scores are a guide only. Always check BOM warnings and VFA rules, and fish safely.
Weather data from Open-Meteo.com (CC BY 4.0). Map and marine park outlines © OpenStreetMap contributors (ODbL).

**Keywords (App Store, 100 chars):** fishing,tides,wind,Melbourne,Victoria,Port Phillip,pier,snapper,squid,whiting,salmon,forecast

## Privacy (Data safety / App Privacy labels)
- Data collected: **None**. Location is used on the device only, and coordinates are sent to Open-Meteo to fetch the weather. It is not linked to the user and not stored by us.
- Catch log: stored locally on the device only. No account. No tracking.
- Privacy policy URL: https://nicco385.github.io/Ripcast-/privacy.html

## Store assets (ready, in /workspace/ripcast/store/)
- `icon-512.png` – 512×512 Play icon
- `feature-graphic-1024x500.png` – Play feature graphic
- `screen-1-cover.png` … `screen-7-info.png` – 1080×1920 phone screenshots: Cover, Today, Where to fish, 7 days, Map, Catches, Info
- Still needed for the App Store only: 1290×2796 iPhone screenshots and a 1024×1024 icon with no transparency (can be made from the same pages if an iOS build goes ahead).

## Support
- Support URL / contact email: needed from Anthony (for example the GitHub repo or a dedicated email).

## Getting onto Google Play (simple checklist)
1. Create a Google account (or use yours), then join the [Google Play Console](https://play.google.com/console/) (one-off developer fee, paid to Google).
2. Create a new app named **Choc's Spot**, free, category Sports.
3. Paste the short description and full description from this file.
4. Upload the icon, feature graphic, and phone screenshots from the `store/` folder.
5. Set Data safety to match the Privacy section above (no data collected / shared by us). Link the privacy policy: https://nicco385.github.io/Ripcast-/privacy.html
6. Add a support email (or support URL) - Anthony still needs to choose this.
7. For a web app like this, the usual path is a **Trusted Web Activity (TWA)** wrapper that opens the live site. That needs a small Android package signed and uploaded as an AAB. Say when you want that built and we will do it together.
8. Complete content rating (Everyone), target Australia, then submit for review.

You can keep using the phone home-screen link meanwhile; Play is optional and does not change the live site.
