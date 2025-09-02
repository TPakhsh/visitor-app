// src/components/auth/Profile.jsx
import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { Trash2 } from "lucide-react";
import { useUserMeta } from "../../context/UserMetaContext";

const avatarOptions = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
];

export default function Profile({ user }) {
  const { userMeta, updateUserMeta } = useUserMeta();
  const [previewUrl, setPreviewUrl] = useState(userMeta.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSelectAvatar = (url) => {
    setPreviewUrl(url);
  };

  const handleUpload = async (file) => {
    const ext = file.name.split(".").pop();
    const filename = `${user.id}-${Date.now()}.${ext}`;
    const path = `avatars/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setMessage("خطا در آپلود آواتار");
      return;
    }

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
    if (publicData?.publicUrl) {
      setPreviewUrl(publicData.publicUrl);
    } else {
      console.error("Public URL not found");
      setMessage("مشکل در دریافت لینک آواتار");
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
    }

    setSaving(false);
  };

  const handleDeleteAvatar = () => {
    setPreviewUrl("");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-xl shadow-md font-vazir space-y-6">
      {/* مشخصات کاربر */}
      <div className="flex flex-col items-center text-center">
        {previewUrl ? (
          <img src={previewUrl} alt="avatar" className="w-24 h-24 rounded-full border" />
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">بدون آواتار</div>
        )}
        <p className="mt-3 text-lg font-semibold text-[#2B2E4A]">{userMeta.full_name}</p>
        {previewUrl && (
          <button
            onClick={handleDeleteAvatar}
            className="text-xs text-red-600 mt-2 flex items-center justify-center hover:underline"
          >
            <Trash2 size={14} className="ml-1" /> حذف آواتار
          </button>
        )}
      </div>

      {message && (
        <div className="text-center text-sm text-green-600 bg-green-50 border border-green-200 rounded py-2 px-3">
          {message}
        </div>
      )}

      {/* انتخاب آواتار آماده */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">انتخاب از آواتارهای پیشنهادی:</h3>
        <div className="flex gap-3 flex-wrap justify-center">
          {avatarOptions.map((url) => (
            <img
              key={url}
              src={url}
              onClick={() => handleSelectAvatar(url)}
              className={`w-16 h-16 rounded-full cursor-pointer border-2 ${
                previewUrl === url ? "border-[#E84545]" : "border-transparent"
              } hover:opacity-90`}
              alt="avatar"
            />
          ))}
        </div>
      </div>

      {/* آپلود آواتار دلخواه */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">آپلود تصویر دلخواه:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files.length > 0) {
              handleUpload(e.target.files[0]);
            }
          }}
          className="w-full text-sm"
        />
      </div>

      {/* دکمه ذخیره */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#E84545] text-white py-2 rounded hover:bg-[#903749] transition"
        >
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>
    </div>
  );
}
