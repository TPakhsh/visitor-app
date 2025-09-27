// src/components/visits/MainApp.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ListChecks, Route as RouteIcon, Users, FileText, FlaskConical, LocateFixed } from 'lucide-react';
import { isMobile } from '../../utils/device';

// کنترل نمایش کارت‌ها
const SHOW_PROFORMA_EXPERIMENT = true;
const SHOW_LIVE_MAP = false; // ⬅️ نقشه لایو فعلاً مخفی است

export default function MainApp() {
  const navigate = useNavigate();

  const gotoScheduled = () => {
    navigate(isMobile() ? '/m/visit/scheduled' : '/visit/scheduled');
  };

  const safeGo = (e, path) => {
    if (e?.defaultPrevented) return;
    if (e?.metaKey || e?.ctrlKey) return;
    e?.preventDefault?.();
    navigate(path);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 font-vazir">
      <div className="hidden sm:block text-center text-lg font-semibold text-gray-700 mb-6">
        یکی از گزینه‌ها را انتخاب کنید
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 relative z-0">
        {/* ویزیت‌های برنامه‌ریزی‌شده */}
        <div
          onClick={gotoScheduled}
          className="cursor-pointer bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6 text-center hover:shadow-md transition"
        >
          <RouteIcon className="mx-auto text-indigo-600" size={36} />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mt-3">
            ویزیت‌های برنامه‌ریزی‌شده
          </h3>
          <p className="hidden md:block text-sm text-muted mt-1">
            بازدید از مکان‌هایی که از قبل برای شما برنامه‌ریزی شده‌اند
          </p>
        </div>

        {/* ثبت ویزیت جدید */}
        <div
          onClick={() => navigate('/visit/new')}
          className="cursor-pointer bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6 text-center hover:shadow-md transition"
        >
          <MapPin className="mx-auto text-rose-600" size={36} />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mt-3">
            ثبت ویزیت جدید
          </h3>
          <p className="hidden md:block text-sm text-muted mt-1">
            ثبت گزارش برای مکان‌های جدید با استفاده از موقعیت فعلی
          </p>
        </div>

        {/* تاریخچه ویزیت‌ها */}
        <div
          onClick={() => navigate('/history')}
          className="cursor-pointer bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6 text-center hover:shadow-md transition"
        >
          <ListChecks className="mx-auto text-green-600" size={36} />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mt-3">
            تاریخچه ویزیت‌ها
          </h3>
          <p className="hidden md:block text-sm text-muted mt-1">
            مشاهده سوابق بازدیدهای ثبت‌شده شما
          </p>
        </div>

        {/* لیست مشتریان */}
        <div
          onClick={() => navigate('/customers')}
          className="cursor-pointer bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6 text-center hover:shadow-md transition"
        >
          <Users className="mx-auto text-yellow-600" size={36} />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mt-3">
            لیست مشتریان
          </h3>
          <p className="hidden md:block text-sm text-muted mt-1">
            دسترسی به مشتریان شما همراه با جستجو، دسته‌بندی و موقعیت مکانی
          </p>
        </div>

        {/* نقشه لایو — فعلاً مخفی */}
        {SHOW_LIVE_MAP && (
          <Link
            to="/map/live"
            onClick={(e) => safeGo(e, '/map/live')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') safeGo(e, '/map/live');
            }}
            role="link"
            tabIndex={0}
            className="block cursor-pointer bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6 text-center hover:shadow-md transition pointer-events-auto relative z-10"
          >
            <LocateFixed className="mx-auto text-teal-600" size={36} />
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mt-3">
              نقشه لایو
            </h3>
            <p className="hidden md:block text-sm text-muted mt-1">
              مشاهده موقعیت خود و نزدیک‌ترین مشتری‌ها روی نقشه
            </p>
          </Link>
        )}

        {/* --- نسخه آزمایشی: پیش‌فاکتور --- */}
        {SHOW_PROFORMA_EXPERIMENT && (
          <div
            onClick={() => navigate('/invoice/proforma')}
            className="
              cursor-pointer rounded-xl p-4 sm:p-6 text-center transition col-span-2 md:col-span-1
              bg-gradient-to-br from-[#f7ecff] to-[#ffeef5]
              border-2 border-dashed border-[#903749]
              hover:shadow-md
            "
          >
            <FileText className="mx-auto text-[#2B2E4A]" size={36} />
            <div className="mt-3 flex items-center justify-center gap-2">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#2B2E4A]">
                پیش‌فاکتور
              </h3>
              <span
                className="
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
                  bg-[#903749]/10 text-[#903749] border border-[#903749]/30
                "
                title="نسخه آزمایشی"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                آزمایشی
              </span>
            </div>

            <p className="hidden md:block text-sm mt-2 text-[#53354A]">
              نسخه تستی برای نمایش و ارزیابی UI — داده‌ها و محاسبات ممکن است تغییر کنند
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
