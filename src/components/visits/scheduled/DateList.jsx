// src/components/visits/scheduled/DateList.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import MobileScreen from "../../shared/MobileScreen";
import { Route, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function DateList({ user }) {
  const [schedules, setSchedules] = useState([]);
  const [doneMap, setDoneMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const navigate = useNavigate();

  const smartBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError("");
    try {
      // برنامه‌ها
      const { data: sData, error: sErr } = await supabase
        .from("schedules")
        .select("id,date_label,schedule_locations(location_id)")
        .eq("visitor_id", user.id)
        .order("date", { ascending: true });

      if (sErr) throw sErr;

      const normalized =
        (sData || []).map((s) => ({
          id: s.id,
          date_label: s.date_label,
          count: s.schedule_locations?.length || 0,
        })) || [];
      setSchedules(normalized);

      // ویزیت‌های انجام‌شده برای شمارش
      const { data: notes, error: nErr } = await supabase
        .from("visit_notes")
        .select("schedule_id")
        .eq("visitor_id", user.id);

      if (nErr) throw nErr;

      const counter = {};
      (notes || []).forEach((n) => {
        counter[n.schedule_id] = (counter[n.schedule_id] || 0) + 1;
      });
      setDoneMap(counter);
    } catch (e) {
      console.error("Fetch error:", e);
      setFetchError(e?.message || "اشکال در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  return (
    <MobileScreen title="انتخاب تاریخ ویزیت" right={<Route size={18} />} onBack={smartBack}>
      {/* خطا */}
      {fetchError && (
        <div className="mb-1 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={18} />
          <span className="text-sm">{fetchError}</span>
        </div>
      )}

      {/* لودینگ */}
      {loading && (
        <ul className="space-y-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="skeleton-line" />
          ))}
        </ul>
      )}

      {!loading && (
        <>
          <ul className="space-y-2">
            {schedules.map((s) => {
              const done = doneMap[s.id] || 0;
              const total = s.count;
              const allDone = total > 0 && done >= total;

              return (
                <li key={s.id}>
                  <button
                    onClick={() => navigate(`/m/visit/scheduled/${s.id}`)}
                    className="btn-card"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.date_label}</span>
                      <span className="chip">{`${done}/${total}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {allDone && <CheckCircle size={18} className="text-green-500" />}
                      <ChevronLeft size={18} className="text-gray-400" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {schedules.length === 0 && (
            <p className="text-gray-500 p-6 text-center">
              هیچ برنامه ویزیت فعالی یافت نشد.
            </p>
          )}
        </>
      )}
    </MobileScreen>
  );
}
