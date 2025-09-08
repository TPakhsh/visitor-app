// src/components/shared/MobileBottomNav.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Route, MapPin, ListChecks, Users } from "lucide-react";

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { path: "/m/visit/scheduled", label: "برنامه‌ریزی", Icon: Route },
    { path: "/history",           label: "تاریخچه",    Icon: ListChecks },
    { path: "/customers",         label: "مشتریان",    Icon: Users },
    { path: "/dashboard",         label: "داشبورد",    Icon: Home },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav className="relative bg-white border-t border-gray-200 shadow-md">
        {/* FAB: ثبت ویزیت جدید */}
        <button
          onClick={() => navigate("/visit/new")}
          aria-label="ثبت ویزیت جدید"
          className="absolute -top-6 right-1/2 translate-x-1/2 w-14 h-14 rounded-full bg-[var(--c-accent)] text-white shadow-xl border-4 border-white flex items-center justify-center"
        >
          <MapPin size={24} />
        </button>

        {/* آیتم‌ها */}
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {links.map(({ path, label, Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-lg transition ${
                  active ? "nav-active" : "text-[var(--c-ink)] hover:bg-gray-50"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={22} />
                <span className="text-[11px] leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
