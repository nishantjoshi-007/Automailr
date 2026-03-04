// src/AnimatedRoutes.tsx
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Contact from "./pages/Contact";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  if (isLoading) return <AuthGate>{null}</AuthGate>;
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  if (isLoading) return <AuthGate>{null}</AuthGate>;
  if (accessToken) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split("/").slice(0, 2).join("/")}>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Landing />
            </PublicOnly>
          }
        />
        <Route
          path="/app/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};
