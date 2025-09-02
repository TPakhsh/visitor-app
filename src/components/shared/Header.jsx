// src/components/shared/Header.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  LogOut,
  MapPin,
  ListChecks,
  Home,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { useUserMeta } from "../../context/UserMetaContext";

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { userMeta } = useUserMeta();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="w-full bg-[#2B2E4A] text-white shadow-md px-4 py-3 sticky top-0 z-50 font-vazir">
      <div className="flex justify-between items-center min-h-[56px] flex-wrap gap-4">
        {/* منوی دسکتاپ */}
        <div className="hidden md:flex gap-6 text-sm font-semibold items-center">
          <button onClick={() => navigate("/dashboard")} className="flex items-center hover:text-[#E84545]">
            <Home size={18} className="ml-1" />
            داشبورد
          </button>
          <button onClick={() => navigate("/visit/new")} className="flex items-center hover:text-[#E84545]">
            <MapPin size={18} className="ml-1" />
            ثبت ویزیت
          </button>
          <button onClick={() => navigate("/history")} className="flex items-center hover:text-[#E84545]">
            <ListChecks size={18} className="ml-1" />
            تاریخچه
          </button>
        </div>

        {/* منوی همبرگری در موبایل */}
        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* اطلاعات کاربر */}
        <div className="flex items-center gap-3 text-sm text-gray-200">
          {/* آواتار یا جایگزین خاکستری با ارتفاع یکنواخت */}
          <div className="w-8 h-8 rounded-full border border-white overflow-hidden bg-gray-300 flex items-center justify-center">
            {userMeta.avatar_url ? (
              <img
                src={userMeta.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle size={20} className="text-white opacity-60" />
            )}
          </div>

          <span>{userMeta.full_name}</span>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center text-[#F8C8DC] hover:text-[#E84545]"
          >
            <UserCircle size={16} className="ml-1" />
            پروفایل
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-300 hover:text-red-500"
          >
            <LogOut size={16} className="ml-1" />
            خروج
          </button>
        </div>
      </div>

      {/* منوی موبایل */}
      {menuOpen && (
        <nav className="md:hidden mt-3 flex flex-col gap-4 border-t border-gray-600 pt-3">
          <button onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} className="flex items-center hover:text-[#E84545]">
            <Home size={18} className="ml-1" /> داشبورد
          </button>
          <button onClick={() => { navigate("/visit/new"); setMenuOpen(false); }} className="flex items-center hover:text-[#E84545]">
            <MapPin size={18} className="ml-1" /> ثبت ویزیت
          </button>
          <button onClick={() => { navigate("/history"); setMenuOpen(false); }} className="flex items-center hover:text-[#E84545]">
            <ListChecks size={18} className="ml-1" /> تاریخچه
          </button>
        </nav>
      )}
    </header>
  );
}
