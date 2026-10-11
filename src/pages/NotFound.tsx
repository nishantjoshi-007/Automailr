import { Link, useLocation } from "react-router";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <main id="main" className="container">
        <div className="mx-auto max-w-[560px] py-[clamp(48px,10vw,128px)] text-center">
          <h1 className="heading text-[clamp(1.9rem,1.4rem+1.6vw,2.6rem)] text-ink">This page doesn&rsquo;t exist.</h1>
          <p className="mt-4 font-mono text-[14px] text-ink-3 [overflow-wrap:anywhere]">{pathname}</p>
          <p className="mt-3 text-ink-2">It may have moved, or the link may be wrong.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/" viewTransition>
                Go to the start
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/help" viewTransition>
                Help
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}
