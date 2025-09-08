import React, { useState } from 'react';
import Spinner from '../shared/Spinner';
import { ErrorMessage, SuccessMessage } from '../shared/Messages';
import {
  MapPin, Phone, Info, CheckCircle,
  Map as MapIcon, FileText, ClipboardCheck,
  XCircle, ExternalLink
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function LocationDetail({ location, user, scheduleId, onVisitComplete }) {
  const [notes, setNotes] = useState('');
  const [hasOrder, setHasOrder] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visited, setVisited] = useState(false);

  // پنل انتخاب اپ مسیریاب برای iOS/دسکتاپ
  const [mapSheetOpen, setMapSheetOpen] = useState(false);

  const {
    id, name, address, phone, description, latitude, longitude
  } = location;

  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isiOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // باز کردن یک اپ با تلاش برای اسکیمِ اپ + لینک وب به عنوان fallback
  const openDeepLink = ({ app, web }) => {
    // اگر اسکیم اپ داریم، سعی کن اول اپ را باز کنی
    if (app) {
      const t = Date.now();
      window.location.href = app; // iOS/Android اگر نصب باشد باز می‌شود
      // بعد از 800ms اگر اپ باز نشد، برو سراغ وب
      setTimeout(() => {
        if (Date.now() - t < 1500) {
          window.open(web, '_blank');
        }
      }, 800);
    } else {
      window.open(web, '_blank');
    }
  };

  const handleVisitComplete = async () => {
    setSuccess('');
    setError('');

    if (hasOrder === null) {
      setError('لطفاً وضعیت سفارش را مشخص کنید.');
      return;
    }
    if (!hasOrder && notes.trim() === '') {
      setError('توضیح برای ویزیت بدون سفارش الزامی است.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('visit_notes').insert({
        schedule_id: scheduleId,
        location_id: id,
        visitor_id: user.id,
        note: notes,
        has_order: hasOrder,
      });
      if (error) throw error;

      setVisited(true);
      setSuccess('✔ ویزیت با موفقیت ثبت شد.');
      onVisitComplete?.(id);
    } catch (err) {
      console.error(err);
      setError('❌ ثبت ویزیت با مشکل مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  // گزینهٔ یک‌کلیکی: مثل تاریخچه، روی اندروید chooser سیستم را می‌آورد
  const openSystemChooserOrSheet = () => {
    if (!latitude || !longitude) return;

    if (isAndroid()) {
      // اندروید: geo: باعث نمایش لیست اپ‌های مسیریاب نصب‌شده می‌شود
      const label = name ? `(${encodeURIComponent(name)})` : '';
      window.location.href = `geo:${latitude},${longitude}?q=${latitude},${longitude}${label}`;
    } else {
      // iOS / دسکتاپ: پنل انتخاب اختصاصی خودمان
      setMapSheetOpen(true);
    }
  };

  // لینک‌ها
  const links = {
    google: {
      app: isiOS()
        ? 'comgooglemaps://?daddr=' + `${latitude},${longitude}`
        : 'google.navigation:q=' + `${latitude},${longitude}`,
      web: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      label: 'Google Maps',
    },
    waze: {
      app: `waze://?ll=${latitude},${longitude}&navigate=yes`,
      web: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      label: 'Waze',
    },
    neshan: {
      // اگر اپ نصب باشد، اسکیم کار می‌کند؛ در غیر اینصورت به وب/اپ‌استور هدایت می‌شود
      app: `neshan://route?dlat=${latitude}&dlng=${longitude}`,
      web: `https://neshan.org/maps/directions?destination=${latitude},${longitude}`,
      label: 'نشان',
    },
    balad: {
      app: `balad://routing/destination/${latitude},${longitude}`,
      web: `https://balad.ir/route/destination/${latitude},${longitude}`,
      label: 'بلد',
    },
    apple: {
      app: `maps://?daddr=${latitude},${longitude}`,
      web: `https://maps.apple.com/?daddr=${latitude},${longitude}`,
      label: 'Apple Maps',
    },
  };

  return (
<div className="space-y-6 font-vazir mt-2">
  <h2 className="text-xl font-bold text-[#2B2E4A] flex items-center gap-2 mb-2 md:mb-3">
        <FileText size={22} /> جزئیات فروشگاه
      </h2>

      <div className="space-y-2 text-gray-700 bg-[#f9f9fa] p-4 rounded-lg border border-[#ddd]">
        {name && <p className="font-semibold text-lg text-[#903749]">{name}</p>}
        {address && (
          <p className="flex items-center">
            <MapPin className="ml-2 text-[#E84545]" size={18} />
            {address}
          </p>
        )}
        {phone && (
          <p className="flex items-center">
            <Phone className="ml-2 text-green-600" size={18} />
            <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
          </p>
        )}
        {description && (
          <p className="flex items-center">
            <Info className="ml-2 text-yellow-500" size={18} />
            {description}
          </p>
        )}

        {latitude && longitude && (
          <button
            onClick={openSystemChooserOrSheet}
            className="bg-[#2B2E4A] hover:bg-[#53354A] text-white w-full py-2 rounded-md text-sm font-medium transition mt-4 flex items-center justify-center gap-2"
          >
            <MapIcon size={18} /> مسیریابی با اپلیکیشن‌های نقشه
          </button>
        )}
      </div>

      <div className="space-y-4 mt-6">
        <p className="font-medium text-sm text-gray-700 mb-1">آیا سفارشی ثبت شد؟</p>
        <div className="flex gap-3">
          <button
            onClick={() => setHasOrder(true)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
              hasOrder === true
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            <ClipboardCheck size={16} /> سفارش ثبت شد
          </button>
          <button
            onClick={() => setHasOrder(false)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 ${
              hasOrder === false
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            <XCircle size={16} /> سفارش ثبت نشد
          </button>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">توضیحات:</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#903749]"
            rows={4}
          />
        </div>

        <button
          onClick={handleVisitComplete}
          disabled={loading || visited}
          className="w-full py-2 px-4 bg-[#2B2E4A] hover:bg-[#53354A] text-white font-medium rounded-md disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {loading ? <Spinner /> : (<><CheckCircle size={18} /> ویزیت انجام شد</>)}
        </button>

        <SuccessMessage message={success} />
        <ErrorMessage message={error} />
      </div>

      {/* ====== Action Sheet انتخاب اپ نقشه (iOS/دسکتاپ) ====== */}
      {mapSheetOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] flex items-end md:items-center justify-center"
          onClick={() => setMapSheetOpen(false)}
        >
          <div
            className="w-full md:w-[420px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b">
              <p className="font-semibold text-[#2B2E4A]">انتخاب اپلیکیشن مسیریاب</p>
            </div>
            <div className="p-2">
              {/* iOS: Apple Maps را هم پیشنهاد بده */}
              {isiOS() && (
                <button
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    setMapSheetOpen(false);
                    openDeepLink({ app: links.apple.app, web: links.apple.web });
                  }}
                >
                  <span>Apple Maps</span>
                  <ExternalLink size={16} />
                </button>
              )}
              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setMapSheetOpen(false);
                  openDeepLink({ app: links.google.app, web: links.google.web });
                }}
              >
                <span>Google Maps</span>
                <ExternalLink size={16} />
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setMapSheetOpen(false);
                  openDeepLink({ app: links.waze.app, web: links.waze.web });
                }}
              >
                <span>Waze</span>
                <ExternalLink size={16} />
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setMapSheetOpen(false);
                  openDeepLink({ app: links.neshan.app, web: links.neshan.web });
                }}
              >
                <span>نشان</span>
                <ExternalLink size={16} />
              </button>
              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setMapSheetOpen(false);
                  openDeepLink({ app: links.balad.app, web: links.balad.web });
                }}
              >
                <span>بلد</span>
                <ExternalLink size={16} />
              </button>
            </div>
            <div className="p-3 border-t">
              <button
                onClick={() => setMapSheetOpen(false)}
                className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
