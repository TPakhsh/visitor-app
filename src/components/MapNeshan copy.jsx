// src/components/MapNeshan.jsx
import { useEffect, useRef, useState } from "react";

export default function MapNeshan({ location, onLocationSelect, onReverseResult, apiKey, mapKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [L, setL] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://static.neshan.org/sdk/leaflet/1.4.0/neshan-leaflet.min.js";
      script.onload = () => setL(window.L);
      script.onerror = () => setError("لود نقشه با خطا مواجه شد.");
      document.body.appendChild(script);
    } else {
      setL(window.L);
    }
  }, []);

  useEffect(() => {
    if (!L || !location) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(containerRef.current, {
      key: mapKey,
      maptype: "standard-day",
      poi: true,
      traffic: false,
      center: [location.lat, location.lng],
      zoom: 14,
    });
    mapRef.current = map;

    markerRef.current = L.marker([location.lat, location.lng], {
      draggable: true,
    }).addTo(map);

    markerRef.current.on("dragend", async (e) => {
      const { lat, lng } = e.target.getLatLng();
      const newLocation = { lat, lng };
      onLocationSelect(newLocation);
      await handleReverseGeocode(newLocation);
    });

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      const newLocation = { lat, lng };
      onLocationSelect(newLocation);
      markerRef.current.setLatLng(newLocation);
      await handleReverseGeocode(newLocation);
    });

    handleReverseGeocode(location);
  }, [L, location]);

  const handleReverseGeocode = async (coords) => {
    try {
      const res = await fetch(
        `https://api.neshan.org/v5/reverse?lat=${coords.lat}&lng=${coords.lng}`,
        {
          headers: { "Api-Key": apiKey },
        }
      );
      if (!res.ok) {
        console.warn("Reverse geocoding failed with status:", res.status);
        return;
      }
      const data = await res.json();
      onReverseResult(data);
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const res = await fetch(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(searchTerm)}&lat=${location.lat}&lng=${location.lng}`,
        {
          headers: { "Api-Key": apiKey },
        }
      );
      if (!res.ok) {
        console.warn("Search failed with status:", res.status);
        return;
      }
      const data = await res.json();
      if (data.count > 0) {
        const { y, x } = data.items[0].location;
        const newLocation = { lat: y, lng: x };
        onLocationSelect(newLocation);
        if (markerRef.current) markerRef.current.setLatLng(newLocation);
        if (mapRef.current) mapRef.current.setView(newLocation);
        await handleReverseGeocode(newLocation);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="جستجو روی نقشه (مثلاً تهران)"
          className="flex-1 border border-gray-300 p-2 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="bg-[#2B2E4A] text-white px-4 rounded hover:bg-[#53354A]"
        >
          جستجو
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div
        ref={containerRef}
        className="w-full h-[400px] rounded-xl overflow-hidden bg-gray-100"
      ></div>
    </div>
  );
}
