// src/components/auth/Profile.jsx
import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { Trash2, Upload, Save, ImagePlus, ArrowRight } from "lucide-react";
import { useUserMeta } from "../../context/UserMetaContext";

const avatarOptions = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
];

export default function Profile({ user, onBack }) {
  const { userMeta, updateUserMeta } = useUserMeta();
  const [previewUrl, setPreviewUrl] = useState(userMeta.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSelectAvatar = (url) => {
    setPreviewUrl(url);
    setMessage("");
    setIsError(false);
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setMessage("");
    setIsError(false);

    const ext = file.name.split(".").pop();
    const filename = `${user.id}-${Date.now()}.${ext}`;
    const path = `avatars/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setMessage("خطا در آپلود آواتار");
      setIsError(true);
      return;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
    if (publicData?.publicUrl) {
      setPreviewUrl(publicData.publicUrl);
      setMessage("تصویر با موفقیت بارگذاری شد.");
      setIsError(false);
    } else {
      console.error("Public URL not found");
      setMessage("مشکل در دریافت لینک آواتار");
      setIsError(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ avatar_url: previewUrl })
      .eq("id", user.id);

    if (!error) {
      updateUserMeta({ avatar_url: previewUrl });
      setMessage("آواتار با موفقیت ذخیره شد.");
      setIsError(false);
    } else {
      setMessage("ذخیره‌سازی با خطا مواجه شد.");
      setIsError(true);
    }
    setSaving(false);
  };

  const handleDeleteAvatar = () => {
    setPreviewUrl("");
    setMessage("آواتار حذف شد.");
    setIsError(false);
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto mt-6 font-vazir">{/* mt-10 -> mt-6 */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-xl border border-[#53354A]/15">{/* p-6 md:p-8 -> p-5 md:p-6 */}
        {/* بازگشت (اختیاری) */}
        {onBack && (
          <div className="mb-4">{/* mb-6 -> mb-4 */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-[#2B2E4A] hover:text-[#903749] hover:bg-[#f8f0f2] border border-transparent hover:border-[#E84545]/30 rounded-xl px-3 py-1.5 transition"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت
            </button>
          </div>
        )}

        {/* بخش 1: اطلاعات ویزیتور (بدون متن اضافی) */}
        <section className="rounded-2xl border border-[#2B2E4A]/10 bg-white p-4 md:p-5 mb-6">{/* p-5 md:p-6 -> p-4 md:p-5 | mb-8 -> mb-6 */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">{/* mb-5 -> mb-4 */}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="avatar"
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-[#2B2E4A]/10 object-cover shadow"
                />
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-dashed border-[#2B2E4A]/20 bg-[#f8f8fa] text-[#2B2E4A] flex items-center justify-center shadow">
                  <ImagePlus className="w-7 h-7 opacity-70" />
                </div>
              )}

              {previewUrl && (
                <button
                  onClick={handleDeleteAvatar}
                  className="absolute -top-2 -left-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-full p-2 shadow transition"
                  aria-label="حذف آواتار"
                  title="حذف آواتار"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* فقط نام (بولد) */}
            <h1 className="text-xl md:text-2xl font-bold text-[#2B2E4A] mb-1">
              {userMeta.full_name || "کاربر"}
            </h1>

            {/* ایمیل وسط‌چین (در صورت وجود) */}
            {user?.email && (
              <p className="text-sm text-gray-600 mb-0 text-center">{user.email}</p>
            )}
          </div>
        </section>

        {/* پیام وضعیت (بین دو بخش) */}
        {message && (
          <div
            className={`mb-6 text-sm rounded-xl border px-3 py-2 text-center ${/* mb-8 -> mb-6 */
              isError
                ? "text-red-700 bg-red-50 border-red-200"
                : "text-green-700 bg-green-50 border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* بخش 2: تصویر پروفایل */}
        <section className="rounded-2xl border border-[#53354A]/15 bg-[#f9f7f9] p-4 md:p-5">{/* p-5 md:p-6 -> p-4 md:p-5 */}
          {/* تنها جمله‌ی کوتاه راهنما برای انتخاب آواتار */}
          <h3 className="text-sm font-semibold text-[#2B2E4A] mb-2 text-center">{/* mb-3 -> mb-2 */}
            آواتار خود را انتخاب کنید
          </h3>

          {/* آواتارهای پیشنهادی */}
          <div className="flex gap-2 flex-wrap justify-center">{/* gap-3 -> gap-2 */}
            {avatarOptions.map((url) => (
              <button
                type="button"
                key={url}
                onClick={() => handleSelectAvatar(url)}
                className={`relative rounded-full p-1 transition focus:outline-none focus:ring-2 focus:ring-[#E84545]/40 ${
                  previewUrl === url ? "ring-2 ring-[#E84545]" : "ring-0"
                }`}
                title="انتخاب آواتار"
              >
                <img
                  src={url}
                  alt="گزینه آواتار"
                  className="w-16 h-16 rounded-full border border-[#2B2E4A]/10 object-cover hover:opacity-90"
                />
              </button>
            ))}
          </div>

          {/* دکمه آپلود زیر نمونه‌ها */}
          <div className="mt-4 flex justify-center">{/* mt-5 -> mt-4 */}
            <input
              id="avatar-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <label
              htmlFor="avatar-file"
              className="inline-flex items-center gap-2 cursor-pointer bg-[#2B2E4A] hover:bg-[#53354A] text-white px-4 py-2 rounded-xl shadow transition"
            >
              <Upload className="w-4 h-4" />
              انتخاب از فایل‌ها
            </label>
          </div>
        </section>

        {/* دکمه ذخیره */}
        <div className="flex justify-center mt-6">{/* mt-8 -> mt-6 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#E84545] hover:bg-[#903749] text-white px-6 py-2.5 rounded-xl shadow-lg disabled:opacity-70 transition"
          >
            <Save className="w-4 h-4" />
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
