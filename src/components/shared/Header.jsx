// src/components/shared/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import {
  Home,
  Route,
  MapPin,
  ListChecks,
  Users,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useUserMeta } from "../../context/UserMetaContext";

// لوگوها از پوشه public (بدون ذکر public/ در مسیر)
import logoWhite from "/logo-white.png"; // هدر بالا
import logoDark from "/logo-dark.png";   // سربرگ دراور

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userMeta } = useUserMeta();

  const [drawerOpen, setDrawerOpen] = useState(false);   // وضعیت ساید دراور
  const [profileOpen, setProfileOpen] = useState(false); // منوی پروفایل
  const profileRef = useRef(null);

  // مسیرهای داخل همبرگر (داشبورد عمداً اینجا نیست)
  const links = [
    { path: "/visit/scheduled",  label: "ویزیت‌های برنامه‌ریزی‌شده", Icon: Route },
    { path: "/visit/new",        label: "ثبت ویزیت جدید",            Icon: MapPin },
    { path: "/history",          label: "تاریخچه ویزیت‌ها",          Icon: ListChecks },
    { path: "/customers",        label: "لیست مشتریان",              Icon: Users },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const goto = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

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

  // ESC برای بستن دراور/پروفایل
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

  // قفل اسکرول بدنه هنگام باز بودن دراور
  useEffect(() => {
    const original = document.body.style.overflow;
    if (drawerOpen) document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = original);
  }, [drawerOpen]);

  const handleLogout = async () => {
    const ok = window.confirm("آیا مطمئن هستید که می‌خواهید از حساب خارج شوید؟");
    if (!ok) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="w-full bg-[#2B2E4A] text-white shadow-md px-4 py-3 sticky top-0 z-50 font-vazir">
      {/* یک خط: راست (لوگو + خانه + همبرگر) | چپ (پروفایل) */}
      <div className="flex items-center justify-between gap-3">
        {/* راست: لوگو، خانه (داشبورد)، همبرگر */}
        <div className="flex items-center gap-2">
          {/* لوگو (غیرکلیک‌پذیر) */}
          <img
            src={logoWhite}
            alt="لوگو"
            className="h-8 md:h-9 w-auto pointer-events-none select-none"
            draggable={false}
          />

          {/* دکمه داشبورد همیشه در دسترس */}
          <button
            onClick={() => navigate("/dashboard")}
            className={`rounded-lg p-1.5 transition ${
              isActive("/dashboard")
                ? "text-[#E84545] bg-white/10"
                : "text-white hover:bg-white/10"
            }`}
            aria-label="داشبورد"
            title="داشبورد"
          >
            <Home size={22} />
          </button>

          {/* همبرگر: سایر مسیرها داخل دراور */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white rounded-lg p-1.5 hover:bg-white/10 transition"
            aria-label="باز کردن منو"
            title="منو"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* چپ: پروفایل (آواتار + نام + فلش) */}
        <div className="relative flex items-center gap-2" ref={profileRef}>
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
              className="absolute top-11 left-0 bg-white text-[#2B2E4A] rounded-xl shadow-lg w-48 overflow-hidden border border-gray-200 z-[60]"
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

      {/* Overlay پس‌زمینه هنگام باز بودن دراور */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[60]"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ساید دراور از راست */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white text-[#2B2E4A] z-[70] shadow-2xl transform transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* سربرگ دراور: فقط لوگوی تیره */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 select-none">
            <img src={logoDark} alt="لوگوی تیره" className="h-8 w-auto" />
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

        {/* آیتم‌های ناوبری (بدون داشبورد) */}
        <nav className="flex flex-col py-2">
          {links.map(({ path, label, Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => goto(path)}
                className={`flex items-center justify-between px-4 py-3 text-right transition ${
                  active
                    ? "bg-gray-100 text-[#E84545] font-bold"
                    : "hover:bg-gray-50"
                }`}
              >
                <span>{label}</span>
                <Icon size={18} />
              </button>
            );
          })}
        </nav>

        {/* اکشن‌های کاربری در انتهای دراور */}
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
