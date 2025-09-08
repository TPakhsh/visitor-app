// src/components/shared/MobileScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// پوستهٔ استاندارد برای صفحات موبایل
export default function MobileScreen({ title, onBack, right = null, children }) {
  const navigate = useNavigate();

  const smartBack = () => {
    if (typeof onBack === "function") return onBack();
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  return (
    <section
      className="md:hidden font-vazir min-h-[calc(100vh-4rem)] bg-white rounded-t-2xl shadow-sm overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* هدر ثابت */}
      <header className="sticky top-0 z-20 bg-white border-b h-14 px-3 flex items-center justify-between">
        <button
          onClick={smartBack}
          className="inline-flex items-center text-[#2B2E4A] hover:text-[#E84545]"
          aria-label="بازگشت"
        >
          <ArrowRight size={20} className="ml-1" />
          <span className="text-sm">بازگشت</span>
        </button>

        <h1 className="text-[15px] font-semibold text-[#2B2E4A] truncate mx-2">
          {title}
        </h1>

        <div className="min-w-[24px] flex items-center justify-end">
          {right}
        </div>
      </header>

      {/* بدنه با فاصله‌های یکنواخت + فضای امن برای BottomNav */}
      <div className="px-3 py-3 space-y-3 pb-24">
        {children}
      </div>
    </section>
  );
}
