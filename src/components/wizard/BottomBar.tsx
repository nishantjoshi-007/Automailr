import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/Tooltip";
import { cn } from "@/lib/utils";

interface BottomBarProps {
  onBack?: () => void;
  backDisabled?: boolean;
  /** Why the primary action is unavailable: a tooltip on the button at ≥ 720 px, a line above the buttons below. */
  reason: string | null;
  primaryLabel?: ReactNode;
  onPrimary?: () => void;
  /** Replaces Back + primary (used for "Stop sending"). */
  children?: ReactNode;
}

/** Sticky footer bar of the wizard (`.bar` in the reference). */
export function BottomBar({ onBack, backDisabled, reason, primaryLabel, onPrimary, children }: BottomBarProps) {
  const disabled = reason !== null;
  return (
    <div className="sticky bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1380px] flex-wrap items-center gap-x-4 gap-y-3 px-[clamp(16px,3vw,40px)] py-3">
        {children ?? (
          <>
            {onBack && (
              <Button variant="outline" className="px-[18px]" onClick={onBack} disabled={backDisabled}>
                <ArrowLeft aria-hidden="true" className="size-[17px]" strokeWidth={1.8} />
                Back
              </Button>
            )}
            {/* Screen readers hear the reason here at every width. */}
            <p aria-live="polite" className="sr-only">
              {reason ?? ""}
            </p>
            {/* Touch has no hover: below 720 px the reason is a visible line above the buttons. */}
            {reason && (
              <p
                aria-hidden="true"
                className="order-first inline-flex w-full items-center gap-2 text-[14.5px] text-ink-2 before:size-2 before:flex-none before:rounded-full before:bg-line-strong before:content-[''] min-[721px]:hidden"
              >
                {reason}
              </p>
            )}
            {primaryLabel && (
              <Tooltip
                content={reason}
                className="ml-auto max-[720px]:flex-1"
                tipClassName={cn("max-[720px]:hidden", !reason && "hidden")}
              >
                {(tip) => (
                  <Button
                    id="bar-primary"
                    className={cn(
                      "px-[18px] max-[720px]:w-full",
                      disabled &&
                        "cursor-not-allowed border-line bg-surface-2 text-ink-3 hover:bg-surface-2 active:translate-y-0",
                    )}
                    aria-disabled={disabled}
                    aria-describedby={reason ? tip["aria-describedby"] : undefined}
                    onClick={() => {
                      if (!disabled) onPrimary?.();
                    }}
                  >
                    {primaryLabel}
                    <ArrowRight aria-hidden="true" className="size-[17px]" strokeWidth={1.8} />
                  </Button>
                )}
              </Tooltip>
            )}
          </>
        )}
      </div>
    </div>
  );
}
