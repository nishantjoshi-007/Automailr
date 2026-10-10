import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.ComponentProps<"textarea">;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-md border border-line bg-surface p-3.5 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft aria-invalid:border-neg aria-invalid:ring-neg-soft disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
