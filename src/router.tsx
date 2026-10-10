import type { ComponentType, ReactNode } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { useAuth } from "@/contexts/AuthContext";

/*
  Data router (createBrowserRouter + RouterProvider) so Link,
  NavLink and navigate() can opt into View Transitions. Each page is its own
  chunk through route `lazy`, which returns the page's default export as the
  route Component. While the first chunk loads, the root route's
  HydrateFallback shows the spinner; on later navigations the current page
  stays up until the next one is ready, then they cross-fade.
*/

function RouteFallback() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-[60vh] items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-line border-t-accent" />
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

type PageModule = { default: ComponentType };
const page = (load: () => Promise<PageModule>) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  {
    id: "root",
    HydrateFallback: RouteFallback,
    children: [
      { index: true, lazy: page(() => import("./pages/Home")) },
      {
        element: (
          <PublicOnly>
            <Outlet />
          </PublicOnly>
        ),
        children: [{ path: "login", lazy: page(() => import("./pages/Landing")) }],
      },
      {
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [{ path: "app/*", lazy: page(() => import("./pages/Dashboard")) }],
      },
      // Public since 5b: AppNav renders the marketing header when signed out.
      { path: "help", lazy: page(() => import("./pages/Help")) },
      { path: "privacy", lazy: page(() => import("./pages/PrivacyPolicy")) },
      { path: "terms", lazy: page(() => import("./pages/TermsOfService")) },
      { path: "contact", lazy: page(() => import("./pages/Contact")) },
      { path: "*", lazy: page(() => import("./pages/NotFound")) },
    ],
  },
]);

/** The app's router. Only components are exported, so Fast Refresh keeps working. */
export function AppRouter() {
  return <RouterProvider router={router} />;
}
