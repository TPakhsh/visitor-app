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

// لوگوی سفید از پوشه public
// نکته: برای فایل‌های public از روت سایت import کن (بدون public/)
import logoWhite from "/logo-white.png";

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
      {/* ردیف بالایی: همبرگر (موبایل) | لوگو | اطلاعات کاربر */}
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

        {/* لوگو (کلیک = رفتن به داشبورد) */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 cursor-pointer select-none order-2 md:order-1"
          title="بازگشت به داشبورد"
        >
          <img
            src={logoWhite}
            alt="لوگوی سامانه"
            className="h-8 md:h-9 w-auto pointer-events-none"
            draggable={false}
          />
          {/* نام برند فقط در دسکتاپ نمایش داده شود تا موبایل خلوت بماند */}
          <span className="hidden md:inline font-bold text-lg">
            سامانه ویزیتورها
          </span>
        </div>

        {/* اطلاعات کاربر (آواتار، نام، پروفایل/خروج) */}
        <div className="flex items-center gap-3 text-sm text-gray-200 order-3">
          {/* آواتار با ابعاد یکنواخت */}
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

          {/* نام کاربر در موبایل مخفی؛ در sm به بالا نمایش */}
          <span className="hidden sm:inline">
            {userMeta?.full_name || "کاربر"}
          </span>

          {/* دکمه پروفایل: در موبایل مخفی، در sm به بالا نمایش */}
          <button
            onClick={() => navigate("/profile")}
            className="hidden sm:flex items-center text-[#F8C8DC] hover:text-[#E84545]"
          >
            <UserCircle size={16} className="ml-1" />
            پروفایل
          </button>

          {/* خروج: در موبایل فقط آیکون، در sm به بالا متن‌دار */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center text-red-300 hover:text-red-500"
          >
            <LogOut size={16} className="ml-1" />
            خروج
          </button>
          <button
            onClick={handleLogout}
            className="sm:hidden text-red-300 hover:text-red-500"
            aria-label="خروج"
            title="خروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* منوی دسکتاپ (زیر ردیف لوگو) */}
      <nav className="hidden md:flex gap-6 text-sm font-semibold items-center mt-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center hover:text-[#E84545]"
        >
          <Home size={18} className="ml-1" />
          داشبورد
        </button>
        <button
          onClick={() => navigate("/visit/new")}
          className="flex items-center hover:text-[#E84545]"
        >
          <MapPin size={18} className="ml-1" />
          ثبت ویزیت
        </button>
        <button
          onClick={() => navigate("/history")}
          className="flex items-center hover:text-[#E84545]"
        >
          <ListChecks size={18} className="ml-1" />
          تاریخچه
        </button>
      </nav>

      {/* منوی موبایل (پس از باز شدن همبرگری) */}
      {menuOpen && (
        <nav className="md:hidden mt-3 flex flex-col gap-4 border-t border-gray-600 pt-3">
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
              navigate("/visit/new");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <MapPin size={18} className="ml-1" /> ثبت ویزیت
          </button>
          <button
            onClick={() => {
              navigate("/history");
              setMenuOpen(false);
            }}
            className="flex items-center hover:text-[#E84545]"
          >
            <ListChecks size={18} className="ml-1" /> تاریخچه
          </button>
        </nav>
      )}
    </header>
  );
}
