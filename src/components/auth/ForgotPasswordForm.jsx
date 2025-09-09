import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Spinner from '../shared/Spinner';
import { ErrorMessage, SuccessMessage } from '../shared/Messages';

export default function ForgotPasswordForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccess('لینک بازنشانی رمز عبور به ایمیل شما ارسال شد.');
    } catch (err) {
      setError(err.message || 'خطایی رخ داد. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleReset} className="space-y-4 text-right">
      <h2 className="text-xl font-bold text-[#2B2E4A]">فراموشی رمز عبور</h2>
      <SuccessMessage message={success} />
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
        <input
          type="email"
          id="forgot-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          dir="ltr"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#903749] focus:border-transparent placeholder:text-gray-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#2B2E4A] hover:bg-[#53354A] disabled:opacity-60 transition"
      >
        {loading ? <Spinner /> : 'ارسال لینک بازنشانی'}
      </button>
      <ErrorMessage message={error} />
      <div className="text-center text-sm">
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-[#903749] hover:underline">
          بازگشت به ورود
        </button>
      </div>
    </form>
  );
}
