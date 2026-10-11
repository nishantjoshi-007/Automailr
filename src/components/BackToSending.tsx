import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { secureStorage } from "@/utils/secureStorage";
import { STORAGE_KEY } from "@/components/wizard/constants";

/**
 * A quiet way back to the wizard from the reading pages, shown only to a
 * signed-in user. Says "your batch" when this tab has one in progress.
 */
export function BackToSending() {
  const { user } = useAuth();
  const [hasBatch, setHasBatch] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    secureStorage
      .getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const state = JSON.parse(raw) as { csv?: unknown; ownerEmail?: string };
          setHasBatch(Boolean(state.csv) && (!state.ownerEmail || state.ownerEmail === user.email));
        } catch {
          /* unreadable state: no batch */
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;
  return (
    <Link
      to="/app"
      viewTransition
      className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink-2 no-underline hover:text-ink hover:underline underline-offset-[3px]"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {hasBatch ? "Back to your batch" : "Back to sending"}
    </Link>
  );
}
