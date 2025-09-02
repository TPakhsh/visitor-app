import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

function OrderReportingUI({ onReportSubmit }) {
  const [reason, setReason] = useState('');
  const [showReasonField, setShowReasonField] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (orderPlaced) => {
    setSubmitting(true);

    try {
      await onReportSubmit(orderPlaced, orderPlaced ? '' : reason);
      setReason('');
      setShowReasonField(false);
    } catch (err) {
      console.error("خطا در ارسال گزارش:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoOrderClick = () => {
    setShowReasonField(true);
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-700 mb-3">آیا سفارشی ثبت شد؟</h3>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <button
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="flex items-center px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white shadow transition-all disabled:opacity-60"
        >
          <Check size={18} className="ml-2" />
          بله، سفارش ثبت شد
        </button>

        <button
          onClick={handleNoOrderClick}
          disabled={submitting}
          className="flex items-center px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white shadow transition-all disabled:opacity-60"
        >
          <X size={18} className="ml-2" />
          خیر، سفارشی ثبت نشد
        </button>
      </div>

      {showReasonField && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-3"
        >
          <label className="block text-sm text-gray-700 font-medium">
            دلیل ثبت نشدن سفارش:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            placeholder="مثلاً: موجودی داشت / تمایلی نداشت / تعطیل بود و..."
          />
          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-60"
          >
            ثبت گزارش بدون سفارش
          </button>
        </form>
      )}
    </div>
  );
}

export default OrderReportingUI;
