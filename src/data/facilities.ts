// Facilities at each land spot. Only facts we could check in a published source.
// Anything we could not confirm is "unknown" — never a guess.
// Checked 21 Oct 2026. Toilet distances are from the spot's map pin (National Public Toilet Map).
export type Has = "yes" | "no" | "unknown";
export type Fac = { has: Has; note?: string };
export type Facilities = { toilets: Fac; parking: Fac; lights: Fac; rails: Fac; cleaning: Fac; src: string[] };
export const FAC_CHECKED = "21 Oct 2026";

export const SRC: Record<string, { t: string; u: string }> = {
  vfaPP: { t: "VFA – Go Fishing Port Phillip Bay", u: "https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-port-phillip-bay" },
  vfaWP: { t: "VFA – Go Fishing Western Port", u: "https://vfa.vic.gov.au/recreational-fishing/fishing-locations/go-fishing-western-port" },
  vfaCT: { t: "VFA – fishing platforms and cleaning tables", u: "https://vfa.vic.gov.au/recreational-fishing/go-fishing-victoria/gfvphase2/more-fishing-platforms-and-cleaning-tables" },
  toilet: { t: "National Public Toilet Map (Australian Government)", u: "https://toiletmap.gov.au/" },
  pvStKilda: { t: "Parks Victoria – St Kilda Pier", u: "https://www.parks.vic.gov.au/places-to-see/parks/st-kilda-pier-and-breakwater" },
  pvFrankston: { t: "Parks Victoria – Frankston Pier", u: "https://www.parks.vic.gov.au/places-to-see/sites/frankston-pier" },
  frankston: { t: "Frankston City Council – waterfront parking", u: "https://www.frankston.vic.gov.au/Things-To-Do/Frankston-Waterfront-Your-Ultimate-Summer-Destination" },
  pvRye: { t: "Parks Victoria – Rye Pier rebuild", u: "https://www.parks.vic.gov.au/projects/melbourne-region/rye-pier-approach-reconstruction" },
  pvAltona: { t: "Parks Victoria – new Altona Pier", u: "https://www.parks.vic.gov.au/news/2024/01/23/00/45/new-altona-pier-open" },
  hobsons: { t: "Hobsons Bay Council – boating facilities", u: "https://www.hobsonsbay.vic.gov.au/Community/Sport-and-recreation/Foreshore-beaches-and-boating-facilities" },
  pvSeaford: { t: "Parks Victoria – Seaford Pier", u: "https://www.parks.vic.gov.au/places-to-see/sites/seaford-pier" },
  dromana: { t: "Visit Mornington Peninsula – Dromana Pier", u: "https://www.visitmorningtonpeninsula.org/Places-To-See/Beaches-Coastline/Piers-Jetties/View/5b35ca9a36d9efc45f920f53/Dromana-Pier" },
  gem: { t: "Vintage Victoria – Gem Pier", u: "https://vintagevictoria.net.au/gem-pier-williamstown/" },
  kerferd: { t: "FishingMad – Kerferd Road Pier", u: "https://fishingmad.com.au/location/kerferd-road-pier-port-melbourne/" },
  geelong: { t: "City of Greater Geelong – boat ramps and jetties", u: "https://www.geelongcity.vic.gov.au/services/venues-and-facilities/boat-ramps-jetties-and-boardwalks" },
  pvAlbert: { t: "Parks Victoria – Albert Park access info", u: "https://www.parks.vic.gov.au/get-into-nature/all-abilities-access/park-accessibility-information/albert-park-accessibility" },
  pvYarraBend: { t: "Parks Victoria – Yarra Bend Park access info", u: "https://www.parks.vic.gov.au/get-into-nature/all-abilities-access/park-accessibility-information/yarra-bend-park-accessibility" },
};

