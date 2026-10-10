import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimatedRoutes } from "./AnimatedRoutes";
import { MotionConfig } from "motion/react";
import { Analytics } from "@vercel/analytics/react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function isGoogleConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Sonner />
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </MotionConfig>
          <Analytics />
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </GoogleOAuthProvider>
);

export default App;
