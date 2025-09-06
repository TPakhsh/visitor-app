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
  Route,
  Users,
} from "lucide-react";
import { useUserMeta } from "../../context/UserMetaContext";

// لوگو سفید از پوشه public (بدون public/ در مسیر)
import logoWhite from "/logo-white.png";

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);      // منوی ناوبری موبایل
  const [profileOpen, setProfileOpen] = useState(false); // منوی پروفایل
  const { userMeta } = useUserMeta();

  const handleLogout = async () => {
    const ok = window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟");
    if (!ok) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="w-full bg-[#2B2E4A] text-white shadow-md px-4 py-3 sticky top-0 z-50 font-vazir">
      {/* ردیف بالا: همبرگر (موبایل) | لوگو | پروفایل */}
      <div className="flex items-center justify-between min-h-[56px] gap-3 flex-wrap">
        {/* دکمه همبرگری فقط در موبایل */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white"
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* لوگو (غیرکلیک‌پذیر) */}
        <div className="flex items-center gap-2 select-none order-2 md:order-1">
          <img
            src={logoWhite}
            alt="لوگو"
            className="h-8 md:h-9 w-auto pointer-events-none"
            draggable={false}
          />
        </div>

        {/* اطلاعات کاربر: آواتار + نام (کلیک روی نام = منوی پروفایل) */}
        <div className="relative flex items-center gap-3 text-sm text-gray-200 order-3">
          {/* آواتار */}
          <div className="w-8 h-8 rounded-full border border-white overflow-hidden bg-gray-300 flex items-center justify-center">
            {userMeta?.avatar_url ? (
              <img
                src={userMeta.avatar_url}
                alt="آواتار"
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <UserCircle size={20} className="text-white opacity-60" />
            )}
          </div>

          {/* نام و منوی پروفایل */}
          <button
            onClick={() => setProfileOpen((s) => !s)}
            className="flex items-center gap-1 hover:text-[#F8C8DC] transition"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title="منوی کاربری"
          >
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {userMeta?.full_name || "کاربر"}
            </span>
            <UserCircle size={16} className="opacity-80" />
          </button>

          {/* منوی کشویی پروفایل */}
          {profileOpen && (
            <div
              className="absolute top-10 left-0 bg-white text-[#2B2E4A] rounded-xl shadow-lg w-44 overflow-hidden border border-gray-200 z-50"
              role="menu"
            >
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/profile");
                }}
                className="w-full text-right px-4 py-2 hover:bg-gray-50"
                role="menuitem"
              >
                مشاهده پروفایل
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  handleLogout();
                }}
                className="w-full text-right px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center justify-between"
                role="menuitem"
              >
                خروج
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* منوی دسکتاپ (ناوبری اصلی) */}
      <nav className="hidden md:flex gap-6 text-sm font-semibold items-center mt-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center hover:text-[#E84545]"
        >
          <Home size={18} className="ml-1" />
          داشبورد
        </button>

        <button
          onClick={() => navigate("/visit/scheduled")}
          className="flex items-center hover:text-[#E84545]"
        >
          <Route size={18} className="ml-1" />
          ویزیت‌های برنامه‌ریزی‌شده
        </button>

        <button
          onClick={() => navigate("/visit/new")}
          className="flex items-center hover:text-[#E84545]"
        >
          <MapPin size={18} className="ml-1" />
          ثبت ویزیت جدید
        </button>

        <button
          onClick={() => navigate("/history")}
          className="flex items-center hover:text-[#E84545]"
        >
          <ListChecks size={18} className="ml-1" />
          تاریخچه ویزیت‌ها
        </button>

        <button
          onClick={() => navigate("/customers")}
          className="flex items-center hover:text-[#E84545]"
        >
          <Users size={18} className="ml-1" />
          لیست مشتریان
        </button>
      </nav>

      {/* منوی موبایل (پس از باز شدن همبرگری) */}
      {menuOpen && (
        <nav className="md:hidden mt-3 flex flex-col gap-3 border-t border-gray-600 pt-3 text-sm font-semibold">
          <button
            onClick={() => {
              navigate("/dashboard");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <Home size={18} className="ml-1" /> داشبورد
          </button>

          <button
            onClick={() => {
              navigate("/visit/scheduled");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <Route size={18} className="ml-1" /> ویزیت‌های برنامه‌ریزی‌شده
          </button>

          <button
            onClick={() => {
              navigate("/visit/new");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <MapPin size={18} className="ml-1" /> ثبت ویزیت جدید
          </button>

          <button
            onClick={() => {
              navigate("/history");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <ListChecks size={18} className="ml-1" /> تاریخچه ویزیت‌ها
          </button>

          <button
            onClick={() => {
              navigate("/customers");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <Users size={18} className="ml-1" /> لیست مشتریان
          </button>
        </nav>
      )}
    </header>
  );
}
