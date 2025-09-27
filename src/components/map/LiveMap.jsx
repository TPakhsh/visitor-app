// src/components/map/LiveMap.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  MapPin, LocateFixed, Compass, ListFilter, Search, Navigation, X, Maximize2, Minimize2, RefreshCw,
} from "lucide-react";

const ENV_MAP_KEY = import.meta.env.VITE_NESHAN_MAP_KEY || import.meta.env.VITE_NESHAN_API_KEY || "";
const ENV_API_KEY = import.meta.env.VITE_NESHAN_API_KEY || "";

function ensureNeshanCss() {
  const href = "https://static.neshan.org/sdk/leaflet/1.4.0/neshan-leaflet.css";
  if (!document.querySelector(`link[href="${href}"]`)) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }
}
function ensureNeshanJs() {
  if (window.L && window.L.neshan) return Promise.resolve(window.L);
  if (window.__neshanLoadPromise) return window.__neshanLoadPromise;
  ensureNeshanCss();
  window.__neshanLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://static.neshan.org/sdk/leaflet/1.4.0/neshan-leaflet.min.js";
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error("Neshan SDK load failed"));
    document.body.appendChild(s);
  });
  return window.__neshanLoadPromise;
}

const toRad = (v) => (v * Math.PI) / 180;
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
const fmtDistance = (m) => (m < 1000 ? `${Math.round(m)} متر` : `${(m / 1000).toFixed(2)} کیلومتر`);

