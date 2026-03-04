import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = ["Upload CSV", "Compose", "Attachments", "Preview & Send"];

interface StepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  completed?: boolean;
  disabled?: boolean;
}

export function Stepper({ currentStep, onStepClick, completed, disabled }: StepperProps) {
  if (completed) {
    return (
      <div className="flex items-center justify-center py-6 px-4">
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 stepper-completed-pop">
            <Check className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-primary stepper-completed-label">Completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-0 py-6 px-4 overflow-x-auto">
      {STEPS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isClickable = onStepClick && !disabled && (isCompleted || isCurrent);

        return (
          <div key={label} className="flex items-center">
            <div
              className={cn("flex flex-col items-center gap-1.5", isClickable && "cursor-pointer group")}
              onClick={() => isClickable && onStepClick(i)}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStepClick(i);
                }
              }}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "border-2 border-primary text-primary animate-pulse-ring",
                  !isCompleted && !isCurrent && "border border-border text-muted-foreground",
                  isClickable &&
                    "group-hover:ring-2 group-hover:ring-primary/40 group-hover:ring-offset-2 group-hover:ring-offset-background",
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors",
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground",
                  isClickable && "group-hover:text-primary",
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-2 h-px w-8 sm:w-16", i < currentStep ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
