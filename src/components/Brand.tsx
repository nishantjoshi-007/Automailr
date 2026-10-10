import { Link } from "react-router";
import { cn } from "@/lib/utils";

/** The Automailr mark: an "A" cut by a forward arrow. Same path as public/logo.svg. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M4 87.2L34.2 9.8 46 9.8 58.2 41.2A101.7 101.7 0 0 0 45.3 45.1L40.1 31.7 29.1 60A95.8 95.8 0 0 1 76.5 44.5L76 33.5 100 50 77.8 68.9 77.2 57.9A82.4 82.4 0 0 0 18.5 87.2ZM54.5 68.6A76.5 76.5 0 0 1 67.5 65L76.2 87.2 61.7 87.2Z"
      />
    </svg>
  );
}

interface BrandProps {
  to?: string;
  /** Show the "Automailr" wordmark beside the tile (default true). */
  wordmark?: boolean;
  className?: string;
}

/** Logo tile plus wordmark, linking home. */
export function Brand({ to = "/", wordmark = true, className }: BrandProps) {
  return (
    <Link
      to={to}
      viewTransition
      aria-label="Automailr home"
      className={cn("inline-flex min-w-0 items-center gap-2.5 rounded-[6px] text-ink no-underline", className)}
    >
      <span className="grid size-8 flex-none place-items-center rounded-[9px] bg-accent text-on-accent shadow-[inset_0_0_0_1px_var(--color-accent-hover)]">
        <BrandMark className="h-auto w-[22px]" />
      </span>
      {wordmark && (
        <span
          translate="no"
          className="font-display text-[19px] font-[750] leading-none tracking-[-0.02em] font-stretch-[108%]"
        >
          Automailr
        </span>
      )}
    </Link>
  );
}
