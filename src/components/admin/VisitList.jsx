// src/components/admin/VisitList.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { ArrowRight } from "lucide-react";

export default function VisitList() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ hasOrder: "all", storeType: "all" });

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.from("users").select("*").eq("id", userId).single();
      setUser(userData);

      const { data: visitData } = await supabase
        .from("visits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setVisits(visitData || []);
      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const filteredVisits = visits.filter((visit) => {
    if (filters.hasOrder !== "all" && visit.has_order !== (filters.hasOrder === "true")) return false;
    if (filters.storeType !== "all" && visit.store_type !== filters.storeType) return false;
    return true;
  });

  if (loading) return <p className="text-center mt-10 font-vazir">در حال بارگذاری اطلاعات...</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 font-vazir">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#2B2E4A]">ویزیت‌های {user?.full_name}</h2>
        <button onClick={() => navigate("/admin/visits")} className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowRight className="ml-2" size={18} />
          بازگشت
        </button>
      </div>

      {/* فیلترها */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <select
          value={filters.hasOrder}
          onChange={(e) => setFilters((prev) => ({ ...prev, hasOrder: e.target.value }))}
          className="border p-2 rounded"
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="true">سفارش ثبت شده</option>
          <option value="false">ثبت نشده</option>
        </select>
        <select
          value={filters.storeType}
          onChange={(e) => setFilters((prev) => ({ ...prev, storeType: e.target.value }))}
          className="border p-2 rounded"
        >
          <option value="all">همه فروشگاه‌ها</option>
          {[...new Set(visits.map((v) => v.store_type))].map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* لیست ویزیت‌ها */}
      <div className="grid gap-4">
        {filteredVisits.map((visit) => (
          <div key={visit.id} className="border rounded p-4 shadow bg-white space-y-2">
            <p><strong>نام فروشگاه:</strong> {visit.store_name}</p>
            <p><strong>نوع:</strong> {visit.store_type}</p>
            <p><strong>سفارش:</strong> {visit.has_order ? "دارد" : "ندارد"}</p>
            {visit.description && <p><strong>توضیحات:</strong> {visit.description}</p>}
            <p className="text-xs text-gray-500">زمان ثبت: {new Date(visit.created_at).toLocaleString("fa-IR")}</p>
          </div>
        ))}
        {filteredVisits.length === 0 && (
          <p className="text-gray-500 text-center py-6">هیچ ویزیتی مطابق فیلترها یافت نشد.</p>
        )}
      </div>
    </div>
  );
}
