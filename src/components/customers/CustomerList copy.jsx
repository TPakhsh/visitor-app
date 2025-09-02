// src/components/customers/CustomerList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  Search, SortAsc, SortDesc, Store, Phone, MapPin, Hash, Info,
  ExternalLink, UserCircle, Star, Gauge, Users, ListChecks,
  ChevronDown, ChevronLeft, Navigation
} from "lucide-react";

/* ===== Persian formatting ===== */
const persianDigits = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const faNum = (x) => (x === null || x === undefined) ? "—" : String(x).replace(/\d/g, d => persianDigits[+d]);
const faPercent = (p) => (p == null || isNaN(p)) ? "—" : `${faNum(p)}٪`;
const faDate = (iso) => { try { return iso ? new Date(iso).toLocaleString("fa-IR") : "—"; } catch { return "—"; } };
const isUuid = (v) => typeof v === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

/* نرخ تبدیل: قرمز→سبز */
const convColor = (c0) => { const c = Math.max(0, Math.min(100, Number(c0)||0)); const hue = (c*120)/100; return `hsl(${hue} 70% 38%)`; };
const convBg    = (c0) => { const c = Math.max(0, Math.min(100, Number(c0)||0)); const hue = (c*120)/100; return `hsl(${hue} 85% 96%)`; };

/* پالت */
const cPrimary = "#2B2E4A";
const cBurgundy = "#903749";
const cDeep = "#53354A";

/* دستگاه و لینک مسیریابیِ یک‌کلیکی */
const isAndroid = () => /android/i.test(navigator.userAgent);
const isiOS     = () => /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent);

