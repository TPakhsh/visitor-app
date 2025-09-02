// src/components/customers/CustomerDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  Store, MapPin, Phone, Hash, Info, Gauge, Clock,
  Navigation, ArrowRight, CheckCircle2, XCircle
} from "lucide-react";

/* ===== Helpers ===== */
const persianDigits = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const faNum = (x) => (x == null ? "—" : String(x).replace(/\d/g, d => persianDigits[+d]));
const faPercent = (p) => (p == null || isNaN(p) ? "—" : `${faNum(p)}٪`);
const faDate = (iso) => { try { return iso ? new Date(iso).toLocaleString("fa-IR") : "—"; } catch { return "—"; } };
const faDateShort = (iso) => {
  try {
    if (!iso) return "—";
    const d = new Date(iso);
    const date = d.toLocaleDateString("fa-IR");
    const time = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
  } catch { return "—"; }
};
const normName = (s) => (s || "").trim().toLowerCase();
const isUuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

const cPrimary = "#2B2E4A", cBurgundy = "#903749", cDeep = "#53354A";
const convColor = (c0) => { const c = Math.max(0, Math.min(100, Number(c0)||0)); const hue = (c*120)/100; return `hsl(${hue} 70% 38%)`; };
const convBg    = (c0) => { const c = Math.max(0, Math.min(100, Number(c0)||0)); const hue = (c*120)/100; return `hsl(${hue} 85% 96%)`; };

const isAndroid = () => /android/i.test(navigator.userAgent);
const isiOSMac  = () => /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent);

