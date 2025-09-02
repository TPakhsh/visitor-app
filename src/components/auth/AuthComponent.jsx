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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
        return <UpdatePasswordForm onPasswordUpdated={handlePasswordUpdateSuccess} />;
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
    <div className="flex items-center justify-center min-h-screen bg-slate-100 font-vazir">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        {renderAuthView()}
      </div>
    </div>
  );
}
