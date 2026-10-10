import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { CircleAlert } from "lucide-react";
import { isGoogleConfigured } from "@/lib/env";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { BrandMark } from "@/components/Brand";
import { GoogleIcon } from "@/components/GoogleIcon";
import { Button } from "@/components/ui/button";

/** Rendered only when a Google client id is configured (the hook needs it). */
function GoogleSignInButton({ onStart, onError }: { onStart: () => void; onError: (message: string) => void }) {
  const navigate = useNavigate();
  const { signIn, busy } = useGoogleSignIn({
    onSuccess: () => navigate("/app", { viewTransition: true }),
    onError,
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full gap-3 [&_svg]:size-5"
      aria-busy={busy || undefined}
      onClick={() => {
        onStart();
        signIn();
      }}
    >
      <GoogleIcon />
      {busy ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-md bg-surface-2 p-4 text-[14.5px] text-ink-2">
      <p>Sign-in isn’t set up on this deployment.</p>
      {import.meta.env.DEV && (
        <p className="mt-1.5 font-mono text-[13px] text-ink-3">
          Set VITE_GOOGLE_CLIENT_ID in .env and restart the dev server.
        </p>
      )}
    </div>
  );
}

const smallLink = "text-accent-ink underline underline-offset-[3px] hover:text-ink";

export default function Landing() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="container flex-1">
        <div className="mx-auto my-[clamp(40px,8vw,112px)] w-full max-w-[440px] rounded-xl border border-line bg-surface p-7">
          <span className="grid size-12 place-items-center rounded-[14px] bg-accent text-on-accent">
            <BrandMark className="h-auto w-[33px]" />
          </span>
          <h1 className="heading mt-5 text-[1.7rem]">Sign in to start sending.</h1>
          <p className="mt-3 text-[15.5px] text-ink-2">
            Automailr asks Google for <code translate="no">gmail.send</code>, so it can send email as you, plus your
            basic profile (name, email address and picture) to show who is signed in. It can’t read, search or delete
            your mail.
          </p>

          <div className="mt-6">
            <div role="alert">
              {error && (
                <p className="mb-3 flex items-start gap-2 text-[14.5px] text-neg">
                  <CircleAlert aria-hidden="true" className="mt-[3px] size-4 flex-none" strokeWidth={2} />
                  {error}
                </p>
              )}
            </div>
            {isGoogleConfigured() ? (
              <GoogleSignInButton onStart={() => setError(null)} onError={setError} />
            ) : (
              <NotConfigured />
            )}
          </div>

          <p className="mt-4 text-[13.5px] text-ink-3">
            By continuing you agree to the{" "}
            <Link to="/terms" viewTransition className={smallLink}>
              Terms
            </Link>{" "}
            and the{" "}
            <Link to="/privacy" viewTransition className={smallLink}>
              Privacy policy
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}
