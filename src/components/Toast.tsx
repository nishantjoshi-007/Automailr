import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** How long a toast stays up before it fades out on its own. */
export const TOAST_MS = 3500;

interface ToastState {
  id: number;
  message: string;
  open: boolean;
  /** Px from the viewport bottom to the top of the anchor (the wizard's bottom bar), measured on show. */
  above: number;
}

let state: ToastState | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

/** Height of whatever is marked `data-toast-anchor` above the viewport bottom (0 when absent or off screen). */
function anchorOffset() {
  const anchor = document.querySelector("[data-toast-anchor]");
  if (!anchor) return 0;
  return Math.max(0, Math.round(window.innerHeight - anchor.getBoundingClientRect().top));
}

/**
 * One toast at a time, shown by `<ToastHost />`. `toast.show` replaces whatever is up and
 * restarts the 3.5 s timer; any pointerdown outside the toast dismisses it early.
 */
export const toast = {
  show(message: string) {
    clearTimeout(timer);
    state = { id: ++nextId, message, open: true, above: anchorOffset() };
    timer = setTimeout(() => toast.dismiss(), TOAST_MS);
    emit();
  },
  dismiss() {
    clearTimeout(timer);
    if (!state?.open) return;
    // Keep the text so it can fade out; `invisible` takes it out of the accessibility tree after.
    state = { ...state, open: false };
    emit();
  },
  /** Drops the toast at once (the host unmounting). */
  clear() {
    clearTimeout(timer);
    if (state === null) return;
    state = null;
    emit();
  },
};

/** Mount once per page that shows toasts. */
export function ToastHost() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const boxRef = useRef<HTMLDivElement>(null);
  const open = current?.open ?? false;

  useEffect(() => () => toast.clear(), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) toast.dismiss();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[max(24px,calc(var(--toast-above,0px)+16px))] z-40 flex justify-center"
      style={{ "--toast-above": `${current?.above ?? 0}px` } as CSSProperties}
    >
      {current && (
        <div
          // a new id is a new element, so each toast fades in and is announced again
          key={current.id}
          ref={boxRef}
          className={cn(
            "pointer-events-auto max-w-[min(440px,100%)] rounded-[10px] bg-ink px-4 py-2.5 text-center text-[14.5px] leading-[1.45] text-bg shadow-elev transition-[opacity,visibility] duration-150 starting:opacity-0 motion-reduce:transition-none",
            !open && "invisible opacity-0",
          )}
        >
          {current.message}
        </div>
      )}
    </div>
  );
}
