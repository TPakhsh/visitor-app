// src/components/MapLibreMap.jsx
import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({ location }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || !location) return;

    if (map.current) {
      map.current.setCenter([location.lng, location.lat]);
      map.current.setZoom(16);
      return;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.stadiamaps.com/styles/alidade_smooth.json", // ✅ نقشه کامل با ظاهر زیبا
      center: [location.lng, location.lat],
      zoom: 16,
    });

    new maplibregl.Marker({ color: "#E84545" })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current);
  }, [location]);

  return (
    <div
      ref={mapContainer}
      className="h-64 rounded-lg border border-gray-300 mt-4"
    />
  );
}
