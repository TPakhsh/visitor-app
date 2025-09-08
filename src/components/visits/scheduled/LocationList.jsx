// src/components/visits/scheduled/LocationList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import MobileScreen from "../../shared/MobileScreen";
import { CheckCircle, Search, AlertCircle } from "lucide-react";

export default function LocationList({ user }) {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  const [dateLabel, setDateLabel] = useState("");
  const [locations, setLocations] = useState([]);
  const [visitedMap, setVisitedMap] = useState({});
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const smartBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError("");
    try {
      // برنامه + مکان‌ها
      const { data: s, error: sErr } = await supabase
        .from("schedules")
        .select("id,date_label,schedule_locations(location_id,locations(*))")
        .eq("id", scheduleId)
        .single();

      if (sErr) throw sErr;

      setDateLabel(s?.date_label || "");
      const locs =
        s?.schedule_locations?.map((sl) => sl.locations).filter(Boolean) || [];
      setLocations(locs);

      // ویزیت‌های انجام‌شده (این تاریخ)
      const { data: notes, error: nErr } = await supabase
        .from("visit_notes")
        .select("location_id")
        .eq("visitor_id", user.id)
        .eq("schedule_id", scheduleId);

      if (nErr) throw nErr;

      const visited = {};
      (notes || []).forEach((n) => {
        visited[n.location_id] = true;
      });
      setVisitedMap(visited);
    } catch (e) {
      console.error(e);
      setFetchError(e?.message || "اشکال در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId, user.id]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? locations.filter(
          (l) =>
            l?.name?.toLowerCase().includes(q) ||
            l?.address?.toLowerCase().includes(q)
        )
      : locations.slice();

    // اول، انجام‌نشده؛ بعد انجام‌شده
    return list.sort((a, b) => {
      const va = visitedMap[a.id] ? 1 : 0;
      const vb = visitedMap[b.id] ? 1 : 0;
      return va - vb;
    });
  }, [locations, visitedMap, query]);

  return (
    <MobileScreen title="انتخاب مکان" onBack={smartBack}>
      {/* برچسب تاریخ زیر هدر */}
      <p className="text-[12px] text-gray-500 mb-2">{dateLabel}</p>

      {/* خطا */}
      {fetchError && (
        <div className="mb-1 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={18} />
          <span className="text-sm">{fetchError}</span>
        </div>
      )}

      {/* جستجو */}
      <div className="relative mb-2">
        <Search className="absolute right-3 top-2.5 text-gray-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو بر اساس نام یا آدرس…"
          className="input-clean pr-9"
        />
      </div>

      {/* لودینگ */}
      {loading && (
        <ul className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="skeleton-line" />
          ))}
        </ul>
      )}

      {!loading && (
        <>
          <ul className="space-y-2">
            {filtered.map((loc) => (
              <li key={loc.id}>
                <button
                  onClick={() =>
                    navigate(`/m/visit/scheduled/${scheduleId}/${loc.id}`)
                  }
                  className="btn-card"
                >
                  <div className="ml-3 text-right">
                    <span className="font-medium block truncate max-w-[60vw]">
                      {loc.name || ""}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[60vw]">
                      {loc.address || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {visitedMap[loc.id] && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && (
            <p className="text-gray-500 p-6 text-center">مکانی یافت نشد.</p>
          )}
        </>
      )}
    </MobileScreen>
  );
}
