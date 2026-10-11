import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, useBlocker, useNavigate, useParams } from "react-router";
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
import { useAuth } from "@/contexts/AuthContext";
import type { EmailTemplate } from "@/constants/templates";
import { useAIPolish } from "@/hooks/useAIPolish";
import { BottomBar } from "./BottomBar";
import { LEGACY_SLUGS, STEPS, type Step } from "./constants";
import { Message } from "./Message";
import { messageProblem, plural, totalBytes, validRowCount } from "./preview";
import { Recipients } from "./Recipients";
import { Review, SendConfirm } from "./Review";
import { outcomeOf, outcomeTitle, useSender } from "./sender";
import { ReauthNotice, ResultsView, SendingView } from "./SendRun";
import { makeSessionId, useWizardState, withMessage, type CsvState, type RowResult } from "./state";
import { Stepper } from "./Stepper";
import { tokenTooShort, useNow } from "./timing";
import { stage } from "./ui";

function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-[60vh] flex-1 items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}

const wide = "mx-auto w-full max-w-[1380px] px-[clamp(16px,3vw,40px)]";

const csvCell = (v: string) => {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v; // keep spreadsheets from running it as a formula
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const STATUS_TEXT: Record<RowResult["status"], string> = { sent: "sent", failed: "failed", skipped: "skipped", notSent: "not sent" };

function downloadResults(results: RowResult[], fileName: string) {
  const lines = ["email,status,error", ...results.map((r) => [r.email, STATUS_TEXT[r.status], r.error ?? ""].map(csvCell).join(","))];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `automailr-results-${fileName.replace(/\.csv$/i, "")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** The three-step mail merge at /app/:sessionId/recipients|message|review (D37). */
export function WizardShell() {
  const params = useParams();
  const [sessionId, slug] = (params["*"] ?? "").split("/").filter(Boolean);
  const navigate = useNavigate();
  const { user, accessToken, expiresAt, expired } = useAuth();
  const from = user?.email ?? "";
  const { state, update, reset, foreignCleared } = useWizardState(sessionId, user ? user.email : null);
  const [files, setFiles] = useState<File[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const now = useNow();
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const firstPhase = useRef(true);

  const csv = state?.csv ?? null;
  const subject = state?.subject ?? "";
  const body = state?.body ?? "";

  const onPolishApply = useCallback(
    ({ subject: s, body: b, versions }: { subject: string; body: string; versions: NonNullable<typeof state>["polish"] }) =>
      update((cur) => ({ ...cur, subject: s, body: b, polish: versions })),
    [update],
  );
  const ai = useAIPolish({ subject, body, versions: state?.polish ?? null, onApply: onPolishApply });
  const sender = useSender({ csv, subject, body, files, token: accessToken, expiresAt, from, update });
  const running = sender.running;
  const blocker = useBlocker(running);

  useEffect(() => {
    if (!sessionId) navigate(`/app/${makeSessionId()}/recipients`, { replace: true });
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  const step = (STEPS as readonly string[]).includes(slug ?? "") ? (slug as Step) : null;

  // Each phase (a step, sending, the results) is a new page for assistive tech:
  // move focus to its heading so the change is announced and Tab starts there.
  const phase = running ? "sending" : state?.results ? "results" : step;
  useEffect(() => {
    if (firstPhase.current) {
      firstPhase.current = false;
      return;
    }
    h1Ref.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (!step) return;
    const n = STEPS.indexOf(step) + 1;
    document.title = `${["Recipients", "Message", "Review & send"][n - 1]} · Step ${n} of 3 · Automailr`;
  }, [step]);

  const onMessage = useCallback((patch: { subject?: string; body?: string }) => update((s) => withMessage(s, patch)), [update]);
  const onTemplate = useCallback(
    (t: EmailTemplate) => update((s) => ({ ...s, subject: t.subject, body: t.body, polish: null })),
    [update],
  );
  const onFiles = useCallback(
    (list: File[]) => {
      setFiles(list);
      update({ attachmentNames: list.map((f) => f.name) });
    },
    [update, setFiles],
  );
  const onCsv = useCallback((next: CsvState) => update({ csv: next }), [update]);

  if (!sessionId) return <Loading />;
  if (slug && LEGACY_SLUGS[slug]) return <Navigate replace to={`/app/${sessionId}/${LEGACY_SLUGS[slug]}`} />;
  if (!step) return <Navigate replace to={`/app/${sessionId}/recipients`} />;
  if (!state) return <Loading />;

  const valid = validRowCount(csv);
  const results = state.results;
  const problem = csv ? messageProblem({ subject, body, headers: csv.headers, fileName: csv.fileName, files }) : null;

  // Deep-link guards (D37) and the terminal batch (D42).
  if (results && step !== "review") return <Navigate replace to={`/app/${sessionId}/review`} />;
  if (step !== "recipients" && (!csv || valid === 0)) return <Navigate replace to={`/app/${sessionId}/recipients`} />;
  if (step === "review" && !results && problem) return <Navigate replace to={`/app/${sessionId}/message`} />;

  const go = (to: Step) => {
    navigate(`/app/${sessionId}/${to}`, { viewTransition: true });
    window.scrollTo({ top: 0 });
  };
  const newBatch = () => {
    const id = makeSessionId();
    reset(id);
    setFiles([]);
    navigate(`/app/${id}/recipients`, { viewTransition: true });
  };

  const fileName = csv?.fileName ?? "";
  const skipped = csv ? csv.rows.length - valid : 0;
  const short = tokenTooShort(expiresAt, now, valid, totalBytes(files));
  // Shown in place of each step's own reason while the Google sign-in has expired (M1).
  const expiredReason = expired ? "Sign in again to continue." : null;

  // The heading is visually hidden: the stepper names the step. It still takes focus on each phase change.
  let title: string;
  if (running && sender.progress?.paused) title = "Paused";
  else if (running) title = "Sending…";
  else if (results) title = outcomeTitle(outcomeOf(results)).title;
  else if (step === "recipients") title = "Add your recipients";
  else if (step === "message") title = "Write your message";
  else title = "Check, then send";

  const subs: Record<Step, string> = {
    recipients: csv ? `${valid.toLocaleString("en")} from ${fileName}` : "Upload a CSV",
    message: step === "review" && subject.trim() ? subject : "Write it once",
    review: "Check, then send",
  };

  let bar: ReactNode = null;
  if (running) {
    bar = (
      <BottomBar reason={null}>
        <Button variant="outline" className="px-[18px]" onClick={sender.stop}>
          Stop sending
        </Button>
      </BottomBar>
    );
  } else if (!results) {
    if (step === "recipients") {
      bar = (
        <BottomBar
          reason={
            expiredReason ?? (!csv ? "Upload a CSV to continue." : valid === 0 ? "None of the rows has a valid email address." : null)
          }
          primaryLabel="Next: Message"
          onPrimary={() => go("message")}
        />
      );
    } else if (step === "message") {
      bar = (
        <BottomBar
          onBack={() => go("recipients")}
          backDisabled={ai.busy}
          reason={expiredReason ?? (ai.busy ? "Polishing…" : problem)}
          primaryLabel="Next: Review & send"
          onPrimary={() => go("review")}
        />
      );
    } else {
      bar = (
        <BottomBar
          onBack={() => go("message")}
          reason={expiredReason ?? (short ? "Sign in again before sending." : null)}
          primaryLabel={`Send ${plural(valid, "email", "emails")}`}
          onPrimary={() => setConfirmOpen(true)}
        />
      );
    }
  }

  return (
    <>
      <main id="main" className={`${wide} flex flex-1 flex-col`}>
        <h1 ref={h1Ref} tabIndex={-1} className="sr-only">
          {title}
        </h1>
        <p className="sr-only" role="status">
          {results && !running ? title : ""}
        </p>
        <div className="pt-7 pb-6">
          <div className="mx-auto max-w-[760px]">
            <Stepper sessionId={sessionId} current={step} subs={subs} linksDisabled={results !== null || running || ai.busy} />
          </div>
        </div>

        {foreignCleared && !results && (
          <p role="status" className="mx-auto mb-6 w-full max-w-[720px] rounded-md bg-surface-2 px-3.5 py-[11px] text-[14.5px] text-ink-2">
            This tab had a batch for another Google account. It was cleared.
          </p>
        )}

        {expired && !running && user && (
          <ReauthNotice
            email={user.email}
            message="Your Google sign-in expired. Sign in again to keep going."
            className="mx-auto mb-6 w-full max-w-[720px]"
          />
        )}

        {running && sender.progress ? (
          <div className={stage}>
            <SendingView progress={sender.progress} from={from} />
          </div>
        ) : results ? (
          <ResultsView
            results={results}
            from={from}
            onRetry={(indices) => void sender.start(indices)}
            retrying={running}
            onDownload={() => downloadResults(results, fileName)}
            onNewBatch={newBatch}
          />
        ) : step === "recipients" ? (
          <Recipients csv={csv} onCsv={onCsv} />
        ) : step === "message" && csv ? (
          <Message
            state={state}
            csv={csv}
            from={from}
            files={files}
            onFiles={onFiles}
            onMessage={onMessage}
            onTemplate={onTemplate}
            ai={ai}
          />
        ) : csv ? (
          <div className={stage}>
            <Review state={state} csv={csv} from={from} files={files} validRows={valid} expiresAt={expiresAt} now={now} />
          </div>
        ) : null}
      </main>

      {bar}

      {csv && (
        <SendConfirm
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          from={from}
          validRows={valid}
          skipped={skipped}
          onConfirm={() => void sender.start(csv.rows.map((_, i) => i))}
        />
      )}

      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sending is in progress. Leave and stop sending?</AlertDialogTitle>
            <AlertDialogDescription>The emails already sent stay sent. The rest are marked as not sent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Keep sending</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                sender.stop();
                blocker.proceed?.();
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
