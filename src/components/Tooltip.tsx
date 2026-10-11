import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  /** The tip's text. */
  content: ReactNode;
  /** Renders the trigger; spread the props onto the focusable element so it is described by the tip. */
  children: (trigger: { "aria-describedby": string }) => ReactNode;
  /** Which edge of the trigger the tip lines up with. */
  align?: "start" | "end";
  /** Extra classes for the wrapper (layout, e.g. `flex-1`). */
  className?: string;
  /** Extra classes for the tip itself (e.g. hiding it at some widths). */
  tipClassName?: string;
}

/**
 * A small tip above its trigger, shown on hover and while the trigger has focus.
 * CSS only for showing; Escape hides it until the pointer or focus leaves.
 */
export function Tooltip({ content, children, align = "end", className, tipClassName }: TooltipProps) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);

  return (
    <span
      className={cn("group/tip relative inline-flex", className)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !dismissed) setDismissed(true);
      }}
      onMouseLeave={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      {children({ "aria-describedby": id })}
      <span
        role="tooltip"
        id={id}
        className={cn(
          "pointer-events-none absolute bottom-[calc(100%+10px)] z-30 w-max max-w-[min(300px,calc(100vw-32px))] rounded-sm border border-line bg-surface px-3 py-1.5 text-left text-[13.5px] leading-[1.45] font-normal whitespace-normal text-ink-2 opacity-0 shadow-elev transition-opacity duration-150 motion-reduce:transition-none",
          align === "end" ? "right-0" : "left-0",
          !dismissed && "group-hover/tip:opacity-100 group-focus-within/tip:opacity-100",
          tipClassName,
        )}
      >
        {content}
      </span>
    </span>
  );
}
