import { Link } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/utils";

const linkClass = "py-1 text-ink-2 no-underline hover:text-ink hover:underline underline-offset-[3px]";

function FooterLinks() {
  return (
    <nav aria-label="Footer" className="flex flex-wrap gap-x-[22px] gap-y-2">
      <Link to="/" viewTransition className={linkClass}>
        About
      </Link>
      <Link to="/help" viewTransition className={linkClass}>
        Help
      </Link>
      <Link to="/contact" viewTransition className={linkClass}>
        Contact
      </Link>
      <Link to="/privacy" viewTransition className={linkClass}>
        Privacy
      </Link>
      <Link to="/terms" viewTransition className={linkClass}>
        Terms
      </Link>
      <a href="https://github.com/nishantjoshi-007/Automailr" target="_blank" rel="noopener" className={linkClass}>
        GitHub
      </a>
    </nav>
  );
}

interface FooterProps {
  className?: string;
  /** One quiet row (links + credit) for app pages: no sentence, no CTA. */
  compact?: boolean;
  /** Use the app bar's wider container (the wizard's width) instead of `container`. */
  wide?: boolean;
  /** Show the "Start sending" button in the top row (the landing only). */
  cta?: boolean;
}

const wideClass = "mx-auto w-full max-w-[1380px] px-[clamp(16px,3vw,40px)]";

export function Footer({ className, compact = false, wide = false, cta = false }: FooterProps) {
  const { accessToken } = useAuth();

  if (compact) {
    return (
      <footer className={cn("mt-auto border-t border-line", className)}>
        <div className={cn(wide ? wideClass : "container", "flex flex-wrap justify-between gap-x-6 gap-y-3 py-5 text-sm text-ink-3")}>
          <FooterLinks />
          <span>Made by Nishant Joshi</span>
        </div>
      </footer>
    );
  }

  return (
    // mt-auto keeps the footer at the bottom of short flex-column pages; the
    // padding above the border is the reference's clamp(24px, 4vw, 48px) gap.
    <footer className={cn("mt-auto pt-[clamp(24px,4vw,48px)]", className)}>
      <div className="border-t border-line pt-10 pb-12">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Brand />
            <p className="max-w-[34rem] text-[15px] text-ink-2">
              Free, open-source mail merge for Gmail. Licensed for personal, non-commercial use.
            </p>
            {cta && (
              <Button asChild className="px-[18px] font-semibold max-[460px]:w-full">
                <Link to={accessToken ? "/app" : "/login"} viewTransition>
                  Start sending
                </Link>
              </Button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-line pt-6 text-sm text-ink-3">
            <FooterLinks />
            <span>Made by Nishant Joshi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
