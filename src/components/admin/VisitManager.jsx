// src/pages/admin/VisitManager.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Search, UserCircle, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VisitManager() {
  const [users, setUsers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.from("users").select("id, full_name");
      const { data: visitData } = await supabase.from("visits").select("user_id, has_order");

      const stats = userData.map((user) => {
        const userVisits = visitData.filter((v) => v.user_id === user.id);
        const total = userVisits.length;
        const orders = userVisits.filter((v) => v.has_order).length;
        const conversion = total ? Math.round((orders / total) * 100) : 0;

        return {
          ...user,
          total,
          orders,
          conversion,
        };
      });

      setUsers(stats);
      setVisits(visitData);
    };

    fetchData();
  }, []);

  const filtered = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 font-vazir">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#2B2E4A] flex items-center gap-2">
          <BarChart2 size={24} />
          مدیریت ویزیتورها
        </h1>
        <div className="relative">
          <Search size={18} className="absolute right-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام ویزیتور..."
            className="border rounded pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition cursor-pointer"
            onClick={() => navigate(`/admin/visits/${user.id}`)}
          >
            <div className="flex items-center gap-3 mb-2">
              <UserCircle className="text-[#903749]" size={28} />
              <h2 className="font-bold text-lg">{user.full_name || "بدون نام"}</h2>
            </div>
            <p className="text-sm text-gray-600">تعداد ویزیت: <span className="font-bold">{user.total}</span></p>
            <p className="text-sm text-gray-600">سفارش ثبت‌شده: <span className="font-bold text-green-600">{user.orders}</span></p>
            <p className="text-sm text-gray-600">نرخ تبدیل: <span className="font-bold">{user.conversion}%</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}
