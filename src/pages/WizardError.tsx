import { Link, isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { STORAGE_KEY } from "@/components/wizard/constants";
import { makeSessionId } from "@/components/wizard/state";
import { card } from "@/components/wizard/ui";
import { secureStorage } from "@/utils/secureStorage";

function errorText(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`.trim();
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "Unknown error";
}

/**
 * The /app/* route's error boundary: a batch that breaks the wizard (a bad
 * file, an old saved state) lands here instead of React Router's default
 * page. "Start over" drops the saved batch and opens a fresh session (L6).
 */
export default function WizardError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const startOver = () => {
    secureStorage.removeItem(STORAGE_KEY);
    navigate(`/app/${makeSessionId()}/recipients`, { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <AppNav />
      <main id="main" className="flex flex-1 items-center justify-center px-[clamp(16px,3vw,40px)] py-[clamp(48px,10vw,128px)]">
        <section role="alert" className={`${card} w-full max-w-[560px] p-[clamp(24px,4vw,40px)] text-center`}>
          <h1 className="heading text-[clamp(1.5rem,1.2rem+1vw,2rem)] text-ink">Something went wrong with this batch.</h1>
          <p className="mt-4 font-mono text-[13.5px] text-ink-3 [overflow-wrap:anywhere]">{errorText(error)}</p>
          <p className="mt-3 text-ink-2">Starting over clears the saved list and message in this tab.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <Button onClick={startOver}>Start over</Button>
            <Link
              to="/help"
              viewTransition
              className="text-[15px] text-ink-2 underline underline-offset-[3px] transition-colors duration-150 hover:text-ink"
            >
              Help
            </Link>
          </div>
        </section>
      </main>
      <Footer compact wide />
    </div>
  );
}
