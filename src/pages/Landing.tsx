import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { isGoogleConfigured } from "@/App";
import { Footer } from "@/components/Footer";
import { GoogleIcon } from "@/components/GoogleIcon";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";

function GoogleLoginButton() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await login(tokenResponse.access_token);
        navigate("/app");
      } catch {
        toast.error("Google sign-in failed. Please try again.");
      }
    },
    onError: () => {
      toast.error("Google sign-in failed. Please try again.");
    },
    scope: "https://www.googleapis.com/auth/gmail.send",
    prompt: "select_account", // force the account selection screen
  });

  return (
    <Button
      size="lg"
      className="w-full gap-3 text-base h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
      onClick={() => googleLogin()}
    >
      <GoogleIcon className="h-5 w-5" />
      Sign in with Google
    </Button>
  );
}

function ConfigError() {
  return (
    <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-4">
      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold text-base">Google OAuth not configured</p>
        <p className="mt-2 text-xs text-destructive/80 leading-relaxed">
          Set <code className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono">VITE_GOOGLE_CLIENT_ID</code> in a{" "}
          <code className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono">.env</code> file and restart the dev
          server.
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const configured = isGoogleConfigured();

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <div className="relative flex flex-1 items-center justify-center px-4 pt-20 pb-10">
        <AuroraBackground className="absolute inset-0 z-0 opacity-40 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass relative z-10 flex flex-col items-center gap-8 rounded-3xl p-8 sm:p-12 max-w-md w-full text-center border-border/50 shadow-2xl bg-card/50 backdrop-blur-xl"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-3xl shadow-xl shadow-primary/20">
              A
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
          </div>

          <p className="text-muted-foreground text-lg leading-relaxed">
            Continue to your dashboard to manage your email campaigns.
          </p>

          <div className="w-full space-y-4">{configured ? <GoogleLoginButton /> : <ConfigError />}</div>

          <div className="px-4 py-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground text-left w-full mt-4">
            <p className="flex gap-2">
              <span className="shrink-0 text-lg">🛡️</span>
              <span>
                We only request permission to see and send emails.
                <strong>No data is stored on our servers.</strong> Everything happens locally in your browser.
              </span>
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </PageTransition>
  );
}
