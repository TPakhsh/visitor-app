// src/components/auth/ProfileEditForm.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Trash2 } from "lucide-react";

const avatarOptions = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
];

export default function ProfileEditForm({ user }) {
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      if (data) {
        setFullName(data.full_name);
        setAvatarUrl(data.avatar_url || "");
        setPreviewUrl(data.avatar_url || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: avatarUrl || null })
      .eq("id", user.id);

    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl || null,
      },
    });

    if (!updateError && !metaError) {
      setSuccess("تغییرات با موفقیت ذخیره شد.");
    }
  };

  const handleFileUpload = async (file) => {
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      setPreviewUrl(data.publicUrl);
    } else {
      alert("خطا در آپلود تصویر");
    }
  };

  const handleDeleteAvatar = () => {
    setAvatarUrl("");
    setPreviewUrl("");
  };

  if (loading) return <p className="text-center mt-10">در حال بارگذاری...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow font-vazir">
      <h2 className="text-xl font-bold text-center mb-4 text-[#2B2E4A]">
        ویرایش پروفایل کاربر
      </h2>

      {/* نمایش آواتار و نام در بالا */}
      {previewUrl && (
        <div className="text-center mb-4">
          <img
            src={previewUrl}
            alt="avatar"
            className="w-24 h-24 mx-auto rounded-full border"
          />
          <p className="mt-2 font-semibold text-gray-800">{fullName}</p>
        </div>
      )}

      {success && <p className="text-green-600 text-sm mb-3 text-center">{success}</p>}

      {/* آواتارهای آماده */}
      <div className="mb-4">
        <p className="text-sm mb-2 text-gray-700">انتخاب از آواتارهای پیشنهادی:</p>
        <div className="flex gap-3 flex-wrap justify-center">
          {avatarOptions.map((url) => (
            <img
              key={url}
              src={url}
              onClick={() => {
                setAvatarUrl(url);
                setPreviewUrl(url);
              }}
              className={`w-16 h-16 rounded-full cursor-pointer border-2 ${
                avatarUrl === url ? "border-[#E84545]" : "border-transparent"
              } hover:opacity-90`}
              alt="avatar"
            />
          ))}
        </div>
      </div>

      {/* آپلود تصویر دلخواه */}
      <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-1">یا آپلود تصویر دلخواه:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="w-full text-sm"
        />
      </div>

      {previewUrl && (
        <div className="text-center mb-4">
          <button
            onClick={handleDeleteAvatar}
            className="text-xs text-red-600 flex items-center justify-center hover:underline"
          >
            <Trash2 size={14} className="ml-1" /> حذف آواتار فعلی
          </button>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full bg-[#E84545] text-white py-2 rounded hover:bg-[#903749] transition"
      >
        ذخیره تغییرات
      </button>
    </div>
  );
}
