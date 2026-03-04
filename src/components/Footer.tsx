import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("glass mt-auto border-t border-border/50", className)}>
      <div className="mx-auto flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-extrabold">
            A
          </div>
          <span className="font-semibold text-foreground">Automailr</span>
          <span className="hidden sm:inline">·</span> */}
          {/* <span className="hidden sm:inline">Personalized emails, sent at scale.</span>
          <span className="hidden sm:inline">·</span> */}
          <span>All processing happens in your browser</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">No data leaves your device</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link to="/privacy" className="transition-colors hover:text-foreground underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link to="/terms" className="transition-colors hover:text-foreground underline-offset-4 hover:underline">
            Terms of Service
          </Link>
          <span>·</span>
          <Link to="/contact" className="transition-colors hover:text-foreground underline-offset-4 hover:underline">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
