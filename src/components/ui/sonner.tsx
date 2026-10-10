import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-ink group-[.toaster]:border-line group-[.toaster]:rounded-md group-[.toaster]:shadow-elev",
          description: "group-[.toast]:text-ink-2",
          actionButton: "group-[.toast]:bg-accent group-[.toast]:text-on-accent",
          cancelButton: "group-[.toast]:bg-surface-2 group-[.toast]:text-ink-2",
          success: "group-[.toaster]:text-pos",
          error: "group-[.toaster]:text-neg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
