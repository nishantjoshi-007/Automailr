import { NavLink, useNavigate } from "react-router";
import { CircleHelp, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

        <div className="ml-1 flex min-w-0 items-center gap-2.5 border-l border-line pl-3.5 max-md:pl-2.5">
          <Avatar className="size-[34px]">
            <AvatarImage src={user.avatar || undefined} alt="" />
            <AvatarFallback className="bg-accent-soft text-[13px] font-[650] text-accent-ink">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[220px] truncate text-[14.5px] text-ink-2 sm:block">{user.email}</span>
          <Button
            variant="outline"
            onClick={signOut}
            aria-label={user.email ? `Sign out of ${user.email}` : "Sign out"}
            className="h-10 px-3 text-[14.5px] text-ink-2 hover:text-ink max-md:w-10 max-md:px-0"
          >
            <LogOut aria-hidden="true" strokeWidth={1.8} />
            <span className="max-md:hidden">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