export default function LiveMap({
  user,
  onBack,
  mapKey = ENV_MAP_KEY,
  apiKey = ENV_API_KEY,
  maptype = "standard-day",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const meMarkerRef = useRef(null);
  const meAccuracyRef = useRef(null);
  const customersLayerRef = useRef(null);
  const watchIdRef = useRef(null);

  const [Lns, setLns] = useState(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [me, setMe] = useState({ lat: 35.7006, lng: 51.337, acc: null }); // Tehran fallback
  const [tracking, setTracking] = useState(true);

  const [customers, setCustomers] = useState([]);  // {id,name,lat,lng,phone,address}
  const [radius, setRadius] = useState(1000);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!mapKey) {
      setError("کلید وب SDK نشان تنظیم نشده است (VITE_NESHAN_MAP_KEY).");
      setLoadingMap(false);
    }
  }, [mapKey]);

  useEffect(() => {
    if (!mapKey) return;
    let cancelled = false;
    (async () => {
      try {
        const L = await ensureNeshanJs();
        if (cancelled || !containerRef.current) return;

        setLns(L);
        const map = L.map(containerRef.current, {
          key: mapKey,
          maptype,
          poi: true,
          traffic: false,
          center: [me.lat, me.lng],
          zoom: 15,
          minZoom: 4,
          maxZoom: 21,
          zoomControl: true,
          scrollWheelZoom: true,
          tap: true,
        });
        mapRef.current = map;
        customersLayerRef.current = L.layerGroup().addTo(map);

        const fixSize = () => setTimeout(() => map.invalidateSize(), 50);
        fixSize(); setTimeout(fixSize, 300);
        const ro = new ResizeObserver(fixSize);
        ro.observe(containerRef.current);
        const onOrient = () => setTimeout(fixSize, 150);
        window.addEventListener("orientationchange", onOrient);

        setLoadingMap(false);

        return () => {
          window.removeEventListener("orientationchange", onOrient);
          ro.disconnect();
          if (mapRef.current) mapRef.current.remove();
          mapRef.current = null;
        };
      } catch (e) {
        console.error(e);
        setError("خطا در بارگذاری نقشه نشان");
        setLoadingMap(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mapKey, maptype]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("GPS در مرورگر شما در دسترس نیست (نیاز به HTTPS یا localhost).");
      return;
    }
    const onPos = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setMe({ lat: latitude, lng: longitude, acc: accuracy });
    };
    const onErr = (e) => setError(e.message || "عدم دسترسی به موقعیت مکانی");
    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    });
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!Lns || !mapRef.current) return;
    const map = mapRef.current;
    const L = Lns;

    if (!meMarkerRef.current) {
      meMarkerRef.current = L.marker([me.lat, me.lng], { title: "موقعیت من" }).addTo(map);
    } else {
      meMarkerRef.current.setLatLng([me.lat, me.lng]);
    }

    if (me.acc) {
      if (!meAccuracyRef.current) {
        meAccuracyRef.current = L.circle([me.lat, me.lng], {
          radius: me.acc,
          color: "#2B2E4A",
          weight: 1.5,
          opacity: 0.6,
          fillOpacity: 0.08,
        }).addTo(map);
      } else {
        meAccuracyRef.current.setLatLng([me.lat, me.lng]);
        meAccuracyRef.current.setRadius(me.acc);
      }
    }
    if (tracking) map.setView([me.lat, me.lng], Math.max(15, map.getZoom()));
  }, [me, tracking, Lns]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let { data, error } = await supabase
          .from("customers")
          .select("id, name, store_name, latitude, longitude, lat, lng, phone, address, visitor_id")
          .eq("visitor_id", user?.id);
        if (error) throw error;
        let rows = data || [];

        if (!rows.length) {
          const r2 = await supabase
            .from("locations")
            .select("id, store_name, latitude, longitude, lat, lng, phone, address, assigned_to")
            .eq("assigned_to", user?.id);
          if (r2.error) throw r2.error;
          rows = r2.data || [];
        }

        if (!cancelled) {
          const mapped = rows
            .map((r) => ({
              id: r.id,
              name: r.name || r.store_name || "—",
              lat: r.latitude ?? r.lat,
              lng: r.longitude ?? r.lng,
              phone: r.phone || "",
              address: r.address || "",
            }))
            .filter((x) => typeof x.lat === "number" && typeof x.lng === "number");
          setCustomers(mapped);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!Lns || !mapRef.current || !customersLayerRef.current) return;
    const L = Lns;
    const layer = customersLayerRef.current;
    layer.clearLayers();

    customers.forEach((c) => {
      const m = L.marker([c.lat, c.lng], { title: c.name });
      const html = `
        <div dir="rtl" style="min-width:220px;font-family:Vazirmatn,sans-serif">
          <div style="font-weight:700">${c.name}</div>
          ${c.address ? `<div style="font-size:12px;color:#666">${c.address}</div>` : ""}
          ${c.phone ? `<div style="font-size:12px;color:#666">📞 ${c.phone}</div>` : ""}
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" target="_blank" rel="noreferrer">Google</a>
            <a href="https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes" target="_blank" rel="noreferrer">Waze</a>
            <a href="https://neshan.org/maps?lat=${c.lat}&lng=${c.lng}" target="_blank" rel="noreferrer">Neshan</a>
            <a href="https://balad.ir/location?lat=${c.lat}&lng=${c.lng}" target="_blank" rel="noreferrer">Balad</a>
          </div>
        </div>`;
      m.bindPopup(html);
      m.addTo(layer);
    });
  }, [customers, Lns]);

  const nearest = useMemo(() => {
    const list = customers
      .map((c) => ({ ...c, dist: haversine(me.lat, me.lng, c.lat, c.lng) }))
      .filter((c) => !q || c.name?.toLowerCase().includes(q.toLowerCase()));
    const within = list.filter((c) => c.dist <= radius);
    return within.sort((a, b) => a.dist - b.dist).slice(0, 20);
  }, [customers, me, radius, q]);

  const fitCustomers = () => {
    if (!mapRef.current || !customers.length || !Lns) return;
    const L = Lns;
    const bounds = L.latLngBounds(customers.map(c => [c.lat, c.lng]));
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  return (
    <div className="p-3 md:p-4 h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800" title="بازگشت">
              <X className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg md:text-xl font-bold text-[#2B2E4A]">نقشه لایو</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTracking((t) => !t)}
            className={`px-3 py-1.5 rounded-xl border text-sm flex items-center gap-2 ${
              tracking ? "bg-[#2B2E4A] text-white border-[#2B2E4A]" : "bg-white text-[#2B2E4A] border-[#2B2E4A]"
            }`}
            title="دنبال‌کردن خودکار موقعیت"
          >
            <Compass className="w-4 h-4" />
            {tracking ? "فعال" : "غیرفعال"}
          </button>

          <button
            onClick={() => mapRef.current?.setView([me.lat, me.lng], Math.max(16, mapRef.current.getZoom() || 16))}
            className="px-3 py-1.5 rounded-xl border text-sm bg-white text-[#2B2E4A] border-[#2B2E4A] flex items-center gap-2"
            title="رفتن به موقعیت من"
          >
            <LocateFixed className="w-4 h-4" />
            موقعیت من
          </button>

          <button
            onClick={fitCustomers}
            className="px-3 py-1.5 rounded-xl border text-sm bg-white text-[#2B2E4A] border-[#2B2E4A] flex items-center gap-2"
            title="نمایش همه مشتری‌ها"
          >
            <RefreshCw className="w-4 h-4" />
            فیت مشتری‌ها
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={containerRef}
          className="w-full rounded-2xl overflow-hidden border border-[#53354A] transition-[height] duration-300"
          style={{ height: expanded ? "calc(100dvh - 120px)" : "calc(100dvh - 220px)" }}
          data-map
        >
          {loadingMap && (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              در حال بارگذاری نقشه…
            </div>
          )}
          {error && !loadingMap && <div className="p-3 text-rose-600 text-sm">{error}</div>}
        </div>

        {/* Expand / Collapse */}
        <button
          onClick={() => { setExpanded((v) => !v); setTimeout(() => mapRef.current?.invalidateSize(), 160); }}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-white border border-[#53354A] rounded-xl shadow px-3 py-2 flex items-center gap-2"
          title={expanded ? "کوچک‌کردن نقشه" : "بزرگ‌کردن نقشه"}
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="text-sm text-[#2B2E4A]">{expanded ? "کوچک" : "بزرگ"}</span>
        </button>
      </div>

      {/* Floating panel: nearest + filters */}
      <div className="fixed right-3 bottom-24 md:bottom-6 z-[500] w-[min(92vw,380px)]">
        <div className="bg-white/95 backdrop-blur border border-[#53354A] rounded-2xl shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو بین مشتری‌ها"
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-500" />
              شعاع نزدیک‌ترین‌ها
            </div>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1"
            >
              <option value={300}>۳۰۰م</option>
              <option value={500}>۵۰۰م</option>
              <option value={800}>۸۰۰م</option>
              <option value={1000}>۱ کیلومتر</option>
              <option value={1500}>۱٫۵ کیلومتر</option>
              <option value={2000}>۲ کیلومتر</option>
            </select>
          </div>

          <div className="max-h-60 overflow-auto rounded-xl border border-gray-100">
            {nearest.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">مشتریِ نزدیک پیدا نشد</div>
            ) : (
              <ul className="divide-y">
                {nearest.map((c) => (
                  <li key={c.id} className="p-2 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#2B2E4A]">{c.name}</div>
                        <div className="text-xs text-gray-500">{fmtDistance(c.dist)}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="px-2 py-1.5 text-xs rounded-lg border border-[#2B2E4A] text-[#2B2E4A]"
                          onClick={() => mapRef.current?.setView([c.lat, c.lng], 17)}
                          title="زوم روی مشتری"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                        <a
                          className="px-2 py-1.5 text-xs rounded-lg bg-[#2B2E4A] text-white flex items-center gap-1"
                          href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          title="مسیر در Google"
                        >
                          <Navigation className="w-4 h-4" /> مسیر
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-2 text-[11px] text-gray-500">
            * برای دقت بهتر، GPS دستگاه را روشن نگه دارید. موقعیت شما به‌صورت لحظه‌ای به‌روزرسانی می‌شود.
          </div>
        </div>
      </div>
    </div>
  );
}
