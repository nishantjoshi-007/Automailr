import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

/** 40 px icon button: moon in light (press for dark), sun in dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const Icon = dark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-grid size-10 flex-none place-items-center rounded-md border border-line bg-surface text-ink-2 transition-[border-color,color] duration-150 hover:border-line-strong hover:text-ink",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
    </button>
  );
}
