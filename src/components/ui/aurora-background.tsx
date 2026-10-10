"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: React.HTMLProps<HTMLDivElement> & {
  showRadialGradient?: boolean;
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-background bg-zinc-50 dark:bg-zinc-900 transition-bg",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "filter blur-[10px] pointer-events-none absolute inset-[-10px] opacity-30 will-change-transform",
            "dark:[background-image:var(--dark-gradient),var(--aurora)]",
            "[background-image:var(--white-gradient),var(--aurora)]",
            "bg-size-[300%_100%]",
            "mask-[radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]",
            "after:content-[''] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)]",
            "dark:after:[background-image:var(--dark-gradient),var(--aurora)]",
            "after:bg-size-[200%_100%]",
            "after:animate-aurora after:bg-fixed after:mix-blend-difference",
          )}
        ></div>
      </div>
      {showRadialGradient && (
        <div className="absolute inset-0 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      )}
      {children}
    </div>
  );
};