function buildOneClickNavHref({ lat, lng, label }) {
  const encLabel = encodeURIComponent(label || "Destination");
  if (isAndroid()) {
    return (lat != null && lng != null)
      ? `geo:${lat},${lng}?q=${lat},${lng}(${encLabel})`
      : `geo:0,0?q=${encLabel}`;
  }
  if (isiOS()) {
    return (lat != null && lng != null)
      ? `http://maps.apple.com/?ll=${lat},${lng}&q=${encLabel}`
      : `http://maps.apple.com/?q=${encLabel}`;
  }
  return (lat != null && lng != null)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encLabel}`;
}

export default function CustomerList({ user }) {
  const [loading, setLoading] = useState(true);

  // DB
  const [customersRaw, setCustomersRaw] = useState([]);
  const [visits, setVisits] = useState([]);
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [schedLocs, setSchedLocs] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // UI
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("last_visit");
  const [sortOrder, setSortOrder] = useState("desc");
  const [openRow, setOpenRow] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      const [
        customersRes,
        visitsRes,
        reportsRes,
        notesRes,
        schedulesRes,
        locationsRes,
      ] = await Promise.all([
        supabase.from("customers").select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabase.from("visits")
          .select("id, store_name, store_type, shop_type, has_order, order_placed, description, created_at, user_id, phone, address, building_number, municipality_zone, latitude, longitude")
          .eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reports")
          .select("id, location_id, location_name, order_placed, store_type, created_at, visitor_id, latitude, longitude")
          .eq("visitor_id", user.id).order("created_at", { ascending: false }),
        supabase.from("visit_notes").select("id, schedule_id, location_id, note, has_order, created_at, visitor_id")
          .eq("visitor_id", user.id).order("created_at", { ascending: false }),
        supabase.from("schedules").select("id, visitor_id").eq("visitor_id", user.id),
        supabase.from("locations").select("id, name, address, phone, latitude, longitude"),
      ]);

      let schedLocsRes = { data: [] };
      if (schedulesRes.data?.length) {
        const scheduleIds = schedulesRes.data.map((s) => s.id);
        schedLocsRes = await supabase.from("schedule_locations")
          .select("id, schedule_id, location_id").in("schedule_id", scheduleIds);
      }

      if (!mounted) return;
      setCustomersRaw(customersRes.data || []);
      setVisits(visitsRes.data || []);
      setReports(reportsRes.data || []);
      setNotes(notesRes.data || []);
      setSchedules(schedulesRes.data || []);
      setLocations(locationsRes.data || []);
      setSchedLocs(schedLocsRes.data || []);
      setLoading(false);
    }
    fetchAll();
    return () => { mounted = false; };
  }, [user.id]);

  /* ایندکس‌ها */
  const locationById = useMemo(() => {
    const m = new Map();
    for (const l of locations) if (l?.id) m.set(String(l.id), l);
    return m;
  }, [locations]);

  const coordsByName = useMemo(() => {
    const best = new Map(); // key -> {ts, lat, lng}
    const bump = (name, lat, lng, ts) => {
      const key = (name || "").trim().toLowerCase();
      if (!key || lat == null || lng == null) return;
      const cur = best.get(key);
      if (!cur || ts > cur.ts) best.set(key, { ts, lat, lng });
    };
    for (const c of customersRaw) bump(c.name, c.latitude, c.longitude, 0);
    for (const l of locations)    bump(l.name, l.latitude, l.longitude, 0);
    for (const v of visits)  bump(v.store_name, Number(v.latitude), Number(v.longitude), new Date(v.created_at).getTime());
    for (const r of reports) bump(r.location_name, Number(r.latitude), Number(r.longitude), new Date(r.created_at).getTime());
    return best;
  }, [customersRaw, locations, visits, reports]);

  const normalizeOrder = (x1, x2) =>
    (typeof x1 === "boolean" ? x1 : undefined) ?? (typeof x2 === "boolean" ? x2 : false);

  const resolveStoreType = (name, untilTs) => {
    if (!name) return null;
    const key = name.trim().toLowerCase();
    let best = { ts: 0, type: null };
    for (const v of visits) {
      if ((v.store_name || "").trim().toLowerCase() !== key) continue;
      const t = v.store_type || v.shop_type; if (!t) continue;
      const ts = new Date(v.created_at).getTime();
      if (untilTs && ts > untilTs) continue;
      if (ts > best.ts) best = { ts, type: t };
    }
    for (const r of reports) {
      if ((r.location_name || "").trim().toLowerCase() !== key) continue;
      const t = r.store_type; if (!t) continue;
      const ts = new Date(r.created_at).getTime();
      if (untilTs && ts > untilTs) continue;
      if (ts > best.ts) best = { ts, type: t };
    }
    return best.type;
  };

  /* ساخت پایه مشتریان */
  const baseCustomers = useMemo(() => {
    const byKey = new Map();
    const put = (obj) => {
      const key = (obj.name || "").trim().toLowerCase();
      if (!key || byKey.has(key)) return;
      byKey.set(key, obj);
    };

    for (const c of customersRaw) {
      put({
        id: c.id, name: c.name || "—",
        phone: c.phone || null, address: c.address || null,
        building_number: c.building_number || null, municipality_zone: c.municipality_zone || null,
        latitude: c.latitude ?? null, longitude: c.longitude ?? null,
        is_vip: !!c.is_vip, _source: "customers",
      });
    }

    if (schedules.length && schedLocs.length) {
      for (const sl of schedLocs) {
        const loc = locationById.get(String(sl.location_id));
        if (!loc) continue;
        put({
          id: String(sl.location_id), name: loc.name || "—",
          phone: loc.phone || null, address: loc.address || null,
          building_number: null, municipality_zone: null,
          latitude: loc.latitude ?? null, longitude: loc.longitude ?? null,
          is_vip: false, _source: "schedule_location",
        });
      }
    }

    for (const v of visits) {
      const name = (v.store_name || "").trim();
      if (!name) continue;
      put({
        id: `adhoc-${encodeURIComponent(name.toLowerCase())}`,
        name,
        phone: v.phone || null, address: v.address || null,
        building_number: v.building_number || null, municipality_zone: v.municipality_zone || null,
        latitude: null, longitude: null,
        is_vip: false, _source: "visits",
      });
    }

    for (const r of reports) {
      const name = (r.location_name || "").trim();
      if (!name) continue;
      put({
        id: isUuid(r.location_id) ? String(r.location_id) : `report-${encodeURIComponent(name.toLowerCase())}`,
        name, phone: null, address: null, building_number: null, municipality_zone: null,
        latitude: null, longitude: null, is_vip: false, _source: "reports",
      });
    }

    return Array.from(byKey.values());
  }, [customersRaw, schedules, schedLocs, locationById, visits, reports]);

  /* محاسبه آمار + مختصات نهایی برای مسیریابی */
  const rows = useMemo(() => {
    const byName = new Map();
    const out = baseCustomers.map((c, idx) => {
      const key = (c.name || "").trim().toLowerCase();
      byName.set(key, idx);
      let lat = c.latitude, lng = c.longitude;
      if (lat == null || lng == null) {
        const best = coordsByName.get(key);
        if (best) { lat = best.lat; lng = best.lng; }
      }
      return {
        ...c,
        total_visits: 0, orders: 0, conversion: 0,
        last_visit: null, last_note: null,
        store_type: null,
        navLat: lat, navLng: lng,
      };
    });

    const bump = (idx, tsISO, hasOrder, noteMaybe) => {
      const o = out[idx];
      o.total_visits += 1;
      if (hasOrder) o.orders += 1;
      const ts = new Date(tsISO).getTime();
      if (!o.last_visit || ts > new Date(o.last_visit).getTime()) {
        o.last_visit = tsISO;
        if (!o.last_note && noteMaybe) o.last_note = noteMaybe;
      }
    };

    for (const v of visits) {
      const k = (v.store_name || "").trim().toLowerCase();
      const idx = byName.get(k);
      if (idx == null) continue;
      bump(idx, v.created_at, normalizeOrder(v.has_order, v.order_placed), v.description);
    }
    for (const n of notes) {
      const loc = locationById.get(String(n.location_id));
      const k = (loc?.name || "").trim().toLowerCase();
      if (!k) continue;
      const idx = byName.get(k);
      if (idx == null) continue;
      bump(idx, n.created_at, !!n.has_order, n.note);
    }

    for (const o of out) {
      o.conversion = o.total_visits ? Math.round((o.orders / o.total_visits) * 100) : 0;
      const untilTs = o.last_visit ? new Date(o.last_visit).getTime() : undefined;
      o.store_type = resolveStoreType(o.name, untilTs) || "—";
    }
    return out;
  }, [baseCustomers, visits, notes, locationById, coordsByName]);

  /* Totals */
  const totals = useMemo(() => {
    const totalCustomers = rows.length;
    const totalVisits = rows.reduce((s, r) => s + r.total_visits, 0);
    const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
    const conv = totalVisits ? Math.round((totalOrders / totalVisits) * 100) : 0;
    return { totalCustomers, totalVisits, totalOrders, conv };
  }, [rows]);

  /* Filter + Sort */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = rows.filter((c) => {
      if (!q) return true;
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && String(c.phone).toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.store_type && c.store_type.toLowerCase().includes(q))
      );
    });

    const cmp = (a, b) => {
      let A, B;
      switch (sortField) {
        case "name": A = a.name || ""; B = b.name || ""; break;
        case "total_visits": A = a.total_visits; B = b.total_visits; break;
        case "orders": A = a.orders; B = b.orders; break;
        case "conversion": A = a.conversion; B = b.conversion; break;
        case "last_visit":
        default:
          A = a.last_visit ? new Date(a.last_visit).getTime() : 0;
          B = b.last_visit ? new Date(b.last_visit).getTime() : 0;
          break;
      }
      if (A === B) return 0;
      return sortOrder === "asc" ? (A > B ? 1 : -1) : A < B ? 1 : -1;
    };

    arr.sort(cmp);
    return arr;
  }, [rows, search, sortField, sortOrder]);

  /* لودینگ */
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-3 md:p-4">
        <HeaderStatsSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mt-3">
          {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-3 md:p-4">{/* ↓ کمی باریک‌تر از قبل */}
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <KPI icon={<Users className="w-5 h-5" />} label="تعداد مشتری" value={faNum(totals.totalCustomers)} color={cPrimary} />
        <KPI icon={<ListChecks className="w-5 h-5" />} label="تعداد ویزیت" value={faNum(totals.totalVisits)} color={cDeep} />
        <KPI icon={<Store className="w-5 h-5" />} label="سفارش‌ها" value={faNum(totals.totalOrders)} color={cBurgundy} />
        <KPI icon={<Gauge className="w-5 h-5" />} label="نرخ تبدیل" value={faPercent(totals.conv)} color={convColor(totals.conv)} bg={convBg(totals.conv)} />
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2" style={{ color: cPrimary }}>
          <UserCircle size={20} />
          لیست مشتریان
        </h1>

        <div className="flex flex-col md:flex-row gap-2 md:items-center w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute top-2 right-3 text-gray-400" size={16} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو: نام، تلفن، آدرس یا نوع فروشگاه..."
              className="w-full border border-gray-200 rounded-lg pr-9 pl-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#903749]/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortField} onChange={(e) => setSortField(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-2 text-xs md:text-sm"
            >
              <option value="last_visit">مرتب‌سازی: آخرین ویزیت</option>
              <option value="name">مرتب‌سازی: نام</option>
              <option value="total_visits">مرتب‌سازی: تعداد ویزیت</option>
              <option value="orders">مرتب‌سازی: سفارش‌ها</option>
              <option value="conversion">مرتب‌سازی: نرخ تبدیل</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
              className="inline-flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs md:text-sm"
              title={sortOrder === "asc" ? "صعودی" : "نزولی"}
            >
              {sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />} ترتیب
            </button>
          </div>
        </div>
      </div>

      {/* Table-like */}
      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 bg-white rounded-lg p-6 shadow">
          مشتری‌ای مطابق جستجو پیدا نشد.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* هدر: 4/2/2/2/2 */}
          <div className="hidden md:grid grid-cols-12 text-[11px] font-medium text-gray-600 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <div className="col-span-4">نام / نوع فروشگاه / اقدام</div>
            <div className="col-span-2 text-center">تعداد ویزیت</div>
            <div className="col-span-2 text-center">سفارش‌ها</div>
            <div className="col-span-2 text-center">نرخ تبدیل</div>
            <div className="col-span-2 text-center">آخرین ویزیت</div>
          </div>

          <ul className="divide-y divide-gray-100">
            {filtered.map((c) => {
              const rowKey = (c.name || "").trim().toLowerCase();
              const isOpen = openRow === rowKey;

              const navHref = buildOneClickNavHref({
                lat: c.navLat, lng: c.navLng, label: c.name
              });

              return (
                <li key={c.id} className="relative hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 items-center px-3 md:px-3.5 py-2 md:py-2">
                    {/* 1) نام + نوع + دکمه‌ها (col-span-4) */}
                    <div className="col-span-12 md:col-span-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="flex items-center gap-2 text-right flex-1 min-w-0"
                          onClick={() => setOpenRow(isOpen ? null : rowKey)}
                          aria-expanded={isOpen}
                        >
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-600 shrink-0">
                            <Store size={16} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 truncate text-sm">{c.name}</span>
                              {c.is_vip && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-1.5 py-0.5">
                                  <Star size={12} /> VIP
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              نوع فروشگاه: <span className="font-medium" style={{ color: cDeep }}>{c.store_type || "—"}</span>
                            </div>
                          </div>
                          <span className="ml-auto md:hidden text-gray-400">
                            {isOpen ? <ChevronDown className="rotate-90" size={16} /> : <ChevronLeft size={16} />}
                          </span>
                        </button>

                        {/* دکمه‌ها کنار هم در موبایل و دسکتاپ */}
                        <div className="flex flex-row flex-wrap items-center gap-1 md:gap-1.5 shrink-0">
                          <a
                            href={navHref}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] md:text-xs shadow-sm hover:shadow bg-white"
                            style={{ color: cPrimary, borderColor: "#E5E7EB" }}
                            title="مسیریابی"
                          >
                            <Navigation size={14} />
                            مسیریابی
                          </a>

                          <Link
                            to={`/customers/${encodeURIComponent(c.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] md:text-xs shadow-sm hover:shadow bg-white"
                            style={{ color: cPrimary, borderColor: "#E5E7EB" }}
                            title="جزئیات مشتری"
                          >
                            <ExternalLink size={14} />
                            جزئیات
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* 2) ستون‌های آماری دسکتاپ (۴ ستون با col-span-2) */}
                    <div className="hidden md:block col-span-2 text-center font-medium text-gray-800 text-sm">{faNum(c.total_visits)}</div>
                    <div className="hidden md:block col-span-2 text-center font-medium text-gray-800 text-sm">{faNum(c.orders)}</div>
                    <div className="hidden md:block col-span-2 text-center">
                      <span className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{ color: convColor(c.conversion), background: convBg(c.conversion) }}>
                        {faPercent(c.conversion)}
                      </span>
                    </div>
                    <div
                      className="hidden md:block col-span-2 text-center text-gray-700 text-[11px] truncate"
                      title={faDate(c.last_visit)}
                    >
                      {faDate(c.last_visit)}
                    </div>
                  </div>

                  {/* پنل جزئیات */}
                  <div className={`px-3 md:px-3.5 pb-3 ${isOpen ? "block" : "hidden"}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[13px] text-gray-700">
                      {c.phone && (
                        <div className="flex items-center">
                          <Phone size={14} className="ml-1 text-gray-500" />
                          {faNum(c.phone)}
                        </div>
                      )}
                      {(c.address || c.building_number) && (
                        <div className="flex items-center">
                          <MapPin size={14} className="ml-1 text-gray-500" />
                          <span>
                            {c.address || "—"}
                            {c.building_number ? `، پلاک ${faNum(c.building_number)}` : ""}
                          </span>
                        </div>
                      )}
                      {c.municipality_zone && (
                        <div className="flex items-center">
                          <Hash size={14} className="ml-1 text-gray-500" />
                          منطقه شهرداری: {faNum(c.municipality_zone)}
                        </div>
                      )}
                    </div>

                    {c.last_note && (
                      <div className="rounded-lg p-2.5 text-[13px] text-gray-700 flex items-start gap-2 mt-2"
                           style={{ backgroundColor: "#F8FAFC", border: "1px solid #EEF2F7" }}>
                        <Info size={14} className="mt-0.5" style={{ color: cPrimary }} />
                        <span className="leading-6">{c.last_note}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===== Presentational ===== */
function KPI({ icon, label, value, color, bg }) {
  return (
    <div className="rounded-xl p-3 shadow-sm border bg-white" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: bg || "#F3F4F6", color }}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        <div className="text-base font-bold" style={{ color }}>{value}</div>
      </div>
    </div>
  );
}
function HeaderStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl p-3 border border-gray-200 bg-white">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-200" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
            <div className="h-4 w-10 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
      <div className="animate-pulse space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-200" />
            <div>
              <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-28 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-3 w-56 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <div className="h-7 bg-gray-100 rounded" />
          <div className="h-7 bg-gray-100 rounded" />
          <div className="h-7 bg-gray-100 rounded" />
          <div className="h-7 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