const Y = (note?: string): Fac => ({ has: "yes", note });
const U: Fac = { has: "unknown" };
const f = (toilets: Fac, parking: Fac, src: string[], more: Partial<Pick<Facilities, "lights" | "rails" | "cleaning">> = {}): Facilities =>
  ({ toilets, parking, lights: more.lights ?? U, rails: more.rails ?? U, cleaning: more.cleaning ?? U, src: ["toilet", ...src] });

export const FACILITIES: Record<string, Facilities> = {
  "st-kilda-pier": f(Y("On the pier, about 200 m – open 24 hours"), Y("Limited paid parking next to the Sea Baths"), ["pvStKilda"]),
  "middle-brighton": f(Y("Middle Brighton Baths, about 350 m – daylight hours"), Y("Baths car park – fills early on weekends"), []),
  "mordialloc-pier": f(Y("Toilet block at the Pier Road car park, about 250 m – 6am–9pm"), Y("Ample parking (VFA)"), ["vfaPP"]),
  "frankston-pier": f(Y("Foreshore plaza, about 200 m – daylight hours"), Y("Car parks near the pier – fees and time limits"), ["pvFrankston", "frankston"]),
  "mornington-pier": f(Y("Toilet block at the foot of the pier – open 24 hours"), Y("Plenty of parking (VFA)"), ["vfaPP"]),
  "rye-pier": f(Y("Near the pier car park, about 350 m – open 24 hours"), Y("Car park at the foreshore"), ["pvRye"], { lights: Y("Solar lights along the pier"), rails: Y("Handrails were added in the rebuild") }),
  "sorrento-pier": f(Y("Toilet block at the foot of the pier"), Y("Parking at the foot of the pier (VFA)"), ["vfaPP"]),
  "portsea-pier": f(Y("WF Newton Reserve, about 100 m – open 24 hours"), Y("Parking at the reserve – limited in summer"), []),
  "queenscliff-pier": f(Y("Princess Park, about 200 m – open 24 hours"), Y("Ample parking at the foot of the pier, incl. disabled (VFA)"), ["vfaPP"]),
  "st-leonards-pier": f(Y("St Leonards foreshore, about 350 m – open 24 hours"), Y("Parking at the boat ramp next door"), ["geelong"], { cleaning: Y("At the St Leonards boat ramp next door") }),
  "portarlington-pier": f(Y("At the pier, about 200 m – daylight hours (Pier Street toilets, about 300 m, open 24 hours)"), Y("Car park near the pier"), []),
  "cunningham-pier": f(Y("Cunningham Pier, about 200 m – 6am–9pm"), Y("Parking on and next to the pier (VFA)"), ["vfaPP"]),
  "altona-pier": f(Y("Weaver Reserve, about 250 m – daylight hours"), Y("Parking at Weaver Reserve"), ["pvAltona", "hobsons"], { lights: Y("Lights along the new pier"), rails: Y("Handrails along the new pier"), cleaning: { has: "unknown", note: "None listed for the pier. The Altona boat ramp in Seaholme has a cleaning area" } }),
  "gem-pier": f(Y("Commonwealth Reserve, about 150 m – daylight hours"), Y("Ticketed parking nearby"), ["gem"], { lights: Y("Lamp posts along the pier") }),
  "kerferd-pier": f(Y("Foreshore reserve at Kerferd Road, about 100 m – daylight hours"), Y("Street parking"), ["kerferd"], { lights: Y("LED lights on the pier"), rails: Y("Handrails (2019 upgrade)") }),
  "hampton-pier": f(Y("Hampton Surf Life Saving Club, about 200 m – open 24 hours"), Y("Willis Street car park – tight on weekends"), []),
  "seaford-pier": f(Y("Next to the life saving club, about 100 m"), Y("Paid car park"), ["pvSeaford"]),
  "dromana-pier": f(Y("Bishops Reserve, about 100 m – open 24 hours"), Y("Beside the pier and along Point Nepean Road"), ["dromana"]),
  "rosebud-pier": f(Y("Rosebud foreshore at Jetty Road, about 250 m – hours vary by season"), Y("Foreshore parking"), []),
  "safety-beach": f(Y("Tonkin Street, about 400 m – open 24 hours"), Y("Parking along Marine Drive"), []),
  "patterson-shore": f(Y("Roy Dore Reserve, about 250 m – daylight hours"), Y("Ample parking (VFA)"), ["vfaPP"], { cleaning: Y("Fish cleaning facilities (VFA)") }),
  "werribee-jetties": f(Y("Werribee South Beach, about 700 m – open 24 hours"), Y("Ample parking (VFA)"), ["vfaPP"], { cleaning: Y("Fish cleaning facilities (VFA)") }),
  "warmies-wall": f(Y("The Warmies, about 50 m – daylight hours"), Y("Greenwich Reserve – tight"), ["vfaCT"], { cleaning: Y("Fish cleaning table with running water and a light (VFA)") }),
  "yarra-docklands": f(Y("Harbour Esplanade, about 250 m – daylight hours"), U, []),
  "yarra-southbank": f(Y("Inside Crown, about 150 m – open 24 hours"), U, []),
  "yarra-herring": f(Y("Barkly Gardens, about 100 m – daylight hours"), Y("Parking at Barkly Gardens"), []),
  "maribyrnong-footscray": f(Y("Leeds Street, about 100 m – 6am–10pm"), Y("Parking at Leeds Street"), []),
  "maribyrnong-anglers": f(Y("Fairbairn Park, about 250 m – 8am–6pm"), Y("Car park at Fairbairn Park"), []),
  "ferguson-street-pier": f(Y("Commonwealth Reserve, about 200 m – daylight hours. More along The Strand and Nelson Place"), Y("Parking nearby (VFA)"), ["vfaPP"]),
  "flinders-pier": f(Y("At the pier, about 200 m – open 24 hours"), Y("Parking at the pier (VFA)"), ["vfaWP"]),
  "merricks-beach": f(Y("Near the yacht club, about 600 m – open 24 hours"), Y("Car park at the end of Merricks Beach Road (VFA)"), ["vfaWP"]),
  "stony-point-pier": f(Y("At the boat ramp, about 400 m – daylight hours"), Y("Car park nearby (VFA)"), ["vfaWP"]),
  "hastings-jetty": f(Y("Fred Smith Reserve, about 150 m – open 24 hours"), Y("Car park at the base of the jetty (VFA)"), ["vfaWP", "vfaCT"], { cleaning: Y("Two large undercover cleaning tables with lights and running water (VFA)") }),
  "tooradin-jetty": f(Y("Tooradin foreshore, about 200 m – 6am–9pm"), Y("Car parking (VFA)"), ["vfaWP"]),
  "san-remo-pier": f(Y("Marine Parade foreshore reserve, about 150 m – daylight hours"), Y("Plenty of parking close by (VFA)"), ["vfaWP"]),
  "cowes-jetty": f(Y("Cowes Beach, about 150 m – daylight hours"), Y("Parking at the Cowes Beach toilets"), ["vfaWP"]),
  "corinella-pier": f(Y("In the caravan park next to the pier (VFA) – check they're open to the public"), U, ["vfaWP"]),
  "albert-park-lake": f(Y("At the Swan, Coot and Cormorant/Grebe picnic grounds around the lake"), Y("Paid parking in several areas – watch the time limits"), ["pvAlbert"]),
  "yarra-bend": f(Y("Near the Long Oval pavilion, about 100 m – open 24 hours"), Y("Car parks in the park"), ["pvYarraBend"]),
  "st-helens": f(Y("St Helens Coast Guard, about 60 m – open 24 hours"), Y("Car park beside the boat ramp"), ["geelong"], { lights: Y("Solar lights on the harbour rock walls"), cleaning: Y("Fish cleaning table at the rock walls") }),
};
