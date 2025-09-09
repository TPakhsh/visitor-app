// LoginForm.jsx
import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, successMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message || "خطا در ورود.");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5 text-right">
      <h2 className="text-xl font-bold mb-1 text-[#2B2E4A]">ورود به حساب کاربری</h2>

      {successMessage ? (
        <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-md p-2">{successMessage}</p>
      ) : null}
      {error ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      ) : null}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
        <input
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="example@email.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#903749] focus:border-transparent placeholder:text-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#903749] focus:border-transparent placeholder:text-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          dir="ltr"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#2B2E4A] text-white py-2.5 rounded-lg hover:bg-[#53354A] disabled:opacity-60 transition"
      >
        {loading ? "در حال ورود..." : "ورود"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onSwitchToRegister} className="text-[#903749] hover:underline">
          ثبت‌نام
        </button>
        <button type="button" onClick={onSwitchToForgotPassword} className="text-[#903749] hover:underline">
          فراموشی رمز؟
        </button>
      </div>
    </form>
  );
}
