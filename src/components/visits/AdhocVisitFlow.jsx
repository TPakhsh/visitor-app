// src/components/visits/AdhocVisitFlow.jsx
import React, { useRef, useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import MapNeshan from "../MapNeshan";
import {
  LocateFixed,
  CheckCircle,
  XCircle,
  ArrowRight,
  Maximize2,
  X as CloseIcon,
} from "lucide-react";

export default function AdhocVisitFlow({ user, onBack }) {
  const navigate = useNavigate();
  const [storeType, setStoreType] = useState("");
  const [customStoreType, setCustomStoreType] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [location, setLocation] = useState(null);
  const [hasOrder, setHasOrder] = useState(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [municipalityZone, setMunicipalityZone] = useState("");

  // نقشه کوچک در صفحه؛ نقشه بزرگ در مودال
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const mapSectionRef = useRef(null);

  // اسکرول نرم به بخش نقشه بعد از تعیین لوکیشن (اگر محتوا بلند شد)
  useEffect(() => {
    if (location && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

  // قفل اسکرول پشت‌صحنه هنگام باز بودن مودال
  useEffect(() => {
    const original = document.body.style.overflow;
    if (mapModalOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = original || "";
    return () => { document.body.style.overflow = original || ""; };
  }, [mapModalOpen]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
      },
      (err) => {
        console.error("خطا در دریافت موقعیت مکانی:", err);
        alert("عدم امکان دریافت موقعیت مکانی: " + err.message);
      }
    );
  };

  const handleReverseResult = (data) => {
    setAddress(data.formatted_address || "");
    setMunicipalityZone(data.municipality_zone || "");
  };

  const handleSubmit = async () => {
    const finalStoreType = storeType === "سایر" ? customStoreType : storeType;

    if (!storeName || !finalStoreType || !location || hasOrder === null) {
      alert("لطفاً تمام فیلدهای ضروری را کامل کنید.");
      return;
    }
    if (!hasOrder && !description.trim()) {
      alert("لطفاً دلیل عدم ثبت سفارش را وارد کنید.");
      return;
    }

    const { error } = await supabase.from("visits").insert({
      user_id: user.id,
      store_name: storeName,
      store_type: finalStoreType,
      phone: phone || null,
      building_number: buildingNumber || null,
      latitude: location.lat,
      longitude: location.lng,
      address: address || null,
      municipality_zone: municipalityZone || null,
      has_order: hasOrder,
      note: description || null,
    });

    if (error) {
      alert("خطا در ثبت ویزیت: " + error.message);
    } else {
      alert("ویزیت با موفقیت ثبت شد.");
      navigate("/dashboard");
    }
  };

  const storeTypeOptions = [
    "داروخانه",
    "سوپرمارکت",
    "پت شاپ",
    "شوینده بهداشتی",
    "آرایشی بهداشتی",
    "سایر",
  ];

  const mapKeyMini = location
    ? `mini-${location.lat.toFixed(6)}-${location.lng.toFixed(6)}`
    : "mini-none";
  const mapKeyModal = location
    ? `modal-${location.lat.toFixed(6)}-${location.lng.toFixed(6)}`
    : "modal-none";

  return (
    <div className="max-w-2xl md:max-w-2xl mx-auto p-3 md:p-4 font-vazir">
      <div className="bg-white shadow-lg rounded-xl p-4 md:p-5 space-y-3 md:space-y-4">
        {/* هدر */}
        <div className="flex justify-between items-center border-b pb-1.5 mb-1.5">
          <h2 className="text-lg md:text-xl font-bold text-[#2B2E4A]">ثبت ویزیت جدید</h2>
          <button
            onClick={onBack || (() => navigate("/dashboard"))}
            className="btn link-quiet !px-2 !py-1 inline-flex items-center gap-1"
          >
            <ArrowRight size={18} />
            بازگشت
          </button>
        </div>

        {/* نام فروشگاه (عریض‌تر) + نوع فروشگاه (کم‌عرض‌تر) — حتی در موبایل دو ستونه */}
        <div className="grid grid-cols-12 gap-2">
          <input
            className="w-full border border-gray-300 rounded px-3 h-10 md:h-9 text-sm col-span-8 md:col-span-9 min-w-0"
            placeholder="نام فروشگاه"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
          <select
            className="w-full border border-gray-300 rounded px-3 h-10 md:h-9 text-sm bg-white col-span-4 md:col-span-3"
            value={storeType}
            onChange={(e) => setStoreType(e.target.value)}
          >
            <option value="">نوع فروشگاه </option>
            {storeTypeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        {storeType === "سایر" && (
          <input
            className="w-full border border-gray-300 rounded px-3 h-10 md:h-9 text-sm"
            placeholder="نوع فروشگاه (سایر)"
            value={customStoreType}
            onChange={(e) => setCustomStoreType(e.target.value)}
          />
        )}

        {/* شماره تماس + پلاک */}
        <div className="grid grid-cols-2 gap-2">
          <input
            className="w-full border border-gray-300 rounded px-3 h-10 md:h-9 text-sm"
            placeholder="شماره تماس (اختیاری)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-full border border-gray-300 rounded px-3 h-10 md:h-9 text-sm"
            placeholder="پلاک (اختیاری)"
            value={buildingNumber}
            onChange={(e) => setBuildingNumber(e.target.value)}
          />
        </div>

        {/* دکمه دریافت لوکیشن */}
        <button
          onClick={handleGetLocation}
          className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          <LocateFixed size={18} />
          دریافت موقعیت مکانی
        </button>

        {/* نقشه کوچک + خلاصه آدرس (مینی‌مپ فقط وقتی مودال بسته است) */}
        {location && !mapModalOpen && (
          <div ref={mapSectionRef} className="space-y-2">
            <div className="w-full rounded-lg border overflow-hidden relative z-0">
              {/* موبایل: 36dvh / دسکتاپ: h-52 (کوچک‌تر تا اسکرول دسکتاپ حذف شود) */}
              <div className="h-[36dvh] md:h-52 mobile-vh-fallback relative">
                <MapNeshan
                  key={mapKeyMini}
                  hideSearch
                  className="h-full"
                  location={location}
                  onLocationSelect={setLocation}
                  onReverseResult={handleReverseResult}
                  apiKey="service.4887cec002ef4378bbf3e8005bbbdd47"
                  mapKey="web.2fc3a8093ae34cc8bb2e5af522452390"
                  zoom={15}
                />

                {/* دکمه نقشه بزرگ روی خود نقشه - پایین راست */}
                <button
                  type="button"
                  onClick={() => setMapModalOpen(true)}
                  className="absolute bottom-3 right-3 z-20 pointer-events-auto inline-flex items-center gap-1 bg-white/95 hover:bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow"
                >
                  نقشه بزرگ
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            {/* آدرس و منطقه در یک خط */}
            {(address || municipalityZone) && (
              <p className="text-xs md:text-sm text-gray-600">
                {address && (
                  <>
                    آدرس: <span className="font-medium">{address}</span>
                  </>
                )}
                {address && municipalityZone && <span className="mx-2">•</span>}
                {municipalityZone && (
                  <>
                    منطقه: <span className="font-medium">{municipalityZone}</span>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {/* انتخاب وضعیت سفارش */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`h-10 rounded text-white text-sm flex items-center justify-center transition ${
              hasOrder === true ? "bg-green-600" : "bg-green-500 hover:bg-green-600"
            }`}
            onClick={() => setHasOrder(true)}
          >
            <CheckCircle className="ml-2" size={18} />
            سفارش ثبت شد
          </button>
          <button
            className={`h-10 rounded text-white text-sm flex items-center justify-center transition ${
              hasOrder === false ? "bg-red-600" : "bg-red-500 hover:bg-red-600"
            }`}
            onClick={() => setHasOrder(false)}
          >
            <XCircle className="ml-2" size={18} />
            سفارش ثبت نشد
          </button>
        </div>

        {/* توضیحات */}
        {hasOrder !== null && (
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            rows={2}
            placeholder={hasOrder ? "توضیحات (اختیاری)" : "دلیل عدم ثبت سفارش (اجباری)"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        {/* ثبت نهایی */}
        <button onClick={handleSubmit} className="btn btn-primary w-full font-semibold">
          ثبت نهایی ویزیت
        </button>
      </div>

      {/* مودال نقشه بزرگ */}
      {mapModalOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3"
          onClick={() => setMapModalOpen(false)}
        >
          <div
            className="relative bg-white w-full max-w-3xl h-[88dvh] mobile-vh-fallback rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* دکمه بستن: بالا-سمت راست + z بالا */}
            <button
              onClick={() => setMapModalOpen(false)}
              className="absolute top-3 right-3 z-30 inline-flex items-center gap-1 bg-white/95 hover:bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow"
              aria-label="بستن"
              title="بستن"
            >
              <CloseIcon size={18} />
              بستن
            </button>

            {/* خود نقشه (زیر دکمه‌ها) */}
            <div className="absolute inset-0 z-0">
              <MapNeshan
                key={mapKeyModal}
                hideSearch
                className="h-full"
                location={location}
                onLocationSelect={setLocation}
                onReverseResult={handleReverseResult}
                apiKey="service.4887cec002ef4378bbf3e8005bbbdd47"
                mapKey="web.2fc3a8093ae34cc8bb2e5af522452390"
                zoom={16}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
