// نسخه کامل VisitHistory.jsx با دکمه بازگشت و نمایش درست توضیحات (description یا note)

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import MapNeshanForHistory from "../MapNeshanForHistory";
import {
  Search, MapPin, Clock, Phone, Hash,
  ChevronDown, ChevronUp, ExternalLink,
  Filter, SortAsc, SortDesc, Store, Star, Info, ArrowRight
} from "lucide-react";

export default function VisitHistory({ user }) {
  const navigate = useNavigate();

  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStore, setExpandedStore] = useState(null);
  const [groups, setGroups] = useState({});
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterOrder, setFilterOrder] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  useEffect(() => {
    async function fetchData() {
      const [adhocResult, notesResult, locsResult] = await Promise.all([
        supabase.from("visits").select("*").eq("user_id", user.id),
        supabase.from("visit_notes").select("*").eq("visitor_id", user.id),
        supabase.from("locations").select("*")
      ]);

      const adhocData = adhocResult.data || [];
      const notes = notesResult.data || [];
      const locations = locsResult.data || [];

      const locMap = Object.fromEntries(
        locations.map((loc) => [loc.id, loc])
      );

      const plannedMapped = notes.map((item) => {
        const loc = locMap[item.location_id] || {};
        return {
          id: item.id,
          created_at: item.created_at,
          store_name: loc.name || "—",
          store_type: "ویزیت برنامه‌ریزی‌شده",
          phone: loc.phone || null,
          address: loc.address || null,
          description: item.note || null,
          latitude: loc.latitude ?? loc.coords?.lat,
          longitude: loc.longitude ?? loc.coords?.lng,
          building_number: loc.building_number || null,
          municipality_zone: loc.municipality_zone || null,
          has_order: item.has_order,
          scheduled: true,
        };
      });

      setVisits([...adhocData, ...plannedMapped]);
    }

    fetchData();
  }, [user]);

  useEffect(() => {
    let filteredVisits = [...visits];
    if (filterOrder !== "all") {
      filteredVisits = filteredVisits.filter((v) =>
        filterOrder === "has_order"
          ? v.has_order
          : filterOrder === "no_order"
          ? !v.has_order
          : true
      );
    }
    if (filterType !== "all") {
      filteredVisits = filteredVisits.filter((v) => v.store_type === filterType);
    }
    filteredVisits.sort((a, b) => {
      const x = a[sortField];
      const y = b[sortField];
      return sortOrder === "asc" ? (x > y ? 1 : -1) : x < y ? 1 : -1;
    });
    const grouped = {};
    filteredVisits.forEach((v) => {
      if (!grouped[v.store_name]) grouped[v.store_name] = [];
      grouped[v.store_name].push(v);
    });
    setGroups(grouped);
  }, [visits, sortField, sortOrder, filterOrder, filterType]);

  const handleNavigate = (lat, lng, label) => {
    window.open(`geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`);
  };

  const filtered = Object.entries(groups).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      <div className="md:w-2/3 h-64 md:h-full border-l">
        <MapNeshanForHistory
          visits={visits}
          highlightedStore={expandedStore}
          onMarkerClick={(name) => setExpandedStore((s) => (s === name ? null : name))}
        />
      </div>

      <div className="md:w-1/3 h-full overflow-y-auto p-4">
        {/* نوار بالایی چسبان: بازگشت + جستجو + فیلترها */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-3">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-[#2B2E4A] hover:text-[#E84545] font-medium"
          >
            <ArrowRight size={18} />
            بازگشت
          </button>

          <div className="relative mt-3">
            <Search className="absolute top-3 right-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="جستجوی فروشگاه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-10 py-2 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-gray-700 items-center mt-3">
            <div className="flex items-center gap-1">
              <Filter size={16} />
              <select
                value={filterOrder}
                onChange={(e) => setFilterOrder(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">همه سفارش‌ها</option>
                <option value="has_order">سفارش ثبت‌شده</option>
                <option value="no_order">سفارش ثبت‌نشده</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Store size={16} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">همه فروشگاه‌ها</option>
                {[...new Set(visits.map((v) => v.store_type))].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-1 border px-2 py-1 rounded"
                onClick={() =>
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                }
              >
                {sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
                {sortField === "created_at" ? "تاریخ" : sortField}
              </button>
            </div>
          </div>
        </div>

        {/* لیست گروه‌ها */}
        <div className="space-y-4 mt-4">
          {filtered.map(([storeName, storeVisits]) => {
            const isOpen = expandedStore === storeName;
            const latest = storeVisits[0];
            return (
              <div
                key={storeName}
                className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden"
              >
                <button
                  onClick={() => setExpandedStore((s) => (s === storeName ? null : storeName))}
                  className="w-full flex justify-between items-center px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      {storeName}
                      {latest.scheduled && <Star size={16} className="text-yellow-500 mr-2" />}
                    </h3>
                    <p className="text-sm text-gray-500">{latest.store_type}</p>
                  </div>
                  {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="flex flex-col gap-2 text-sm text-gray-700">
                      {latest.address && (
                        <div className="flex items-center">
                          <MapPin size={16} className="ml-1" />
                          {latest.address}
                        </div>
                      )}
                      {latest.municipality_zone && (
                        <div className="flex items-center">
                          <span className="ml-1">منطقه شهرداری:</span>
                          {latest.municipality_zone}
                        </div>
                      )}
                      <div className="flex items-center"><Phone size={16} className="ml-1" /> {latest.phone || "—"}</div>
                      <div className="flex items-center"><Hash size={16} className="ml-1" /> پلاک: {latest.building_number || "—"}</div>
                      <button
                        onClick={() =>
                          handleNavigate(latest.latitude, latest.longitude, storeName)
                        }
                        className="flex items-center text-purple-700 hover:underline"
                      >
                        <ExternalLink size={16} className="ml-1" /> مسیریابی
                      </button>
                    </div>

                    <div className="border-t border-gray-200 mt-2 pt-2 space-y-2 max-h-60 overflow-y-auto">
                      {storeVisits.map((v) => (
                        <div key={v.id} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-center text-xs text-gray-600">
                            <span className="flex items-center">
                              <Clock size={14} className="ml-1" />
                              {new Date(v.created_at).toLocaleString("fa-IR")}
                            </span>
                            <span className={v.has_order ? "text-green-600" : "text-red-600"}>
                              {v.has_order ? "سفارش ثبت‌شده" : "سفارش ثبت‌نشده"}
                            </span>
                          </div>
                          {v.scheduled && (
                            <p className="text-xs text-yellow-600 flex items-center">
                              <Star size={12} className="ml-1" /> ویزیت طبق برنامه
                            </p>
                          )}
                          {(v.description || v.note) && (
                            <p className="mt-1 text-sm text-gray-700 flex items-start gap-1">
                              <Info size={14} className="mt-[2px] text-blue-500" />
                              {v.description || v.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
