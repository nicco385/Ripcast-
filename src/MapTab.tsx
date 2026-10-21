import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SPOTS } from "./data/spots";
import { MPAS } from "./data/mpa";
import { ALL_LAND, nearName } from "./where";
import type { Place } from "./lib";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
export default function MapTab({ place, focus, onPick, onOpen }: { place: Place; focus: string | null; onPick: (p: Place) => void; onOpen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const pick = useRef(onPick); pick.current = onPick;
  const open = useRef(onOpen); open.current = onOpen;
  useEffect(() => {
    if (!ref.current) return;
    const f = focus ? ALL_LAND.find((s) => s.id === focus) : undefined;
    const map = L.map(ref.current).setView(f ? [f.lat, f.lon] : [place.lat, place.lon], f ? 14 : 10);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    MPAS.forEach((m) => m.rings.forEach((r) => L.polygon(r, { color: "#ef4444", weight: 1.5, fillColor: "#ef4444", fillOpacity: 0.22 }).addTo(map).bindPopup(`<b>${esc(m.name)}</b><br/>⛔ No fishing or collecting. Boundary is approximate – follow Parks Victoria signs.`)));
    L.circleMarker([place.lat, place.lon], { radius: 9, color: "#38bdf8", fillOpacity: 0.8 }).addTo(map).bindPopup(`You: ${esc(place.name)}`);
    SPOTS.filter((s) => s.noTake).forEach((s) => L.circleMarker([s.lat, s.lon], { radius: 6, color: "#ef4444", fillOpacity: 0.7 }).addTo(map).bindPopup(`<b>${esc(s.name)}</b><br/>⛔ No fishing – marine park/sanctuary`));
    ALL_LAND.forEach((s) => {
      const closed = !!s.info?.status?.closed;
      const div = document.createElement("div");
      div.innerHTML = `<b>${esc(s.name)}</b><br/>${closed ? "⛔ Closed – see the spot page" : `<small>${esc(s.tips)}</small>`}<br/>`;
      const b1 = document.createElement("button"); b1.className = "btn"; b1.textContent = "Spot guide"; b1.onclick = () => open.current(s.id); div.appendChild(b1);
      if (!closed) { const b = document.createElement("button"); b.className = "btn alt"; b.textContent = "Show conditions here"; b.style.marginLeft = "6px"; b.onclick = () => pick.current({ name: s.name, lat: s.lat, lon: s.lon }); div.appendChild(b); }
      const mk = L.circleMarker([s.lat, s.lon], { radius: 8, color: closed ? "#9ca3af" : s.info?.src === "vfa" ? "#22c55e" : "#86efac", fillOpacity: 0.8 }).addTo(map).bindPopup(div);
      if (s.id === focus) mk.openPopup();
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      const div = document.createElement("div"); const b = document.createElement("button"); b.className = "btn"; b.textContent = "Check conditions here";
      b.onclick = () => { const lat = +e.latlng.lat.toFixed(4), lon = +e.latlng.lng.toFixed(4); pick.current({ name: nearName({ lat, lon }), lat, lon, fromMap: true }); };
      div.appendChild(b); L.popup().setLatLng(e.latlng).setContent(div).openOn(map);
    });
    return () => { map.remove(); };
  }, [place.lat, place.lon, place.name, focus]);
  return <><div ref={ref} className="map" /><p className="muted small">🟢 fishing spot (bright green = listed by the VFA) · ⚪ closed · 🔴 marine park or sanctuary – no fishing · Tap anywhere on the map to check conditions there.</p></>;
}
