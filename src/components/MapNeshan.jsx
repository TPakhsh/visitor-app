// src/components/MapNeshan.jsx
import { useEffect, useRef, useState } from "react";

export default function MapNeshan({
  location,                 // { lat, lng }
  onLocationSelect,
  onReverseResult,
  apiKey,                   // برای reverse/search
  mapKey,                   // کلید وب SDK
  zoom = 17,
  hideSearch = false,       // مینی/مودال: true
  className = "",           // "h-full" وقتی ارتفاع از والد می‌آید
  height = 400,             // وقتی hideSearch=false
  debug = false,            // لاگ دیباگ اختیاری
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [L, setL] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const log = (...a) => debug && console.log("[MapNeshan]", ...a);
  const warn = (...a) => debug && console.warn("[MapNeshan]", ...a);

  // بارگذاری SDK نشان (یک‌بار)
  useEffect(() => {
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://static.neshan.org/sdk/leaflet/1.4.0/neshan-leaflet.min.js";
      script.onload = () => { setL(window.L); log("SDK loaded"); };
      script.onerror = () => { setError("لود نقشه با خطا مواجه شد."); warn("SDK load error"); };
      document.body.appendChild(script);
    } else {
      setL(window.L);
      log("SDK already present");
    }
  }, []);

  // ساخت/بازسازی نقشه — مطابق الگوی قبلیِ شما
  useEffect(() => {
    if (!L || !location || !containerRef.current) {
      if (!L) warn("L not ready");
      if (!location) warn("location missing");
      if (!containerRef.current) warn("container missing");
      return;
    }

    // اگر قبلاً ساخته شده، پاک شود تا با مرکز و زوم جدید بسازیم
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      key: mapKey,
      maptype: "standard-day",
      poi: true,
      traffic: false,
      center: [location.lat, location.lng],
      zoom,
      minZoom: 4,
      maxZoom: 21,
      zoomControl: true,
      scrollWheelZoom: true,
      tap: true,
    });
    mapRef.current = map;
    log("Map created", { center: location, zoom });

    // مارکر
    markerRef.current = L.marker([location.lat, location.lng], { draggable: true }).addTo(map);

    markerRef.current.on("dragend", async (e) => {
      const { lat, lng } = e.target.getLatLng();
      const newLocation = { lat, lng };
      onLocationSelect?.(newLocation);
      mapRef.current?.setView(newLocation, zoom, { animate: true });
      await handleReverseGeocode(newLocation);
      log("Marker dragged →", newLocation);
    });

    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      const newLocation = { lat, lng };
      onLocationSelect?.(newLocation);
      markerRef.current?.setLatLng(newLocation);
      mapRef.current?.setView(newLocation, zoom, { animate: true });
      await handleReverseGeocode(newLocation);
      log("Map clicked →", newLocation);
    });

    // ریورس اولیه
    handleReverseGeocode(location);

    // تثبیت اندازه (برای کارت/مودال/تب)
    setTimeout(() => map.invalidateSize(), 0);
    setTimeout(() => map.invalidateSize(), 300);

    // واکنش به resize/orientation
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    const onOrient = () => setTimeout(() => map.invalidateSize(), 150);
    window.addEventListener("orientationchange", onOrient);

    // tileerror هم اگر رخ بده لاگ می‌گیریم
    if (debug) map.on("tileerror", (e) => warn("tileerror:", e));

    return () => {
      window.removeEventListener("orientationchange", onOrient);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      log("Map destroyed");
    };
  }, [L, location, zoom, mapKey]); // الگوی خودت

  // Reverse Geocoding
  const handleReverseGeocode = async (coords) => {
    try {
      const res = await fetch(
        `https://api.neshan.org/v5/reverse?lat=${coords.lat}&lng=${coords.lng}`,
        { headers: { "Api-Key": apiKey } }
      );
      if (!res.ok) { warn("reverse status:", res.status); return; }
      const data = await res.json();
      onReverseResult?.(data);
      log("reverse ok:", data?.formatted_address);
    } catch (e) {
      warn("reverse error:", e);
    }
  };

  // جستجو (وقتی hideSearch=false)
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    const base = location
      ? { lat: location.lat, lng: location.lng }
      : mapRef.current?.getCenter()
      ? { lat: mapRef.current.getCenter().lat, lng: mapRef.current.getCenter().lng }
      : { lat: 35.6892, lng: 51.3890 };

    try {
      const res = await fetch(
        `https://api.neshan.org/v1/search?term=${encodeURIComponent(searchTerm)}&lat=${base.lat}&lng=${base.lng}`,
        { headers: { "Api-Key": apiKey } }
      );
      if (!res.ok) { warn("search status:", res.status); return; }
      const data = await res.json();
      if (data.count > 0 && data.items?.[0]?.location) {
        const { y, x } = data.items[0].location;
        const newLoc = { lat: y, lng: x };
        onLocationSelect?.(newLoc);
        markerRef.current?.setLatLng(newLoc);
        mapRef.current?.setView(newLoc, zoom, { animate: true });
        await handleReverseGeocode(newLoc);
        log("search →", newLoc);
      }
    } catch (e) {
      warn("search error:", e);
    }
  };

  // ---------- رندر ----------
  if (hideSearch) {
    // نسخهٔ مینی/مودال: بدون wrapper اضافی (کلید رفع مشکل ارتفاع 0)
    return (
      <div
        ref={containerRef}
        className={`w-full h-full rounded-xl overflow-hidden bg-gray-100 ${className}`}
        data-map
      />
    );
  }

  // نسخهٔ کامل با سرچ (ارتفاع ثابت با prop height)
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
        className={`w-full rounded-xl overflow-hidden bg-gray-100 ${className}`}
        style={{ height: typeof height === "number" ? `${height}px` : height }}
        data-map
      />
    </div>
  );
}
