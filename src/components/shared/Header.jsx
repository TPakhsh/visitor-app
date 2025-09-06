// src/components/shared/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  LogOut,
  MapPin,
  ListChecks,
  Home,
  Menu,
  X,
  Route,
  Users,
  ChevronDown,
} from "lucide-react";
import { useUserMeta } from "../../context/UserMetaContext";
import logoWhite from "/logo-white.png";

export default function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);       // منوی ناوبری موبایل
  const [profileOpen, setProfileOpen] = useState(false); // منوی پروفایل
  const { userMeta } = useUserMeta();
  const profileRef = useRef(null);

  // بستن منوی پروفایل با کلیک بیرون
  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    const ok = window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟");
    if (!ok) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="w-full bg-[#2B2E4A] text-white shadow-md px-4 py-3 sticky top-0 z-50 font-vazir">
      {/* ردیف اصلی هدر: یک خط در دسکتاپ - لوگو | ناوبری | پروفایل */}
      <div className="flex items-center justify-between gap-3">
        {/* چپ (LTR) = سمت چپ در UI فارسی: پروفایل و نام (در موبایل: دکمه پروفایل + همبرگر) */}
        <div className="flex items-center gap-2 order-3 md:order-3">
          {/* موبایل: دکمه همبرگری */}
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* دکمه کاربر: نام + فلش (موبایل و دسکتاپ) */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((s) => !s)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/10 transition"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              title="منوی کاربری"
            >
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
                  // جایگزین ساده اگر آواتار نداشت
                  <div className="w-full h-full bg-white/30" />
                )}
              </div>
              {/* نام + فلش */}
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {userMeta?.full_name || "کاربر"}
              </span>
              <ChevronDown size={18} className="opacity-80" />
            </button>

            {/* منوی کشویی پروفایل */}
            {profileOpen && (
              <div
                className="absolute top-11 left-0 bg-white text-[#2B2E4A] rounded-xl shadow-lg w-48 overflow-hidden border border-gray-200 z-50"
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

        {/* وسط: ناوبری (فقط دسکتاپ) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold order-2">
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

        {/* راست: لوگو (در موبایل هم سمت راست باشد) */}
        <div className="order-1 md:order-1 select-none">
          <img
            src={logoWhite}
            alt="لوگو"
            className="h-8 md:h-9 w-auto pointer-events-none"
            draggable={false}
          />
        </div>
      </div>

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
