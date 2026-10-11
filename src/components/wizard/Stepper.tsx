import { Link } from "react-router";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS, STEP_NAMES, type Step } from "./constants";

interface StepperProps {
  sessionId: string;
  current: Step;
  /** Sub-label under each name (hidden below 720 px). */
  subs: Record<Step, string>;
  /** Done steps stop being links once a batch has results, or while polishing. */
  linksDisabled: boolean;
}

const dot =
  "grid size-8 flex-none place-items-center rounded-full border-[1.5px] font-display text-[14px] font-bold font-stretch-[110%]";

export function Stepper({ sessionId, current, subs, linksDisabled }: StepperProps) {
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav aria-label="Progress">
      <ol className="flex gap-3 max-[720px]:gap-1.5">
        {STEPS.map((step, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "idle";
          const content = (
            <>
              <span
                className={cn(
                  dot,
                  state === "idle" && "border-line-strong text-ink-3",
                  state === "current" && "border-accent-hover bg-accent text-on-accent",
                  state === "done" && "border-transparent bg-accent-soft text-accent-ink",
                )}
              >
                {state === "done" ? <Check aria-hidden="true" className="size-4" strokeWidth={2.4} /> : i + 1}
              </span>
              <span className="grid min-w-0 max-w-[170px]">
                <span
                  className={cn(
                    "text-[15px] font-[650] text-ink-2 max-[720px]:text-[13.5px]",
                    state === "current" && "text-ink",
                    state === "done" && !linksDisabled && "underline-offset-[3px] group-hover:underline",
                  )}
                >
                  {STEP_NAMES[step]}
                  {state === "done" && <span className="sr-only"> (done)</span>}
                </span>
                <span
                  className={cn(
                    "num truncate text-[13.5px] text-ink-3 max-[720px]:hidden",
                    state === "current" && "text-ink-2",
                  )}
                >
                  {subs[step]}
                </span>
              </span>
            </>
          );
          const row = "flex min-w-0 items-center gap-3 max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-2";
          return (
            <li
              key={step}
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "group relative flex min-w-0 flex-1 items-center gap-3 py-2.5 last:flex-[0_1_auto] max-[720px]:items-start max-[720px]:py-2 max-[720px]:last:flex-1",
                // the connector between steps: in the row at ≥ 720 px; below, the items stack dot over
                // label, so it is drawn through the dot's centre (8 px padding + 16 px), from 8 px past
                // the dot to the item's right edge
                i < STEPS.length - 1 &&
                  "after:ml-2 after:mr-1 after:h-[1.5px] after:min-w-4 after:flex-1 after:bg-line after:content-[''] max-[720px]:after:absolute max-[720px]:after:top-[23.25px] max-[720px]:after:right-0 max-[720px]:after:left-10 max-[720px]:after:m-0 max-[720px]:after:min-w-0",
                state === "done" && "after:bg-accent-ink/50",
              )}
            >
              {state === "done" && !linksDisabled ? (
                <Link
                  to={`/app/${sessionId}/${step}`}
                  viewTransition
                  className={cn(row, "rounded-sm text-inherit no-underline")}
                >
                  {content}
                </Link>
              ) : (
                <span className={row}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
