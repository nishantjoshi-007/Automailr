import { useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { RESULTS_ROWS_SHOWN } from "./constants";
import { outcomeOf, type RunProgress } from "./sender";
import type { RowResult } from "./state";
import { card, seg, segBtn } from "./ui";

interface ReauthNoticeProps {
  message: string;
  /** The signed-in address, so Google skips the account chooser. */
  email: string;
  className?: string;
}

/** Inline "sign in again" notice with the re-auth button (M1). */
export function ReauthNotice({ message, email, className }: ReauthNoticeProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, busy } = useGoogleSignIn({
    reauthEmail: email || undefined,
    onSuccess: () => setAuthError(null),
    onError: setAuthError,
  });
  return (
    <div className={cn("grid gap-3 rounded-md bg-surface-2 p-4 text-[15px] text-ink-2", className)}>
      <p role="status" className="flex items-start gap-2.5">
        <Clock aria-hidden="true" className="mt-0.5 size-[18px] flex-none text-ink-3" strokeWidth={1.8} />
        <span>{message}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3 pl-7">
        <Button variant="outline" size="sm" onClick={signIn} aria-busy={busy || undefined} disabled={busy}>
          {busy ? "Opening Google…" : "Sign in again"}
        </Button>
        {authError && (
          <p role="alert" className="text-[14px] text-neg">
            {authError}
          </p>
        )}
      </div>
    </div>
  );
}

export function SendingView({ progress, from }: { progress: RunProgress; from: string }) {
  const { expired } = useAuth();
  const done = progress.sent + progress.failed;
  const pct = progress.total ? (done / progress.total) * 100 : 0;
  const left = progress.total - done;
  const current = progress.current;
  const gone = progress.paused === "unauthorized" || expired;
  return (
    <section aria-label="Sending progress" className={cn(card, "mb-8 grid max-w-[720px] gap-5 p-6 max-[720px]:p-4")}>
      <p className="numeral text-[clamp(2.8rem,1.7rem+2.6vw,4.4rem)]">
        {done.toLocaleString("en")}
        <span className="text-ink-3"> / {progress.total.toLocaleString("en")}</span>
      </p>
      <Progress value={pct} aria-label="Sending progress" className="h-2.5" />
      {progress.paused ? (
        <ReauthNotice
          email={from}
          message={`Paused: your sign-in ${gone ? "has expired" : "is about to expire"}. Sign in again to continue.`}
        />
      ) : (
        <p className="text-[15.5px] text-ink-2 [overflow-wrap:anywhere]">
          {current ? (
            <>
              Sending to <span className="font-mono text-[14.5px] text-ink">{current.email}</span>{" "}
              <span className="num">
                ({Math.min(done + 1, progress.total).toLocaleString("en")} of {progress.total.toLocaleString("en")})
              </span>
            </>
          ) : (
            "Getting the attachments ready…"
          )}
        </p>
      )}
      <p aria-live="polite" className="num text-[15px] text-ink-2">
        {progress.sent.toLocaleString("en")} sent · {progress.failed.toLocaleString("en")} failed · {left.toLocaleString("en")} left
      </p>
    </section>
  );
}

