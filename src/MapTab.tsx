import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SPOTS } from "./data/spots";
import { MPAS } from "./data/mpa";
import type { Place } from "./lib";

export default function MapTab({ place, focus, onPick }: { place: Place; focus: string | null; onPick: (p: Place) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick); pick.current = onPick;
  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current).setView([place.lat, place.lon], 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    MPAS.forEach((m) => m.rings.forEach((r) => L.polygon(r, { color: "#ef4444", weight: 1.5, fillColor: "#ef4444", fillOpacity: 0.22 }).addTo(map).bindPopup(`<b>${m.name}</b><br/>⛔ No fishing or collecting. Boundary is approximate – follow Parks Victoria signs.`)));
    L.circleMarker([place.lat, place.lon], { radius: 9, color: "#38bdf8", fillOpacity: 0.8 }).addTo(map).bindPopup(`You: ${place.name}`);
    SPOTS.forEach((s) => {
      const div = document.createElement("div");
      div.innerHTML = `<b>${s.name}</b><br/>${s.noTake ? "⛔ No fishing – marine park/sanctuary" : `${s.kind}${s.depth ? " · " + s.depth : ""}<br/><small>${s.tips}</small><br/>`}`;
      if (!s.noTake) { const b = document.createElement("button"); b.className = "btn"; b.textContent = "Show conditions here"; b.onclick = () => pick.current({ name: s.name, lat: s.lat, lon: s.lon }); div.appendChild(b); }
      const mk = L.circleMarker([s.lat, s.lon], { radius: 7, color: s.noTake ? "#ef4444" : "#22c55e", fillOpacity: 0.7 }).addTo(map).bindPopup(div);
      if (s.id === focus) { map.setView([s.lat, s.lon], 14); mk.openPopup(); }
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      const div = document.createElement("div"); const b = document.createElement("button"); b.className = "btn"; b.textContent = "Check conditions here";
      b.onclick = () => pick.current({ name: `Map spot ${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}`, lat: +e.latlng.lat.toFixed(4), lon: +e.latlng.lng.toFixed(4) });
      div.appendChild(b); L.popup().setLatLng(e.latlng).setContent(div).openOn(map);
    });
    return () => { map.remove(); };
  }, [place.lat, place.lon, place.name, focus]);
  return <><div ref={ref} className="map" /><p className="muted small">🟢 fishing spot · 🔴 marine park or sanctuary – no fishing · Tap anywhere on the map to check conditions there.</p></>;
}
