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
    <form onSubmit={handleReset} className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-sky-700">فراموشی رمز عبور</h2>
      <SuccessMessage message={success} />
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">ایمیل:</label>
        <input type="email" id="forgot-email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400">
        {loading ? <Spinner /> : 'ارسال لینک بازنشانی'}
      </button>
      <ErrorMessage message={error} />
      <div className="text-center text-sm">
        <p><button type="button" onClick={onSwitchToLogin} className="font-medium text-sky-600 hover:text-sky-500">بازگشت به ورود</button></p>
      </div>
    </form>
  );
}
