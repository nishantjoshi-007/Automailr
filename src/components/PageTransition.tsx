import type { ReactNode } from "react";

/**
 * Motion-free passthrough. Route changes cross-fade through the View
 * Transitions API instead (see router.tsx and index.css); pages still import
 * this wrapper until 5c–5e remove the usages.
 */
export const PageTransition = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
