import React, { useState } from 'react';
import Spinner from '../shared/Spinner';
import { ErrorMessage, SuccessMessage } from '../shared/Messages';
import {
  MapPin, Phone, Info, CheckCircle,
  ExternalLink, FileText, ClipboardCheck,
  XCircle, Map
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export default function LocationDetail({ location, user, scheduleId, onVisitComplete }) {
  const [notes, setNotes] = useState('');
  const [hasOrder, setHasOrder] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visited, setVisited] = useState(false);

  const {
    id,
    name,
    address,
    phone,
    description,
    latitude,
    longitude
  } = location;

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
      if (onVisitComplete) onVisitComplete(id);
    } catch (err) {
      console.error(err);
      setError('❌ ثبت ویزیت با مشکل مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  const openMapOptions = () => {
    if (!latitude || !longitude) return;

    const urlGoogle = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    const urlNeshan = `https://neshan.org/maps/directions?destination=${latitude},${longitude}`;
    const urlWaze = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    const urlBalad = `https://balad.ir/route/destination/${latitude},${longitude}`;

    const options = [
      { name: 'Google Maps', link: urlGoogle },
      { name: 'نشان', link: urlNeshan },
      { name: 'Waze', link: urlWaze },
      { name: 'بلد', link: urlBalad },
    ];

    options.forEach(({ link }) => {
      const w = window.open(link, '_blank');
      if (w) w.focus();
    });
  };

  return (
    <div className="space-y-6 font-vazir">
      <h2 className="text-xl font-bold text-[#2B2E4A] flex items-center gap-2">
        <FileText size={22} /> جزئیات فروشگاه
      </h2>

      <div className="space-y-2 text-gray-700 bg-[#f9f9fa] p-4 rounded-lg border border-[#ddd]">
        {name && <p className="font-semibold text-lg text-[#903749]">{name}</p>}
        {address && <p className="flex items-center"><MapPin className="ml-2 text-[#E84545]" size={18} />{address}</p>}
        {phone && <p className="flex items-center"><Phone className="ml-2 text-green-600" size={18} />{phone}</p>}
        {description && <p className="flex items-center"><Info className="ml-2 text-yellow-500" size={18} />{description}</p>}

        {latitude && longitude && (
          <button
            onClick={openMapOptions}
            className="bg-[#2B2E4A] hover:bg-[#53354A] text-white w-full py-2 rounded-md text-sm font-medium transition mt-4 flex items-center justify-center gap-2"
          >
            <Map size={18} /> مسیریابی با اپلیکیشن‌های نقشه
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
          {loading ? <Spinner /> : <><CheckCircle size={18} /> ویزیت انجام شد</>}
        </button>

        <SuccessMessage message={success} />
        <ErrorMessage message={error} />
      </div>
    </div>
  );
}
