// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

// صفحات
import AuthComponent from "./components/auth/AuthComponent";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import UpdatePasswordForm from "./components/auth/UpdatePasswordForm";
import MainApp from "./components/visits/MainApp";
import ScheduledVisitFlow from "./components/visits/ScheduledVisitFlow";
import AdhocVisitFlow from "./components/visits/AdhocVisitFlow";
import VisitHistory from "./components/visits/VisitHistory";
import Header from "./components/shared/Header";
import LoadingScreen from "./components/shared/LoadingScreen";
import Profile from "./components/auth/Profile";
import CustomerList from "./components/customers/CustomerList";
import CustomerDetail from "./components/customers/CustomerDetail";

// Bottom Nav موبایل
import MobileBottomNav from "./components/shared/MobileBottomNav";

// Context
import { UserMetaProvider, useUserMeta } from "./context/UserMetaContext";

function AppRoutes({ session }) {
  const { updateUserMeta } = useUserMeta();
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    const fetchUserMeta = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (!error && data) {
        updateUserMeta({
          full_name: data.full_name || session.user.email,
          avatar_url: data.avatar_url || "",
        });
      }
      setLoadingMeta(false);
    };
    fetchUserMeta();
  }, [session, updateUserMeta]);

  if (loadingMeta) return <LoadingScreen />;

  return (
    <>
      <Header />
      {/* پدینگ پایین برای جای Bottom Nav در موبایل */}
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <Routes>
          <Route path="/dashboard" element={<MainApp user={session.user} />} />
          <Route path="/visit/scheduled" element={<ScheduledVisitFlow user={session.user} />} />
          <Route path="/visit/new" element={<AdhocVisitFlow user={session.user} />} />
          <Route path="/history" element={<VisitHistory user={session.user} />} />
          <Route path="/profile" element={<Profile user={session.user} />} />
          <Route path="/customers" element={<CustomerList user={session.user} />} />
          <Route path="/customers/:locationId" element={<CustomerDetail />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>

      {/* نوار پایین فقط در موبایل */}
      <MobileBottomNav />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loadingSession) return <LoadingScreen />;

  return (
    <UserMetaProvider>
      {!session ? (
        <Routes>
          <Route path="/" element={<AuthComponent />} />
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />
          <Route path="/forgot-password" element={<Navigate to="/" />} />
          <Route path="/update-password" element={<Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <AppRoutes session={session} />
      )}
    </UserMetaProvider>
  );
}
