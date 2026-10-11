import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { ChevronDown, CircleHelp, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteHeader, SkipLink, navLinkClass } from "@/components/SiteHeader";
import { cn } from "@/lib/utils";

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email[0] ?? "?").toUpperCase();
}

interface AccountMenuProps {
  name: string;
  email: string;
  avatar?: string;
  onSignOut: () => void;
}

/** Avatar button with a one-item menu (the email, then Sign out). Hand-written menu button pattern. */
function AccountMenu({ name, email, avatar, onSignOut }: AccountMenuProps) {
  const { pathname } = useLocation();
  // Open "for" one pathname, so a route change closes it.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  /** Opens the menu and, once it is shown, moves focus into it. */
  const openAndFocus = (which: "first" | "last") => {
    setOpenFor(pathname);
    requestAnimationFrame(() => {
      const list = items();
      (which === "first" ? list[0] : list[list.length - 1])?.focus();
    });
  };
  const close = (returnFocus: boolean) => {
    setOpenFor(null);
    if (returnFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenFor(null);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenFor(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openAndFocus(e.key === "ArrowDown" ? "first" : "last");
    }
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const move = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") move(at + 1);
    else if (e.key === "ArrowUp") move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(list.length - 1);
    else if (e.key === "Tab") setOpenFor(null);
  };

  return (
    <div ref={wrapRef} className="relative ml-1 flex-none">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${email}`}
        onClick={(e) => {
          if (open) close(false);
          // Enter and Space arrive as a click with no pointer: take focus into the menu, as a menu button does.
          else if (e.detail === 0) openAndFocus("first");
          else setOpenFor(pathname);
        }}
        onKeyDown={onButtonKey}
        className="group inline-flex h-11 items-center gap-1 rounded-md py-1 pr-1.5 pl-1 text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-2 aria-expanded:bg-surface-2 aria-expanded:text-ink-2"
      >
        <Avatar className="size-9">
          <AvatarImage src={avatar || undefined} alt="" />
          <AvatarFallback className="bg-accent-soft text-[13px] font-[650] text-accent-ink">{initials(name, email)}</AvatarFallback>
        </Avatar>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 transition-transform duration-150 group-aria-expanded:rotate-180"
          strokeWidth={1.8}
        />
      </button>

      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label="Account"
        hidden={!open}
        onKeyDown={onMenuKey}
        className="absolute top-[calc(100%+6px)] right-0 z-40 w-[220px] rounded-md border border-line bg-surface p-1.5 shadow-elev"
      >
        <div role="none" className="truncate px-2.5 py-2 text-[14px] text-ink-2">
          {email}
        </div>
        <div role="separator" className="-mx-1.5 my-1.5 h-px bg-line" />
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          onClick={() => {
            setOpenFor(null);
            onSignOut();
          }}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-sm px-2.5 text-left text-[14.5px] font-medium text-ink transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2"
        >
          <LogOut aria-hidden="true" className="size-[17px] text-ink-2" strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </div>
  );
}

/** App bar for signed-in pages; falls back to the public header when signed out. */
export function AppNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <SiteHeader />;

  const signOut = async () => {
    await logout();
    navigate("/", { viewTransition: true });
  };

  return (
    <header className="relative z-20 border-b border-line bg-surface">
      <SkipLink />
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1380px] items-center gap-2.5 px-[clamp(16px,3vw,40px)]">
        <Brand />

        <NavLink
          to="/help"
          viewTransition
          className={cn(navLinkClass, "ml-auto inline-flex items-center gap-2 py-2 max-md:px-2")}
        >
          <CircleHelp aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          <span className="max-md:sr-only">Help</span>
        </NavLink>

        <ThemeToggle />

        <AccountMenu name={user.name} email={user.email} avatar={user.avatar} onSignOut={() => void signOut()} />
      </div>
    </header>
  );
}
