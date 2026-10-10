import { Toaster as Sonner } from "@/components/ui/sonner";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@vercel/analytics/react";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { AppRouter } from "./router";

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <ThemeProvider>
      <AuthProvider>
        <Sonner />
        <AppRouter />
        <Analytics />
      </AuthProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
);

export default App;
