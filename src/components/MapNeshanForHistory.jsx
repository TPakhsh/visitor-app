import React, { useEffect, useRef } from "react";

export default function MapNeshanForHistory({ visits, highlightedStore, onMarkerClick }) {
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!window.L || !visits || visits.length === 0) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map("history-map", {
        key: "web.2fc3a8093ae34cc8bb2e5af522452390",
        maptype: "neshan",
        poi: true,
        traffic: false,
        center: [35.700, 51.330],
        zoom: 12,
      });
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
    }

    if (Object.keys(markersRef.current).length > 0) return; // جلوگیری از بازسازی مداوم

    const uniqueMarkers = visits.reduce((acc, v) => {
      if (!acc[v.store_name]) {
        acc[v.store_name] = v;
      }
      return acc;
    }, {});

    Object.entries(uniqueMarkers).forEach(([store, v]) => {
      console.log("🟡 Adding marker for:", store, v.latitude, v.longitude);
      if (!v.latitude || !v.longitude) return;

      const marker = window.L.marker([v.latitude, v.longitude]).addTo(mapRef.current);
      marker.on("click", () => {
        onMarkerClick(store);
        marker.openPopup();
      });

      marker.bindPopup(
        window.L.popup({ closeButton: true, autoPan: true })
          .setContent(
            `<div style='font-family: Vazirmatn, sans-serif; font-size: 14px; line-height: 1.6; background: white; padding: 6px; border-radius: 4px;'>
              <b>${store}</b><br/>${v.store_type}
            </div>`
          )
      );

      markersRef.current[store] = marker;
    });
  }, [visits, onMarkerClick]);

  useEffect(() => {
    if (highlightedStore && markersRef.current[highlightedStore]) {
      markersRef.current[highlightedStore].openPopup();
      mapRef.current.setView(markersRef.current[highlightedStore].getLatLng(), 14);
    }
  }, [highlightedStore]);

  return (
    <div id="history-map" className="w-full h-full z-0" style={{ position: 'relative' }} />
  );
}
