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
  const [drawerOpen, setDrawerOpen] = useState(false);   // ساید دراور ناوبری
  const [profileOpen, setProfileOpen] = useState(false); // منوی پروفایل
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

  // بستن با ESC (برای دسترس‌پذیری)
  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const handleLogout = async () => {
    const ok = window.confirm("آیا مطمئن هستید که می‌خواهید خارج شوید؟");
    if (!ok) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  const goto = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <header className="w-full bg-[#2B2E4A] text-white shadow-md px-4 py-3 sticky top-0 z-50 font-vazir">
      {/* یک خط: چپ پروفایل | راست لوگو + همبرگر */}
      <div className="flex items-center justify-between gap-3">
        {/* چپ: پروفایل (همهٔ اندازه‌ها) */}
        <div className="relative flex items-center gap-2" ref={profileRef}>
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
              <div className="w-full h-full bg-white/30" />
            )}
          </div>

          {/* نام + فلش */}
          <button
            onClick={() => setProfileOpen((s) => !s)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10 transition"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title="منوی کاربری"
          >
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

        {/* راست: لوگو + همبرگر (همیشه نمایش) */}
        <div className="flex items-center gap-3">
          <img
            src={logoWhite}
            alt="لوگو"
            className="h-8 md:h-9 w-auto pointer-events-none select-none"
            draggable={false}
          />
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white rounded-lg p-1.5 hover:bg-white/10 transition"
            aria-label="باز کردن منو"
            title="منو"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* پس‌زمینهٔ محو برای دراور */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[60]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ساید دراور از راست (RTL) */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white text-[#2B2E4A] z-[70] shadow-2xl transform transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* سربرگ دراور */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 select-none">
            <img src={logoWhite} alt="لوگو" className="h-7 w-auto" />
            <span className="font-bold">منوی سامانه</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-[#2B2E4A] hover:bg-black/5 rounded-lg p-1.5"
            aria-label="بستن منو"
            title="بستن"
          >
            <X size={22} />
          </button>
        </div>

        {/* آیتم‌های ناوبری */}
        <nav className="flex flex-col py-2">
          <button
            onClick={() => goto("/dashboard")}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right"
          >
            <span>داشبورد</span>
            <Home size={18} />
          </button>

          <button
            onClick={() => goto("/visit/scheduled")}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right"
          >
            <span>ویزیت‌های برنامه‌ریزی‌شده</span>
            <Route size={18} />
          </button>

          <button
            onClick={() => goto("/visit/new")}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right"
          >
            <span>ثبت ویزیت جدید</span>
            <MapPin size={18} />
          </button>

          <button
            onClick={() => goto("/history")}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right"
          >
            <span>تاریخچه ویزیت‌ها</span>
            <ListChecks size={18} />
          </button>

          <button
            onClick={() => goto("/customers")}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-right"
          >
            <span>لیست مشتریان</span>
            <Users size={18} />
          </button>
        </nav>

        {/* اکشن‌های کاربری در انتهای دراور (پیشنهاد UX) */}
        <div className="mt-auto px-4 py-3 border-t">
          <button
            onClick={() => {
              setDrawerOpen(false);
              navigate("/profile");
            }}
            className="w-full text-right px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            مشاهده پروفایل
          </button>
          <button
            onClick={() => {
              setDrawerOpen(false);
              handleLogout();
            }}
            className="w-full text-right px-3 py-2 rounded-lg hover:bg-gray-50 text-red-600 flex items-center justify-between"
          >
            خروج
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </header>
  );
}
