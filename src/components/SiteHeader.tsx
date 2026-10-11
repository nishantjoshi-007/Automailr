import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

/** First focusable element on every page: jumps past the header to #main. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="absolute -top-20 left-3 z-50 rounded-[6px] bg-ink px-3.5 py-2.5 font-semibold text-bg no-underline focus:top-3"
    >
      Skip to content
    </a>
  );
}

const NAV_LINKS = [
  { to: "/help", label: "Help" },
] as const;

export const navLinkClass =
  "rounded-sm px-3 py-2.5 text-[15px] font-medium text-ink-2 no-underline transition-colors duration-150 hover:bg-surface-2 hover:text-ink aria-[current=page]:text-ink";

const iconButtonClass =
  "inline-grid size-10 flex-none place-items-center rounded-md border border-line bg-surface text-ink-2 transition-[border-color,color] duration-150 hover:border-line-strong hover:text-ink";

/** Public / marketing header: brand, Help, theme toggle, "Start sending". */
export function SiteHeader() {
  const { accessToken } = useAuth();
  const { pathname } = useLocation();
  const ctaTo = accessToken ? "/app" : "/login";
  // On the sign-in page the CTA would point at itself.
  const showCta = pathname !== "/login";

  // The menu is open "for" one pathname, so any route change closes it.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;

  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = (returnFocus: boolean) => {
    setOpenFor(null);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenFor(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-20 border-b border-line bg-bg">
      <SkipLink />
      <div className="container flex min-h-[72px] items-center gap-3">
        <Brand />

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} viewTransition className={navLinkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle className="max-md:ml-auto" />

        {showCta && (
          <Button asChild className="ml-1 hidden px-[18px] font-semibold md:inline-flex">
            <Link to={ctaTo} viewTransition>
              Start sending
            </Link>
          </Button>
        )}

        <button
          ref={buttonRef}
          type="button"
          className={cn(iconButtonClass, "md:hidden")}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => (open ? close(true) : setOpenFor(pathname))}
        >
          {open ? (
            <X aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          ) : (
            <Menu aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          )}
        </button>
      </div>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface md:hidden"
      >
        <nav aria-label="Main menu" className="container grid gap-0.5 pt-2 pb-4">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              viewTransition
              onClick={() => close(false)}
              className="flex min-h-11 items-center rounded-sm px-3 font-medium text-ink-2 no-underline hover:bg-surface-2 hover:text-ink aria-[current=page]:text-ink"
            >
              {l.label}
            </NavLink>
          ))}
          {showCta && (
            <Button asChild className="mt-1.5 w-full font-semibold">
              <Link to={ctaTo} viewTransition onClick={() => close(false)}>
                Start sending
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
