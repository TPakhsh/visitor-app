import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Spinner from '../shared/Spinner';
import { ErrorMessage, SuccessMessage } from '../shared/Messages';

export default function UpdatePasswordForm({ onSwitchToLogin }) {
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
    } catch (err) {
      setError(err.message || 'خطا در به‌روزرسانی رمز عبور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-sky-700">تغییر رمز عبور</h2>
      <SuccessMessage message={success} />
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">رمز عبور جدید:</label>
        <input type="password" id="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400">
        {loading ? <Spinner /> : 'تغییر رمز عبور'}
      </button>
      <ErrorMessage message={error} />
      <div className="text-center text-sm">
        <p><button type="button" onClick={onSwitchToLogin} className="font-medium text-sky-600 hover:text-sky-500">بازگشت به ورود</button></p>
      </div>
    </form>
  );
}
