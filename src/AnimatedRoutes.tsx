// src/AnimatedRoutes.tsx
import { Routes, Route, useLocation, Navigate } from "react-router";
import { AnimatePresence } from "motion/react";
const Home = lazy(() => import("./pages/Home"));
const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
import { useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense, type ReactNode } from "react";

function RouteFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  if (isLoading) return <RouteFallback />;
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
      <Suspense fallback={<RouteFallback />}>
        <Routes
          location={location}
          key={location.pathname.split("/").slice(0, 2).join("/")}
        >
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
      </Suspense>
    </AnimatePresence>
  );
};
