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

  // پس از تعیین لوکیشن، به بخش نقشه اسکرول نرم شود (دسکتاپ)
  useEffect(() => {
    if (location && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

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

  return (
    <div className="max-w-2xl md:max-w-2xl mx-auto p-3 md:p-4 font-vazir">
      <div className="bg-white shadow-lg rounded-xl p-4 md:p-6 space-y-4 md:space-y-5">
        {/* هدر */}
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-lg md:text-xl font-bold text-[#2B2E4A]">ثبت ویزیت جدید</h2>
          <button
            onClick={onBack || (() => navigate("/dashboard"))}
            className="btn link-quiet !px-2 !py-1 flex items-center"
          >
            <ArrowRight size={18} className="ml-1" />
            بازگشت
          </button>
        </div>

        {/* ورودی‌ها (فشرده برای موبایل) */}
        <div className="space-y-2">
          <input
            className="w-full border border-gray-300 rounded px-3 h-10 text-sm"
            placeholder="نام فروشگاه"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />

          <select
            className="w-full border border-gray-300 rounded px-3 h-10 text-sm bg-white"
            value={storeType}
            onChange={(e) => setStoreType(e.target.value)}
          >
            <option value="">نوع فروشگاه را انتخاب کنید</option>
            {storeTypeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          {storeType === "سایر" && (
            <input
              className="w-full border border-gray-300 rounded px-3 h-10 text-sm"
              placeholder="نوع فروشگاه (سایر)"
              value={customStoreType}
              onChange={(e) => setCustomStoreType(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full border border-gray-300 rounded px-3 h-10 text-sm"
              placeholder="شماره تماس (اختیاری)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              className="w-full border border-gray-300 rounded px-3 h-10 text-sm"
              placeholder="پلاک (اختیاری)"
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
            />
          </div>
        </div>

        {/* دکمه دریافت لوکیشن */}
        <button onClick={handleGetLocation} className="btn btn-primary w-full">
          <LocateFixed className="ml-2" size={18} />
          دریافت موقعیت مکانی
        </button>

        {/* نقشه کوچک + خلاصه آدرس (بدون اسکرول) */}
        {location && (
          <div ref={mapSectionRef} className="space-y-2">
            <div className="w-full rounded-lg border overflow-hidden">
              {/* موبایل: h-40 — دسکتاپ: h-80 */}
              <div className="h-40 md:h-80">
                <MapNeshan
                  location={location}
                  onLocationSelect={setLocation}
                  onReverseResult={handleReverseResult}
                  apiKey="service.4887cec002ef4378bbf3e8005bbbdd47"
                  mapKey="web.2fc3a8093ae34cc8bb2e5af522452390"
                />
              </div>
            </div>

            {/* لینک نقشه بزرگ در مودال (برای تنظیم دقیق) */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMapModalOpen(true)}
                className="btn bg-white border border-gray-200 shadow-sm text-[#2B2E4A]"
              >
                <Maximize2 size={16} />
                نقشه بزرگ
              </button>
            </div>

            {address && (
              <p className="text-xs md:text-sm text-gray-600">
                آدرس: <span className="font-medium">{address}</span>
              </p>
            )}
            {municipalityZone && (
              <p className="text-xs md:text-sm text-gray-600">
                منطقه شهرداری: <span className="font-medium">{municipalityZone}</span>
              </p>
            )}
          </div>
        )}

        {/* انتخاب وضعیت سفارش (فشرده) */}
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

        {/* توضیحات (فقط وقتی وضعیت مشخص شد) — ۲ ردیفه برای عدم اسکرول */}
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

      {/* مودال نقشه بزرگ برای موبایل/دسکتاپ */}
      {mapModalOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3"
          onClick={() => setMapModalOpen(false)}
        >
          <div
            className="relative bg-white w-full max-w-3xl h-[80vh] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMapModalOpen(false)}
              className="absolute top-3 left-3 z-10 btn bg-white/90 hover:bg-white"
              aria-label="بستن"
              title="بستن"
            >
              <CloseIcon size={18} />
              بستن
            </button>
            <div className="absolute inset-0">
              <MapNeshan
                location={location}
                onLocationSelect={setLocation}
                onReverseResult={handleReverseResult}
                apiKey="service.4887cec002ef4378bbf3e8005bbbdd47"
                mapKey="web.2fc3a8093ae34cc8bb2e5af522452390"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
