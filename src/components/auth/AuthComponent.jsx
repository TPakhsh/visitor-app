import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import UpdatePasswordForm from './UpdatePasswordForm';

export default function AuthComponent() {
  const [view, setView] = useState('login');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setView('updatePassword');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordUpdateSuccess = () => {
    setMessage('رمز عبور با موفقیت به‌روزرسانی شد. لطفاً وارد شوید.');
    setView('login');
    setTimeout(() => setMessage(''), 5000);
  };

  const renderAuthView = () => {
    switch (view) {
      case 'register':
        return <RegisterForm onSwitchToLogin={() => setView('login')} />;
      case 'forgotPassword':
        return <ForgotPasswordForm onSwitchToLogin={() => setView('login')} />;
      case 'updatePassword':
        return (
          <UpdatePasswordForm
            onSwitchToLogin={() => setView('login')}
            onPasswordUpdated={handlePasswordUpdateSuccess}
          />
        );
      default:
        return (
          <LoginForm
            onSwitchToRegister={() => setView('register')}
            onSwitchToForgotPassword={() => setView('forgotPassword')}
            successMessage={message}
          />
        );
    }
  };

  return (
    <div dir="rtl" className="flex items-center justify-center min-h-screen bg-slate-100 font-vazir px-4">
      <div className="w-full max-w-md">
        {/* کارت احراز هویت */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* هدر با لوگو */}
          <div className="flex flex-col items-center justify-center p-6 bg-primary">
            <img
              src="/logo-white.png"
              alt="لوگو"
              className="h-16 w-auto object-contain"  // ⬅️ لوگو بزرگ‌تر
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {/* محتوای فرم‌ها */}
          <div className="p-6">{renderAuthView()}</div>
        </div>
      </div>
    </div>
  );
}
