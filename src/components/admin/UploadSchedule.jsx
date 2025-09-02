import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import jalali from "dayjs-jalali";

dayjs.extend(jalali);

export default function UploadSchedule() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage("");

    const workbook = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const { data: users } = await supabase.from("users").select("id, full_name, email");

    const failed = [];
    const inserts = [];

    for (const row of rows) {
      const fullName = row["نام واسطه"]?.trim();
      const user = users.find((u) => u.full_name === fullName);
      if (!user) {
        failed.push(`کاربر "${fullName}" پیدا نشد`);
        continue;
      }

      const store_name = row["نام مشتری"];
      const locationStr = row["لوکیشن"];
      const [latStr, lngStr] = locationStr?.split(",") || [];
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lngStr);

      const rawDate = String(row["تاریخ"] || "").trim();
      const date = dayjs(rawDate, ["jYYYY/M/D", "jYYYY-MM-DD", "YYYY/MM/DD"], "fa").isValid()
        ? dayjs(rawDate, ["jYYYY/M/D", "jYYYY-MM-DD", "YYYY/MM/DD"], "fa").format("YYYY-MM-DD")
        : null;

      if (!store_name || isNaN(latitude) || isNaN(longitude) || !date) {
        failed.push(`ردیف ناقص: ${store_name || "بدون نام"} - ${rawDate}`);
        continue;
      }

      inserts.push({
        user_id: user.id,
        store_name,
        latitude,
        longitude,
        date,
        date_label: dayjs(date).locale("fa").format("D MMMM YYYY"),
        category: row["تقسم بندی"] || null,
      });
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from("schedules").insert(inserts);
      if (error) {
        setMessage("خطا در ثبت اطلاعات: " + error.message);
        setLoading(false);
        return;
      }
    }

    if (failed.length > 0) {
      setMessage(`برخی ردیف‌ها ثبت نشدند:\n${failed.join("\n")}`);
    } else {
      setMessage("تمام اطلاعات با موفقیت بارگذاری شد.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow font-vazir">
      <h2 className="text-xl font-bold mb-4 text-[#2B2E4A]">بارگذاری برنامه ویزیت</h2>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4 w-full"
      />
      {loading && <p className="text-blue-600 text-sm">در حال پردازش فایل...</p>}
      {message && <pre className="text-sm mt-4 whitespace-pre-wrap text-red-700 bg-red-50 p-2 rounded">{message}</pre>}
    </div>
  );
}
