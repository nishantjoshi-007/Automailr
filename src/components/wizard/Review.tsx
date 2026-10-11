import { useState, type ReactNode } from "react";
import { Clock } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { SEND_DELAY_MS, THIN } from "./constants";
import { batchEstimateMs, tokenTooShort } from "./timing";
import { fieldsUsed, formatBytes, formatDuration, plural, totalBytes } from "./preview";
import type { CsvState, WizardState } from "./state";
import { card, cardTitle } from "./ui";

/** The subject template with each {{field}} shown as a token chip. */
function subjectTokens(subject: string): ReactNode[] {
  return subject.split(/(\{\{\w+\}\})/g).map((part, i) =>
    /^\{\{\w+\}\}$/.test(part) ? (
      <span key={i} className="tok" translate="no">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

interface ReviewProps {
  state: WizardState;
  csv: CsvState;
  from: string;
  files: File[];
  validRows: number;
  expiresAt: number | null;
  now: number;
}

export function Review({ state, csv, from, files, validRows, expiresAt, now }: ReviewProps) {
  const skipped = csv.rows.length - validRows;
  const used = fieldsUsed(state.subject, state.body);
  const attachmentBytes = totalBytes(files);
  const estimate = batchEstimateMs(validRows, attachmentBytes);
  const short = tokenTooShort(expiresAt, now, validRows, attachmentBytes);
  // An expired session gets the wizard's banner instead of this notice.
  const { expired } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn, busy } = useGoogleSignIn({
    reauthEmail: from || undefined,
    onSuccess: () => setAuthError(null),
    onError: setAuthError,
  });
  const lostNames = files.length === 0 ? state.attachmentNames : [];

  const row = (term: string, value: ReactNode) => (
    <>
      <dt className="text-ink-3">{term}</dt>
      <dd className="min-w-0 text-ink-2 [overflow-wrap:anywhere]">{value}</dd>
    </>
  );

  return (
    <section aria-labelledby="sum-h" className={cn(card, "mx-auto max-w-[720px] overflow-hidden")}>
      <div className="flex min-h-[63px] items-center border-b border-line py-3.5 pr-4 pl-5 max-[720px]:pl-4">
        <h2 id="sum-h" className={cardTitle}>
          Summary
        </h2>
      </div>
      <div className="grid gap-5 px-6 pt-[22px] pb-6 max-[720px]:p-4">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3.5 text-[15px] max-[460px]:grid-cols-1 max-[460px]:gap-y-0.5 max-[460px]:[&>dd]:mb-2.5 max-[460px]:[&>dd:last-child]:mb-0">
          {row("From", from)}
          {row(
            "Recipients",
            <>
              <span className="num">
                {validRows.toLocaleString("en")} from {csv.fileName}
              </span>
              {skipped > 0 && (
                <span className="num block text-ink-3">{skipped.toLocaleString("en")} skipped (invalid email)</span>
              )}
            </>,
          )}
          {row("Subject", <span className="font-semibold text-ink">{subjectTokens(state.subject)}</span>)}
          {row(
            "Attachments",
            files.length ? (
              <ul className="grid gap-0.5">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    {f.name} · <span className="num">{formatBytes(f.size)}</span>
                  </li>
                ))}
              </ul>
            ) : lostNames.length ? (
              <span className="text-neg">
                {lostNames.join(", ")} didn't survive the reload.{" "}
                <Link to={`/app/${state.sessionId}/message`} viewTransition className="font-semibold underline underline-offset-[3px]">
                  Add them again
                </Link>{" "}
                or send without them.
              </span>
            ) : (
              "None"
            ),
          )}
          {row("Fields used", used.length ? used.join(", ") : "None, everyone gets the same email")}
          {row(
            "Pace",
            <span className="num">
              One email every {SEND_DELAY_MS}
              {THIN}ms, about {formatDuration(estimate)}
            </span>,
          )}
        </dl>

        {short && !expired && (
          <div className="grid gap-3 rounded-md bg-surface-2 p-4 text-[15px] text-ink-2">
            <p className="flex items-start gap-2.5">
              <Clock aria-hidden="true" className="mt-0.5 size-[18px] flex-none text-ink-3" strokeWidth={1.8} />
              <span>
                {expiresAt !== null && expiresAt > now
                  ? `Your Google sign-in expires in ${formatDuration(expiresAt - now)} and this batch takes about ${formatDuration(estimate)}. Sign in again first.`
                  : "Your Google sign-in has expired. Sign in again first."}
              </span>
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
        )}
      </div>
    </section>
  );
}

interface SendConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  validRows: number;
  skipped: number;
  onConfirm: () => void;
}

export function SendConfirm({ open, onOpenChange, from, validRows, skipped, onConfirm }: SendConfirmProps) {
  const label = `Send ${plural(validRows, "email", "emails")}`;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        onCloseAutoFocus={(e) => {
          // opened from the bottom bar, not a Radix trigger: hand focus back to it
          const bar = document.getElementById("bar-primary");
          if (bar) {
            e.preventDefault();
            bar.focus();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">
            {label} from {from}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[15px]">
            They&rsquo;ll go out one by one from your Gmail account. Once sent, an email can&rsquo;t be taken back.
            {skipped > 0 &&
              ` ${plural(skipped, "row", "rows")} with an invalid email ${skipped === 1 ? "is" : "are"} skipped.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
