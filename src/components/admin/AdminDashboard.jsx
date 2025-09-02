// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { BarChart3, Users, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: visits, error } = await supabase
        .from("visits")
        .select("user_id, has_order");

      const { data: users } = await supabase
        .from("users")
        .select("id, full_name");

      const grouped = {};

      visits.forEach((v) => {
        if (!grouped[v.user_id]) {
          grouped[v.user_id] = { total: 0, orders: 0 };
        }
        grouped[v.user_id].total += 1;
        if (v.has_order) grouped[v.user_id].orders += 1;
      });

      const merged = users.map((u) => ({
        user: u.full_name || "بدون نام",
        total: grouped[u.id]?.total || 0,
        orders: grouped[u.id]?.orders || 0,
      }));

      setStats(merged);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p className="text-center mt-10 text-gray-500">در حال بارگذاری آمار...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 font-vazir">
      <h2 className="text-2xl font-bold text-[#2B2E4A] mb-6 flex items-center gap-2">
        <BarChart3 size={24} /> داشبورد مدیریتی ویزیتورها
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white shadow rounded-lg p-4 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-[#903749] mb-2">{s.user}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Users size={16} />
              مجموع ویزیت: <strong>{s.total}</strong>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700 mt-1">
              <ClipboardList size={16} />
              سفارش ثبت‌شده: <strong>{s.orders}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
