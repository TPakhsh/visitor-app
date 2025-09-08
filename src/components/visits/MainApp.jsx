import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ListChecks, Route, Users } from 'lucide-react';
import { isMobile } from '../../utils/device';

export default function MainApp() {
  const navigate = useNavigate();

  const gotoScheduled = () => {
    navigate(isMobile() ? '/m/visit/scheduled' : '/visit/scheduled');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 font-vazir">
      <div className="hidden sm:block text-center text-lg font-semibold text-gray-700 mb-6">
        یکی از گزینه‌ها را انتخاب کنید
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        <div
          onClick={gotoScheduled}
          className="cursor-pointer bg-white border border-gray-200 shadow-sm rounded-xl p-4 sm:p-6 text-center hover:shadow-md transition"
        >
          <Route className="mx-auto text-indigo-600" size={36} />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mt-3">
            ویزیت‌های برنامه‌ریزی‌شده
          </h3>
          <p className="hidden md:block text-sm text-muted mt-1">
            بازدید از مکان‌هایی که از قبل برای شما برنامه‌ریزی شده‌اند
          </p>
        </div>

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
      </div>
    </div>
  );
}
