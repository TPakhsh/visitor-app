import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Spinner from '../shared/Spinner';
import { ErrorMessage, SuccessMessage } from '../shared/Messages';

export default function UpdatePasswordForm({ onSwitchToLogin, onPasswordUpdated }) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess('رمز عبور با موفقیت به‌روزرسانی شد. اکنون می‌توانید وارد شوید.');
      if (onPasswordUpdated) onPasswordUpdated();
    } catch (err) {
      setError(err.message || 'خطا در به‌روزرسانی رمز عبور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4 text-right">
      <h2 className="text-xl font-bold text-[#2B2E4A]">تغییر رمز عبور</h2>
      <SuccessMessage message={success} />
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">رمز عبور جدید</label>
        <input
          type="password"
          id="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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
        {loading ? <Spinner /> : 'تغییر رمز عبور'}
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