/** مسیریابی یک‌کلیکی */
function oneClickNavHref({ lat, lng, label }) {
  const enc = encodeURIComponent(label || "Destination");
  if (isAndroid()) {
    return (lat != null && lng != null)
      ? `geo:${lat},${lng}?q=${lat},${lng}(${enc})`
      : `geo:0,0?q=${enc}`;
  }
  if (isiOSMac()) {
    return (lat != null && lng != null)
      ? `http://maps.apple.com/?ll=${lat},${lng}&q=${enc}`
      : `http://maps.apple.com/?q=${enc}`;
  }
  return (lat != null && lng != null)
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${enc}`;
}

/* ===== KPI (Card) ===== */
function KPI({ label, value, color, bg, icon, valueClassName, valueTitle, className = "" }) {
  return (
    <div className={`rounded-xl p-3 border bg-white shadow-sm ${className}`} style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] md:text-xs text-gray-500 flex items-center gap-2 min-w-0">
          {icon ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg"
                  style={{ backgroundColor: bg || "#F3F4F6", color }}>
              {icon}
            </span>
          ) : null}
          <span className="truncate">{label}</span>
        </div>
        <div
          className={`shrink min-w-0 text-right whitespace-nowrap overflow-hidden text-ellipsis ${valueClassName || "font-semibold"}`}
          style={{ color }}
          title={valueTitle || (typeof value === "string" ? value : undefined)}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* ===== Component ===== */
export default function CustomerDetail() {
  const { locationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState(null);
  const [display, setDisplay] = useState({ phone: null, address: null, building_number: null, municipality_zone: null });
  const [stats, setStats] = useState({ total: 0, orders: 0, conv: 0, last: null, storeType: "—" });
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]); // visits + visit_notes (با توضیح هر ویزیت)

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true); setError("");
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || null;

      let ent = null;
      let nameKey = null;

      if (isUuid(locationId)) {
        // customers ← locations
        const { data: cust } = await supabase.from("customers").select("*").eq("id", locationId).maybeSingle();
        if (cust) ent = { source: "customers", ...cust };
        if (!ent) {
          const { data: loc } = await supabase.from("locations").select("*").eq("id", locationId).maybeSingle();
          if (loc) ent = { source: "locations", ...loc };
        }
        nameKey = normName(ent?.name);
      } else {
        // adhoc-<name> / report-<name>
        const decoded = decodeURIComponent(String(locationId));
        nameKey = normName(decoded.replace(/^adhoc\-|^report\-/, ""));
        if (nameKey) {
          const { data: custByName } = await supabase.from("customers").select("*").ilike("name", `%${nameKey}%`);
          const custExact = (custByName || []).find(
            c => normName(c.name) === nameKey && (!c.created_by || c.created_by === uid)
          );
          if (custExact) ent = { source: "customers", ...custExact };

          if (!ent) {
            const { data: locByName } = await supabase.from("locations").select("*").ilike("name", `%${nameKey}%`);
            const locExact = (locByName || []).find(l => normName(l.name) === nameKey);
            if (locExact) ent = { source: "locations", ...locExact };
          }
          if (!ent) ent = { source: "adhoc", name: decoded.replace(/^adhoc\-|^report\-/, "") };
        }
      }

      if (!ent) { if (mounted) { setError("مشتری/لوکیشن یافت نشد."); setLoading(false); } return; }

      // تکمیل مختصات از locations هم‌نام در صورت نبود
      if ((ent.latitude == null || ent.longitude == null) && ent.name) {
        const { data: locMatch } = await supabase.from("locations").select("*").ilike("name", `%${ent.name}%`);
        const loc = (locMatch || []).find(l => normName(l.name) === normName(ent.name));
        if (loc && (loc.latitude != null && loc.longitude != null)) {
          ent.latitude = loc.latitude; ent.longitude = loc.longitude;
        }
      }

      // ← پرکردن اطلاعات نمایشی (fallback از آخرین ویزیت کاربر و سپس location هم‌نام)
      let phone = ent.phone ?? null,
          address = ent.address ?? null,
          building_number = ent.building_number ?? null,
          municipality_zone = ent.municipality_zone ?? null;

      if (uid && nameKey) {
        const { data: lastVisit } = await supabase
          .from("visits")
          .select("phone,address,building_number,municipality_zone,created_at,store_name,user_id")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(200);
        const visitHit = (lastVisit || []).find(v => normName(v.store_name) === nameKey);
        if (visitHit) {
          phone = phone ?? visitHit.phone ?? null;
          address = address ?? visitHit.address ?? null;
          building_number = building_number ?? visitHit.building_number ?? null;
          municipality_zone = municipality_zone ?? visitHit.municipality_zone ?? null;
        }
      }

      if ((!phone || !address) && ent.name) {
        const { data: locMore } = await supabase.from("locations").select("phone,address").ilike("name", `%${ent.name}%`);
        const lm = (locMore || []).find(l => normName(l.name) === normName(ent.name));
        if (lm) {
          phone = phone ?? lm.phone ?? null;
          address = address ?? lm.address ?? null;
        }
      }

      if (mounted) {
        setEntity(ent);
        setDisplay({ phone, address, building_number, municipality_zone });
      }

      // آمار + تاریخچه‌ی ویزیت‌ها (دو منبع)
      if (uid && nameKey) {
        const [vRes, rRes, nRes] = await Promise.all([
          supabase.from("visits").select("id, store_name, store_type, shop_type, has_order, order_placed, description, created_at")
            .eq("user_id", uid).order("created_at", { ascending: false }),
          supabase.from("reports").select("id, location_id, location_name, order_placed, store_type, created_at")
            .eq("visitor_id", uid).order("created_at", { ascending: false }),
          supabase.from("visit_notes").select("id, location_id, note, has_order, created_at, schedule_id")
            .eq("visitor_id", uid).order("created_at", { ascending: false }),
        ]);

        const visits = (vRes.data || []).filter(v => normName(v.store_name) === nameKey);

        // location_idهای دقیق برای notes
        const { data: locMatches } = await supabase.from("locations").select("id,name").ilike("name", `%${ent.name || nameKey}%`);
        const exactLocIds = new Set((locMatches || []).filter(l => normName(l.name) === nameKey).map(l => String(l.id)));
        const notes = (nRes.data || []).filter(n => exactLocIds.has(String(n.location_id)));

        // تاریخچه با نوع ویزیت + توضیح همان ویزیت
        const normOrder = (x1, x2) => (typeof x1 === "boolean" ? x1 : undefined) ?? (typeof x2 === "boolean" ? x2 : false);
        const h1 = visits.map(v => ({ id: `v-${v.id}`, created_at: v.created_at, has_order: normOrder(v.has_order, v.order_placed), desc: v.description || null, kind: "visit" }));
        const h2 = notes.map(n => ({ id: `n-${n.id}`, created_at: n.created_at, has_order: !!n.has_order, desc: n.note || null, kind: n.schedule_id ? "scheduled" : "note" }));
        const merged = [...h1, ...h2].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (mounted) setHistory(merged);

        // نوع فروشگاه از آخرین رخداد visits/reports، سپس fallback از entity/locations
        let bestType = null, bestTs = 0;
        for (const v of visits) {
          const t = v.store_type || v.shop_type; if (!t) continue;
          const ts = new Date(v.created_at).getTime(); if (ts > bestTs) { bestTs = ts; bestType = t; }
        }
        for (const r of (rRes.data || []).filter(r => normName(r.location_name) === nameKey)) {
          const t = r.store_type; if (!t) continue;
          const ts = new Date(r.created_at).getTime(); if (ts > bestTs) { bestTs = ts; bestType = t; }
        }
        if (!bestType) bestType = ent.store_type || "—";

        // KPIها
        let total = 0, orders = 0, last = null;
        for (const v of visits) {
          total++; if (normOrder(v.has_order, v.order_placed)) orders++;
          if (!last || new Date(v.created_at) > new Date(last)) { last = v.created_at; }
        }
        for (const n of notes) {
          total++; if (n.has_order) orders++;
          if (!last || new Date(n.created_at) > new Date(last)) { last = n.created_at; }
        }
        const conv = total ? Math.round((orders / total) * 100) : 0;

        if (mounted) setStats({ total, orders, conv, last, storeType: bestType || "—" });
      }

      if (mounted) setLoading(false);
    }
    run();
    return () => { mounted = false; };
  }, [locationId]);

  const navHref = useMemo(() => oneClickNavHref({
    lat: entity?.latitude, lng: entity?.longitude, label: entity?.name
  }), [entity?.latitude, entity?.longitude, entity?.name]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-3 md:p-6">
        <div className="rounded-2xl p-3 md:p-4 border bg-white border-gray-200 animate-pulse text-gray-600">
          در حال بارگذاری جزئیات مشتری...
        </div>
      </div>
    );
  }

  if (!entity || error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-3 md:p-6">
        <div className="rounded-2xl p-3 md:p-4 border bg-white border-red-200 text-red-700">
          {error || "مشتری یافت نشد."}
        </div>
        <div className="mt-2 flex justify-end">
          <button onClick={() => navigate(-1)} className="text-sm inline-flex items-center gap-1 rounded-lg px-3 py-1.5 border hover:bg-gray-50" style={{ color: cPrimary, borderColor: "#E5E7EB" }}>
            <ArrowRight size={16} /> بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-3 md:p-6">
      <div className="rounded-2xl p-3 md:p-5 border bg-white border-gray-200 shadow-sm">
        {/* هدر: Grid سه‌ستونه برای نظم و فشردگی در موبایل */}
        <div className="grid grid-cols-12 items-center gap-2 mb-3">
          {/* بازگشت (راست) */}
          <div className="col-span-4 md:col-span-3 justify-self-start">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm shadow-sm hover:shadow bg-white"
              style={{ color: cPrimary, borderColor: "#E5E7EB" }}
              title="بازگشت"
            >
              <ArrowRight size={16} />
              بازگشت
            </button>
          </div>

          {/* عنوان + نوع فروشگاه (مرکز/راست) */}
          <div className="col-span-8 md:col-span-6 justify-self-center md:justify-self-auto">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600 shrink-0">
                <Store size={20} />
              </span>
              <div className="min-w-0">
                <h1 className="text-base md:text-xl font-bold text-gray-900 truncate max-w-[70vw] md:max-w-none">
                  {entity.name || "—"}
                </h1>
                <div className="text-[11px] md:text-sm text-gray-600">
                  نوع فروشگاه: <span className="font-medium" style={{ color: cDeep }}>{stats.storeType || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* اکشن‌ها (چپ) */}
          <div className="col-span-12 md:col-span-3 justify-self-stretch md:justify-self-end mt-1 md:mt-0">
            <div className="flex flex-row flex-wrap gap-1.5 md:justify-end">
              <a
                href={navHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm shadow-sm hover:shadow bg-white"
                style={{ color: cPrimary, borderColor: "#E5E7EB" }}
                title="مسیریابی"
              >
                <Navigation size={16} />
                مسیریابی
              </a>
              {display.phone && (
                <a
                  href={`tel:${String(display.phone).replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm shadow-sm hover:shadow bg-white"
                  style={{ color: cPrimary, borderColor: "#E5E7EB" }}
                  title="تماس"
                >
                  <Phone size={16} />
                  تماس
                </a>
              )}
            </div>
          </div>
        </div>

        {/* اطلاعات مشتری (فشرده و منظم) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-[13px] md:text-sm text-gray-800">
          {display.phone && (
            <div className="flex items-center">
              <Phone size={16} className="ml-1 text-gray-500" />
              {faNum(display.phone)}
            </div>
          )}
          {(display.address || display.building_number) && (
            <div className="flex items-center">
              <MapPin size={16} className="ml-1 text-gray-500" />
              <span className="truncate">
                {display.address || "—"}
                {display.building_number ? `، پلاک ${faNum(display.building_number)}` : ""}
              </span>
            </div>
          )}
          {display.municipality_zone && (
            <div className="flex items-center">
              <Hash size={16} className="ml-1 text-gray-500" />
              منطقه شهرداری: {faNum(display.municipality_zone)}
            </div>
          )}
        </div>

        {/* KPIها: نسخه موبایل اسکرول افقی */}
        <div className="md:hidden -mx-3 px-3 mt-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <KPI label="تعداد ویزیت" value={faNum(stats.total)} color={cDeep} />
            <KPI label="سفارش‌ها" value={faNum(stats.orders)} color={cBurgundy} />
            <KPI label="نرخ تبدیل" value={faPercent(stats.conv)} color={convColor(stats.conv)} bg={convBg(stats.conv)} icon={<Gauge size={16} />} />
            <KPI label="آخرین ویزیت" value={faDateShort(stats.last)} valueTitle={faDate(stats.last)} color={cPrimary} icon={<Clock size={16} />} valueClassName="text-[12px] font-normal text-gray-700" />
          </div>
        </div>

        {/* KPIها: نسخه دسکتاپ Grid */}
        <div className="hidden md:grid grid-cols-4 gap-3 mt-3">
          <KPI label="تعداد ویزیت" value={faNum(stats.total)} color={cDeep} />
          <KPI label="سفارش‌ها" value={faNum(stats.orders)} color={cBurgundy} />
          <KPI label="نرخ تبدیل" value={faPercent(stats.conv)} color={convColor(stats.conv)} bg={convBg(stats.conv)} icon={<Gauge size={16} />} />
          <KPI label="آخرین ویزیت" value={faDateShort(stats.last)} valueTitle={faDate(stats.last)} color={cPrimary} icon={<Clock size={16} />} valueClassName="text-[13px] font-normal text-gray-700" />
        </div>

        {/* سوابق ویزیت (visits + visit_notes) — هر ردیف با تاریخ، وضعیت سفارش، نوع ویزیت و توضیح همان ویزیت */}
        <div className="mt-4">
          <h2 className="text-[13px] md:text-sm font-bold text-gray-900 mb-2">سوابق ویزیت</h2>
          {history.length === 0 ? (
            <div className="text-[12px] md:text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-2.5">
              سابقه‌ای برای این مشتری ثبت نشده است.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {history.map(h => (
                <li key={h.id} className="border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[12px] md:text-xs text-gray-700">
                      <Clock size={14} className="text-gray-500" />
                      <span className="font-medium">{faDate(h.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* نوع ویزیت */}
                      {h.kind !== "note" && (
                        <span className={`inline-flex items-center gap-1 text-[10px] md:text-[11px] px-2 py-0.5 rounded-full border ${h.kind === "visit" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}>
                          {h.kind === "visit" ? "میدانی" : "برنامه‌ریزی‌شده"}
                        </span>
                      )}
                      {/* وضعیت سفارش */}
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${h.has_order ? "text-green-700 bg-green-50 border border-green-200" : "text-red-700 bg-red-50 border border-red-200"}`}>
                        {h.has_order ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {h.has_order ? "سفارش ثبت‌شده" : "سفارش ثبت‌نشده"}
                      </span>
                    </div>
                  </div>
                  {h.desc && (
                    <div className="mt-1.5 text-[12px] md:text-xs text-gray-700 flex items-start gap-1.5">
                      <Info size={13} className="mt-0.5 text-gray-500" />
                      <span className="leading-6">{h.desc}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* نوار اقدام ثابت پایین برای موبایل */}
      <div
        className="fixed inset-x-0 bottom-0 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        role="navigation"
        aria-label="اقدامات مشتری"
      >
        <div className="mx-auto max-w-4xl px-3 pb-3">
          <div className="rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden flex">
            <a
              href={navHref}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 text-center font-bold"
              style={{ color: cPrimary }}
              aria-label="مسیریابی به مشتری"
            >
              مسیریابی
            </a>
            {display.phone && (
              <a
                href={`tel:${String(display.phone).replace(/\s+/g, "")}`}
                className="flex-1 py-3 text-center font-bold border-r border-gray-200"
                style={{ color: cPrimary }}
                aria-label={`تماس با ${entity?.name || "مشتری"}`}
              >
                تماس
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
