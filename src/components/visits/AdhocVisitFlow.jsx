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
  Minimize2,
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

  // کنترل اندازه نقشه (کوچک/بزرگ)
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapSectionRef = useRef(null);

  useEffect(() => {
    // وقتی موقعیت گرفتیم، به بخش نقشه اسکرول کن
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
        setMapExpanded(false); // موبایل: کوچک شروع شود
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
    <div className="max-w-2xl mx-auto p-4 font-vazir">
      <div className="bg-white shadow-lg rounded-xl p-6 space-y-5">
        <div className="flex justify-between items-center border-b pb-2 mb-2">
          <h2 className="text-xl font-bold text-[#2B2E4A]">ثبت ویزیت جدید</h2>
          <button
            onClick={onBack || (() => navigate("/dashboard"))}
            className="text-sm text-[#903749] flex items-center"
          >
            <ArrowRight size={18} className="ml-1" />
            بازگشت
          </button>
        </div>

        <input
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="نام فروشگاه"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />

        <select
          className="w-full border border-gray-300 p-2 rounded"
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
            className="w-full border border-gray-300 p-2 rounded"
            placeholder="نوع فروشگاه (سایر)"
            value={customStoreType}
            onChange={(e) => setCustomStoreType(e.target.value)}
          />
        )}

        <div className="flex gap-2">
          <input
            className="w-1/2 border border-gray-300 p-2 rounded"
            placeholder="شماره تماس (اختیاری)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="w-1/2 border border-gray-300 p-2 rounded"
            placeholder="پلاک (اختیاری)"
            value={buildingNumber}
            onChange={(e) => setBuildingNumber(e.target.value)}
          />
        </div>

        <button
          onClick={handleGetLocation}
          className="flex items-center justify-center w-full bg-[#53354A] text-white p-2 rounded hover:bg-[#903749] transition"
        >
          <LocateFixed className="ml-2" size={18} />
          دریافت موقعیت مکانی
        </button>

        {location && (
          <div ref={mapSectionRef} className="space-y-3">
            {/* نقشه داخل ظرف ارتفاع‌دار (بدون دکمه شناور روی نقشه) */}
            <div className="w-full rounded-lg border overflow-hidden">
              <div className={`${mapExpanded ? "h-[65vh]" : "h-56 md:h-80"}`}>
                <MapNeshan
                  location={location}
                  onLocationSelect={setLocation}
                  onReverseResult={handleReverseResult}
                  apiKey="service.4887cec002ef4378bbf3e8005bbbdd47"
                  mapKey="web.2fc3a8093ae34cc8bb2e5af522452390"
                />
              </div>
            </div>

            {/* نوار کنترل خارج از نقشه: هیچ تداخلی با دکمه‌های دیگر ندارد */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setMapExpanded((s) => !s)}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-md px-3 py-1.5 text-xs md:text-sm hover:bg-gray-50"
              >
                {mapExpanded ? (
                  <>
                    <Minimize2 size={16} />
                    کوچک‌نمایی نقشه
                  </>
                ) : (
                  <>
                    <Maximize2 size={16} />
                    بزرگ‌نمایی نقشه
                  </>
                )}
              </button>
            </div>

            {address && (
              <p className="text-sm text-gray-600">
                آدرس: <span className="font-medium">{address}</span>
              </p>
            )}
            {municipalityZone && (
              <p className="text-sm text-gray-600">
                منطقه شهرداری: <span className="font-medium">{municipalityZone}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <button
            className={`flex-1 flex items-center justify-center p-2 rounded text-white transition ${
              hasOrder === true ? "bg-green-600" : "bg-green-400"
            }`}
            onClick={() => setHasOrder(true)}
          >
            <CheckCircle className="ml-2" size={18} />
            سفارش ثبت شد
          </button>
          <button
            className={`flex-1 flex items-center justify-center p-2 rounded text-white transition ${
              hasOrder === false ? "bg-red-600" : "bg-red-400"
            }`}
            onClick={() => setHasOrder(false)}
          >
            <XCircle className="ml-2" size={18} />
            سفارش ثبت نشد
          </button>
        </div>

        {hasOrder !== null && (
          <textarea
            className="w-full border border-gray-300 p-2 rounded"
            placeholder={
              hasOrder ? "توضیحات (اختیاری)" : "دلیل عدم ثبت سفارش (اجباری)"
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-[#2B2E4A] text-white p-2 rounded hover:bg-[#53354A] transition font-semibold"
        >
          ثبت نهایی ویزیت
        </button>
      </div>
    </div>
  );
}
