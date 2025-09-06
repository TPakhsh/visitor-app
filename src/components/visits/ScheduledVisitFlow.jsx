import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import LocationDetail from './LocationDetail';
import LoadingScreen from '../shared/LoadingScreen';
import { ChevronLeft, ArrowRight, Route, CheckCircle } from 'lucide-react';

export default function ScheduledVisitFlow({ user, onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [visitedMap, setVisitedMap] = useState({});
  const [completedSchedules, setCompletedSchedules] = useState({});

  // ویزیت‌های انجام‌شده (برای تیک سبز)
  const fetchVisited = async () => {
    const { data, error } = await supabase
      .from('visit_notes')
      .select('location_id, schedule_id')
      .eq('visitor_id', user.id);

    if (!error && data) {
      const visited = {};
      const scheduleCounter = {};
      data.forEach(({ location_id, schedule_id }) => {
        visited[location_id] = true;
        if (!scheduleCounter[schedule_id]) scheduleCounter[schedule_id] = 0;
        scheduleCounter[schedule_id]++;
      });
      setVisitedMap(visited);
      setCompletedSchedules(scheduleCounter);
    }
  };

  useEffect(() => {
    fetchVisited();
  }, [user.id]);

  // برنامه‌ها
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select(
            `id, date, date_label, schedule_locations(location_id, locations(*))`
          )
          .eq('visitor_id', user.id)
          .order('date', { ascending: true });

        if (!error && data) {
          const normalized = data.map((schedule) => ({
            ...schedule,
            locations: schedule.schedule_locations.map((sl) => sl.locations),
          }));
          setSchedules(normalized);
        } else {
          console.error('❌ خطا در واکشی برنامه‌ها:', error?.message || 'بدون پیام خطا');
        }
      } catch (err) {
        console.error('❌ خطای غیرمنتظره در واکشی برنامه‌ها:', err);
      } finally {
        setLoadingSchedules(false);
      }
    };
    fetchSchedules();
  }, [user.id]);

  const handleSelectDate = (schedule) => {
    setSelectedDate(schedule);
    setSelectedLocation(null);
  };

  const handleGoBackDesktop = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const handleVisitComplete = async (locationId, note) => {
    const { data: existing, error: fetchError } = await supabase
      .from('visit_notes')
      .select('id')
      .eq('location_id', locationId)
      .eq('visitor_id', user.id)
      .eq('schedule_id', selectedDate.id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ خطا در بررسی وجود قبلی ویزیت:', fetchError.message);
      return;
    }
    if (existing) {
      console.log('⛔ ویزیت قبلاً ثبت شده است.');
      return;
    }

    const { error } = await supabase.from('visit_notes').insert({
      location_id: locationId,
      visitor_id: user.id,
      schedule_id: selectedDate.id,
      note: note || '',
      has_order: true,
    });

    if (!error) {
      setVisitedMap((prev) => ({ ...prev, [locationId]: true }));
      setCompletedSchedules((prev) => {
        const newCount = (prev[selectedDate.id] || 0) + 1;
        return { ...prev, [selectedDate.id]: newCount };
      });
    } else {
      console.error('❌ خطا در درج ویزیت:', error.message);
    }
  };

  if (loadingSchedules) return <LoadingScreen text="در حال بارگذاری برنامه‌ها..." />;

  // گام فعلی برای ویزارد موبایل
  const step = !selectedDate ? 0 : selectedLocation ? 2 : 1;

  /* =========================
     دسکتاپ / تبلت (md+): چیدمان ستونی
     ========================= */
  return (
    <>
      <main className="hidden md:grid max-w-7xl mx-auto grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 p-2 md:p-4 font-vazir">
        <aside className="col-span-1 bg-white p-4 md:p-6 rounded-xl shadow-md flex flex-col min-h-[60vh]">
          {!selectedDate ? (
            <>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#903749]">
                <h2 className="text-xl font-semibold text-[#2B2E4A] flex items-center">
                  <Route size={24} className="ml-2" />
                  انتخاب تاریخ ویزیت
                </h2>
                <button
                  onClick={handleGoBackDesktop}
                  className="p-2 text-sm text-[#E84545] hover:text-[#903749] flex items-center transition"
                >
                  <ArrowRight size={16} className="ml-1" /> بازگشت
                </button>
              </div>
              {schedules.length === 0 ? (
                <p className="text-gray-500 p-4">هیچ برنامه ویزیت فعالی یافت نشد.</p>
              ) : (
                <ul className="space-y-3 overflow-y-auto pr-2">
                  {schedules.map((schedule) => {
                    const total = schedule.locations.length;
                    const done = completedSchedules[schedule.id] || 0;
                    const allDone = done === total && total > 0;
                    return (
                      <li key={schedule.id}>
                        <button
                          onClick={() => handleSelectDate(schedule)}
                          className="w-full text-right p-4 rounded-lg flex items-center justify-between bg-[#f8f8fa] hover:bg-[#f0e9ec] hover:shadow-sm text-[#2B2E4A] border border-[#53354A]"
                        >
                          <span className="font-semibold">{schedule.date_label}</span>
                          <div className="flex items-center gap-2">
                            {allDone && <CheckCircle size={20} className="text-green-500" />}
                            <ChevronLeft size={20} className="text-gray-400" />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#903749]">
                <h2 className="text-xl font-semibold text-[#2B2E4A]">مکان‌های ویزیت</h2>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedLocation(null);
                  }}
                  className="p-2 text-sm text-[#E84545] hover:text-[#903749] flex items-center transition"
                >
                  <ArrowRight size={16} className="ml-1" /> بازگشت به تاریخ‌ها
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">{selectedDate.date_label}</p>
              {Array.isArray(selectedDate.locations) && selectedDate.locations.length > 0 ? (
                <ul className="space-y-3 overflow-y-auto pr-2">
                  {selectedDate.locations.map((location) => (
                    <li key={location.id}>
                      <button
                        onClick={() => setSelectedLocation(location)}
                        className={`w-full text-right p-4 rounded-lg flex items-center justify-between border ${
                          selectedLocation?.id === location.id
                            ? 'bg-[#903749] text-white shadow-md ring-2 ring-[#E84545]'
                            : 'bg-[#f8f8fa] hover:bg-[#f0e9ec] text-[#2B2E4A] border-[#53354A]'
                        }`}
                      >
                        <div className="ml-3 text-right">
                          <span className="font-semibold block">{location.name}</span>
                          <span className="text-xs">{location.address}</span>
                        </div>
                        {visitedMap[location.id] && (
                          <CheckCircle size={18} className="text-green-500" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">هیچ مکان ویزیتی برای این تاریخ تعریف نشده است.</p>
              )}
            </>
          )}
        </aside>

        <section className="col-span-1 lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-md min-h-[60vh]">
          {!selectedLocation ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
              <Route size={48} className="mb-4 text-gray-400" />
              <p className="text-xl">
                {selectedDate
                  ? 'لطفاً یک مکان را از لیست انتخاب کنید.'
                  : 'لطفاً یک تاریخ را انتخاب کنید.'}
              </p>
            </div>
          ) : (
            <LocationDetail
              location={selectedLocation}
              user={user}
              scheduleId={selectedDate.id}
              key={selectedLocation.id}
              onVisitComplete={handleVisitComplete}
            />
          )}
        </section>
      </main>

      {/* =========================
         موبایل (sm و پایین): ویزارد اسلایدی (بدون پنل‌های ثابت و روی‌هم)
         ========================= */}
      <section className="md:hidden font-vazir px-0">
        {/* ظرف اصلی موبایل: قد صفحه - ارتفاع هدر (تقریبی 4rem) */}
        <div className="relative h-[calc(100vh-4rem)] bg-white rounded-t-2xl shadow-sm overflow-hidden pb-[env(safe-area-inset-bottom)]">
          {/* اسلایدر سه‌صفحه‌ای */}
          <div
            className="flex h-full w-full transition-transform duration-300"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {/* اسلاید 1: انتخاب تاریخ */}
            <div className="w-full flex-shrink-0 flex flex-col">
              <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#2B2E4A] flex items-center gap-2">
                  <Route size={20} />
                  انتخاب تاریخ ویزیت
                </h2>
                <button
                  onClick={onBack || (() => window.history.back())}
                  className="text-[#E84545] hover:text-[#903749] flex items-center text-sm"
                >
                  <ArrowRight size={16} className="ml-1" />
                  بازگشت
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-3">
                {schedules.length === 0 ? (
                  <p className="text-gray-500 p-6 text-center">هیچ برنامه ویزیت فعالی یافت نشد.</p>
                ) : (
                  <ul className="space-y-2">
                    {schedules.map((schedule) => {
                      const total = schedule.locations.length;
                      const done = completedSchedules[schedule.id] || 0;
                      const allDone = done === total && total > 0;
                      return (
                        <li key={schedule.id}>
                          <button
                            onClick={() => handleSelectDate(schedule)}
                            className="w-full text-right px-4 py-3 rounded-lg flex items-center justify-between bg-[#f8f8fa] hover:bg-[#f0e9ec] text-[#2B2E4A] border border-[#53354A] transition"
                          >
                            <span className="font-medium">{schedule.date_label}</span>
                            <div className="flex items-center gap-2">
                              {allDone && <CheckCircle size={18} className="text-green-500" />}
                              <ChevronLeft size={18} className="text-gray-400" />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* اسلاید 2: لیست مکان‌ها */}
            <div className="w-full flex-shrink-0 flex flex-col">
              <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedLocation(null);
                  }}
                  className="text-[#2B2E4A] hover:text-[#E84545] flex items-center"
                  aria-label="بازگشت"
                >
                  <ArrowRight size={18} className="ml-1" />
                  تاریخ‌ها
                </button>
                <span className="text-sm text-gray-500 truncate max-w-[60vw]">
                  {selectedDate?.date_label || ''}
                </span>
              </header>

              <div className="flex-1 overflow-y-auto p-3">
                {Array.isArray(selectedDate?.locations) && selectedDate.locations.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedDate.locations.map((loc) => (
                      <li key={loc.id}>
                        <button
                          onClick={() => setSelectedLocation(loc)}
                          className="w-full text-right px-4 py-3 rounded-lg flex items-center justify-between border bg-[#f8f8fa] hover:bg-[#f0e9ec] text-[#2B2E4A] border-[#53354A] transition"
                        >
                          <div className="ml-3 text-right">
                            <span className="font-medium block truncate max-w-[60vw]">{loc.name}</span>
                            <span className="text-xs text-gray-600 truncate max-w-[60vw]">{loc.address}</span>
                          </div>
                          {visitedMap[loc.id] && <CheckCircle size={18} className="text-green-500" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 p-6 text-center">هیچ مکان ویزیتی برای این تاریخ تعریف نشده است.</p>
                )}
              </div>
            </div>

            {/* اسلاید 3: جزئیات مکان */}
            <div className="w-full flex-shrink-0 flex flex-col">
              <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-[#2B2E4A] hover:text-[#E84545] flex items-center"
                >
                  <ArrowRight size={18} className="ml-1" />
                  {selectedDate?.date_label || 'تاریخ'}
                </button>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#2B2E4A] truncate max-w-[50vw]">
                    {selectedLocation?.name || ''}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate max-w-[50vw]">
                    {selectedLocation?.address || ''}
                  </p>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-3">
                {selectedDate && selectedLocation ? (
                  <LocationDetail
                    location={selectedLocation}
                    user={user}
                    scheduleId={selectedDate.id}
                    key={selectedLocation.id}
                    onVisitComplete={handleVisitComplete}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">موردی انتخاب نشده</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
