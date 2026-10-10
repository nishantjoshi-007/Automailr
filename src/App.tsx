import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/react";
import { AppRouter } from "./router";

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
          <AppRouter />
          <Analytics />
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </GoogleOAuthProvider>
);

export default App;
