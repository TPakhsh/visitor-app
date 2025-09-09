import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function RegisterForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data?.user) {
      const { user } = data;
      let avatarUrl = null;

      // آپلود آواتار اگر انتخاب شده
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile);
        if (uploadError) {
          setLoading(false);
          setError("آپلود آواتار با خطا مواجه شد.");
          console.error(uploadError);
          return;
        }

        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = publicUrlData?.publicUrl || null;
      }

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: user.id,
          full_name: fullName,
          email: user.email || email,
          avatar_url: avatarUrl,
        },
      ]);

      setLoading(false);

      if (insertError) {
        setError("خطا در ذخیره اطلاعات کاربر");
        console.error(insertError);
        return;
      }

      // پس از ثبت‌نام به صفحه ورود هدایت می‌شود (در App.jsx /login به / ریدایرکت می‌شود)
      navigate("/login");
    } else {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-5 text-right">
      <h2 className="text-xl font-bold mb-1 text-[#2B2E4A]">ثبت‌نام</h2>

      {error ? (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
      ) : null}

      <div>
        <label htmlFor="reg-fullname" className="block text-sm font-medium text-gray-700 mb-1">نام کامل</label>
        <input
          id="reg-fullname"
          type="text"
          placeholder="نام و نام خانوادگی"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#903749] focus:border-transparent placeholder:text-gray-400"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
        <input
          id="reg-email"
          type="email"
          inputMode="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#903749] focus:border-transparent placeholder:text-gray-400"
          required
          dir="ltr"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
        <input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#903749] focus:border-transparent placeholder:text-gray-400"
          required
          dir="ltr"
        />
      </div>

<div className="flex items-center justify-between">
  <label className="text-sm font-medium text-gray-700">انتخاب آواتار (اختیاری)</label>
  <div className="flex items-center gap-3">
    {/* دکمه انتخاب فایل */}
    <label className="btn btn-primary cursor-pointer text-sm px-3 py-1.5">
      انتخاب فایل
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
        className="hidden"
      />
    </label>

    {/* نمایش نام فایل یا پیام پیش‌فرض */}
    <span className="text-xs text-gray-600 truncate max-w-[120px]">
      {avatarFile ? avatarFile.name : "فایلی انتخاب نشده"}
    </span>
  </div>
</div>


      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#2B2E4A] text-white py-2.5 rounded-lg hover:bg-[#53354A] disabled:opacity-60 transition"
      >
        {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
      </button>

      {onSwitchToLogin && (
        <div className="text-sm text-center">
          <button type="button" onClick={onSwitchToLogin} className="text-[#903749] hover:underline">
            حساب دارید؟ ورود
          </button>
        </div>
      )}
    </form>
  );
}
