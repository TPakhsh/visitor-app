// src/components/visits/scheduled/LocationDetailScreen.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import MobileScreen from "../../shared/MobileScreen";
import LocationDetail from "../LocationDetail";
import { AlertCircle } from "lucide-react";

export default function LocationDetailScreen({ user }) {
  const navigate = useNavigate();
  const { scheduleId, locationId } = useParams();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const smartBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  const fetchLocation = async () => {
    setLoading(true);
    setFetchError("");
    try {
      // فقط اطلاعات مکان را از جدول locations می‌خوانیم
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("id", locationId)
        .single();

      if (error) throw error;
      setLocation(data || null);

      // ریست اسکرول برای تجربه بهتر
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (e) {
      console.error(e);
      setFetchError(e?.message || "اشکال در دریافت اطلاعات مکان");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // بعد از ثبت ویزیت، برگردیم عقب (و در نهایت به داشبورد)
  const handleVisitComplete = () => {
    smartBack();
  };

  return (
    <MobileScreen
      title="جزئیات مکان"
      onBack={smartBack}
      // دکمه بروزرسانی حذف شد
    >
      {/* خطا */}
      {fetchError && (
        <div className="mb-3 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={18} />
          <span className="text-sm">{fetchError}</span>
        </div>
      )}

      {/* لودینگ شِیمر ساده */}
      {loading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-5 w-40 bg-gray-100 rounded" />
          <div className="h-28 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      )}

      {!loading && location && (
        <LocationDetail
          location={location}
          user={user}
          scheduleId={scheduleId}
          onVisitComplete={handleVisitComplete}
        />
      )}

      {!loading && !location && !fetchError && (
        <p className="text-gray-500 p-6 text-center">اطلاعاتی یافت نشد.</p>
      )}
    </MobileScreen>
  );
}