const STATUS: Record<RowResult["status"], { label: string; variant: "success" | "destructive" | "secondary" | "outline" }> = {
  sent: { label: "Sent", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  skipped: { label: "Skipped", variant: "secondary" },
  notSent: { label: "Not sent", variant: "outline" },
};

type Filter = "all" | "failed" | "notSent";

interface ResultsViewProps {
  results: RowResult[];
  from: string;
  onRetry: (indices: number[]) => void;
  onDownload: () => void;
  onNewBatch: () => void;
}

export function ResultsView({ results, from, onRetry, onDownload, onNewBatch }: ResultsViewProps) {
  const o = outcomeOf(results);
  // While the session is expired the wizard's banner carries the sign-in button.
  const { expired } = useAuth();
  const [filter, setFilter] = useState<Filter>(o.failed ? "failed" : o.notSent ? "notSent" : "all");
  const [reauthed, setReauthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, busy } = useGoogleSignIn({
    reauthEmail: from || undefined,
    onSuccess: () => {
      setReauthed(true);
      setAuthError(null);
    },
    onError: setAuthError,
  });

  const failedIdx = results.filter((r) => r.status === "failed").map((r) => r.index);
  const notSentIdx = results.filter((r) => r.status === "notSent").map((r) => r.index);
  const rows = results.filter((r) => filter === "all" || r.status === filter);
  const shown = rows.slice(0, RESULTS_ROWS_SHOWN);
  const needAuth = expired || (o.expired && !reauthed);

  const stats: { label: string; value: number; tone: string }[] = [
    { label: "sent", value: o.sent, tone: "text-ink" },
    ...(o.failed ? [{ label: "failed", value: o.failed, tone: "text-neg" }] : []),
    ...(o.notSent ? [{ label: "not sent", value: o.notSent, tone: "text-ink" }] : []),
  ];

  return (
    <section aria-label="Results" className={cn(card, "mb-8 grid gap-6 p-6 max-[720px]:p-4")}>
      <dl className="flex flex-wrap gap-x-12 gap-y-4">
        {stats.map((s) => (
          <div key={s.label} className="grid gap-1">
            <dt className="order-2 text-[15px] text-ink-3">{s.label}</dt>
            <dd className={cn("numeral order-1 text-[clamp(2.8rem,1.7rem+2.6vw,4.4rem)]", s.tone)}>{s.value.toLocaleString("en")}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        {needAuth && !expired && (
          <Button onClick={signIn} disabled={busy} aria-busy={busy || undefined}>
            {busy ? "Opening Google…" : "Sign in again"}
          </Button>
        )}
        {o.failed > 0 && (
          <Button onClick={() => onRetry(failedIdx)} disabled={needAuth}>
            Retry {o.failed.toLocaleString("en")} failed
          </Button>
        )}
        {o.notSent > 0 && (
          <Button variant={o.failed > 0 || needAuth ? "outline" : "default"} onClick={() => onRetry(notSentIdx)} disabled={needAuth}>
            Send the {o.notSent.toLocaleString("en")} not sent
          </Button>
        )}
        <Button variant="outline" onClick={onDownload}>
          Download results (.csv)
        </Button>
        <Button variant="outline" onClick={onNewBatch}>
          Start a new batch
        </Button>
        {authError && (
          <p role="alert" className="w-full text-[14px] text-neg">
            {authError}
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <div className={cn(seg, "justify-self-start")} role="group" aria-label="Show">
          {(
            [
              ["all", "All"],
              ["failed", "Failed"],
              ["notSent", "Not sent"],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" className={segBtn} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-md border border-line">
          <Table className="text-[14px]">
            <TableHeader className="bg-surface-2">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 px-4">Email</TableHead>
                <TableHead className="h-9 px-4">Status</TableHead>
                <TableHead className="h-9 px-4">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="px-4 py-6 text-center text-ink-3">
                    Nothing here.
                  </TableCell>
                </TableRow>
              )}
              {shown.map((r) => (
                <TableRow key={r.index}>
                  <TableCell className="px-4 py-2.5 font-mono text-[13px] text-ink [overflow-wrap:anywhere]">{r.email || "(blank)"}</TableCell>
                  <TableCell className="px-4 py-2.5">
                    <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].label}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-ink-2 [overflow-wrap:anywhere]">{r.status === "sent" ? "" : r.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {rows.length > RESULTS_ROWS_SHOWN && (
          <p className="num text-[14px] text-ink-3">
            Showing {RESULTS_ROWS_SHOWN.toLocaleString("en")} of {rows.length.toLocaleString("en")}.{" "}
            <button type="button" className="font-semibold text-accent-ink underline underline-offset-[3px]" onClick={onDownload}>
              Download the full results.
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
