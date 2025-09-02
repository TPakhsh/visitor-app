// LoginForm.jsx
import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword, successMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-center mb-4 text-[#2B2E4A]">ورود به حساب کاربری</h2>

      {successMessage && <p className="text-green-600 text-sm mb-2">{successMessage}</p>}
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="ایمیل"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="رمز عبور"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-[#2B2E4A] text-white py-2 rounded hover:bg-[#53354A] transition"
        >
          ورود
        </button>
      </form>

      <div className="flex items-center justify-between text-sm mt-4">
        <button
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:underline"
        >
          ثبت‌نام
        </button>
        <button
          onClick={onSwitchToForgotPassword}
          className="text-blue-600 hover:underline"
        >
          فراموشی رمز؟
        </button>
      </div>
    </div>
  );
}
