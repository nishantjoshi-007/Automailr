import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { Stepper } from "@/components/Stepper";
import { CSVUpload } from "@/components/steps/CSVUpload";
import { Compose } from "@/components/steps/Compose";
import { Attachments } from "@/components/steps/Attachments";
import { PreviewSend } from "@/components/steps/PreviewSend";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, AlertTriangle, XCircle } from "lucide-react";
import type { CSVData } from "@/utils/csvParser";
import { PageTransition } from "@/components/PageTransition";
import { AuroraBackground } from "@/components/ui/aurora-background";

// ── Session persistence helpers ──────────────────────────────────────

const STORAGE_KEY = "automailr_wizard";

interface PersistedState {
  sessionId: string;
  step: number;
  csvData: CSVData | null;
  subject: string;
  body: string;
}

function saveWizardState(state: PersistedState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function loadWizardState(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Basic shape validation
    if (
      typeof parsed.sessionId !== "string" ||
      typeof parsed.step !== "number" ||
      typeof parsed.subject !== "string" ||
      typeof parsed.body !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearWizardState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Wrapper that plays a fade+slide animation when `stepKey` changes. */
function StepTransition({ stepKey, children }: { stepKey: number; children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [rendered, setRendered] = useState(children);
  const prevKey = useRef(stepKey);

  useEffect(() => {
    if (stepKey !== prevKey.current) {
      // Start exit animation
      setVisible(false);
      const timer = setTimeout(() => {
        setRendered(children);
        prevKey.current = stepKey;
        // Trigger enter animation on next frame
        requestAnimationFrame(() => setVisible(true));
      }, 200); // matches CSS exit duration
      return () => clearTimeout(timer);
    } else {
      setRendered(children);
    }
  }, [stepKey, children]);

  return (
    <div className={visible ? "step-enter" : "step-exit"} style={{ minHeight: 0 }}>
      {rendered}
    </div>
  );
}

const STEP_SLUGS = ["upload", "compose", "attachments", "preview"] as const;
type StepSlug = (typeof STEP_SLUGS)[number];

function slugToStep(slug: string | undefined): number {
  const idx = STEP_SLUGS.indexOf(slug as StepSlug);
  return idx >= 0 ? idx : 0;
}

/** Generate a unique session ID */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse session ID and step from the URL: /app/:sessionId/:step
  const pathParts = location.pathname
    .replace(/^\/app\/?/, "")
    .split("/")
    .filter(Boolean);
  const urlSessionId = pathParts[0] || "";
  const urlStepSlug = pathParts[1] || "";

  // Try to restore persisted state on mount.
  // Only restore if the URL contains a session ID that matches the persisted one,
  // OR if the URL has a full session path (e.g. page reload).
  // Bare /app (e.g. from "Get Started" or login) always starts fresh.
  const persisted = useRef(() => {
    const saved = loadWizardState();
    if (!saved) return null;
    // If URL has a session ID, only restore if it matches
    if (urlSessionId) return urlSessionId === saved.sessionId ? saved : null;
    // Bare /app → fresh session, clear old persisted data
    clearWizardState();
    return null;
  });
  const persistedState = useRef(persisted.current());

  const [sessionId, setSessionId] = useState(() => {
    if (urlSessionId) return urlSessionId;
    if (persistedState.current) return persistedState.current.sessionId;
    return generateSessionId();
  });
  const [step, setStepRaw] = useState(() => {
    if (urlStepSlug) return slugToStep(urlStepSlug);
    if (persistedState.current) return persistedState.current.step;
    return 0;
  });
  const [csvData, setCsvData] = useState<CSVData | null>(() => persistedState.current?.csvData ?? null);
  const [subject, setSubject] = useState(() => persistedState.current?.subject ?? "");
  const [body, setBody] = useState(() => persistedState.current?.body ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [sendComplete, setSendComplete] = useState(false);
  const [isAIPolishing, setIsAIPolishing] = useState(false);

  // Placeholder validation dialog state
  const [placeholderDialog, setPlaceholderDialog] = useState<{
    type: "warning" | "error";
    title: string;
    description: string;
    invalidTags?: string[];
  } | null>(null);

  // Persist wizard state whenever it changes
  useEffect(() => {
    saveWizardState({ sessionId, step, csvData, subject, body });
  }, [sessionId, step, csvData, subject, body]);

  /** Navigate to the correct URL whenever step or session changes. */
  const setStep = useCallback((update: number | ((prev: number) => number)) => {
    setStepRaw((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      return next;
    });
  }, []);

  // ── History / URL sync ─────────────────────────────────────────────
  // stepFromUrl:  true when the step change was triggered by a URL change
  //               (browser back/forward). Prevents the URL-sync effect from
  //               navigating again.
  // prevStepRef:  previous step value, used to detect forward vs backward.
  const stepFromUrl = useRef(false);
  const prevStepRef = useRef(step);

  // Effect 1 — push/replace the URL when WE change the step (Next / Back / stepper)
  useEffect(() => {
    // If the step change came from a URL change (browser back/forward),
    // the URL is already correct — just update the ref and bail.
    if (stepFromUrl.current) {
      stepFromUrl.current = false;
      prevStepRef.current = step;
      return;
    }

    const target = `/app/${sessionId}/${STEP_SLUGS[step]}`;
    const isForward = step > prevStepRef.current;
    prevStepRef.current = step;

    if (isForward) {
      navigate(target); // push → creates a browser‑back entry
    } else {
      navigate(target, { replace: true }); // backward / initial → no extra entry
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId]);

  // Effect 2 — when the URL changes externally (browser back / forward), sync step state
  useEffect(() => {
    if (urlSessionId && urlStepSlug) {
      const parsed = slugToStep(urlStepSlug);
      if (parsed !== step) {
        stepFromUrl.current = true;
        setStepRaw(parsed);
      }
      if (urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleCSVParsed = useCallback((data: CSVData) => {
    setCsvData(data);
  }, []);

  /** Reset everything and start a new session. */
  const handleSendMore = useCallback(() => {
    clearWizardState();
    setSessionId(generateSessionId());
    setCsvData(null);
    setSubject("");
    setBody("");
    setFiles([]);
    setSendComplete(false);
    setStepRaw(0);
  }, []);

  /** Called by PreviewSend when sending finishes. */
  const handleSendComplete = useCallback(() => {
    setSendComplete(true);
  }, []);

  const canNext = useCallback(() => {
    if (step === 0) return !!csvData;
    if (step === 1) {
      const strippedBody = body.replace(/<[^>]*>/g, "").trim();
      return subject.trim().length > 0 && strippedBody.length > 0;
    }
    return true;
  }, [step, csvData, subject, body]);

  /**
   * Validate placeholders in subject + body when leaving the Compose step.
   * Returns true if navigation should proceed immediately.
   * Returns false if a dialog was shown (navigation is deferred).
   */
  const validatePlaceholders = useCallback((): boolean => {
    if (!csvData) return true;
    const headers = csvData.headers;
    const combinedText = `${subject} ${body}`;

    // Find all {{...}} tags in the content
    const allTags = Array.from(combinedText.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]);
    const uniqueTags = [...new Set(allTags)];

    // Check for invalid tags (ones that don't match any CSV header)
    const invalidTags = uniqueTags.filter((tag) => !headers.includes(tag));
    if (invalidTags.length > 0) {
      setPlaceholderDialog({
        type: "error",
        title: "Invalid Placeholders Found",
        description: `Your email contains placeholder(s) that don't match any column in your CSV. Fix or remove them before continuing.`,
        invalidTags,
      });
      return false;
    }

    // Check if no placeholders are used at all
    const validTags = uniqueTags.filter((tag) => headers.includes(tag));
    if (validTags.length === 0) {
      setPlaceholderDialog({
        type: "warning",
        title: "No Placeholders Used",
        description:
          "Your email doesn't use any placeholders (e.g. {{first_name}}). Every recipient will receive the exact same email. Are you sure you want to continue?",
      });
      return false;
    }

    return true;
  }, [csvData, subject, body]);

  /** Handle Next button click with placeholder validation on step 1 */
  const handleNext = useCallback(() => {
    if (step === 1) {
      const canProceed = validatePlaceholders();
      if (!canProceed) return;
    }
    setStep((s) => s + 1);
  }, [step, validatePlaceholders, setStep]);

  /** Handle stepper click — validate when leaving Compose step forward */
  const pendingStepRef = useRef<number | null>(null);
  const handleStepClick = useCallback(
    (targetStep: number) => {
      // If currently on Compose and navigating forward, validate first
      if (step === 1 && targetStep > 1) {
        pendingStepRef.current = targetStep;
        const canProceed = validatePlaceholders();
        if (!canProceed) return; // Dialog will handle navigation
        pendingStepRef.current = null;
      }
      setStep(targetStep);
    },
    [step, validatePlaceholders, setStep],
  );

  const stepContent = (() => {
    switch (step) {
      case 0:
        return <CSVUpload csvData={csvData} onCSVParsed={handleCSVParsed} />;
      case 1:
        return csvData ? (
          <Compose
            headers={csvData.headers}
            subject={subject}
            body={body}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
            onPolishingChange={setIsAIPolishing}
          />
        ) : null;
      case 2:
        return <Attachments files={files} onFilesChange={setFiles} />;
      case 3:
        return csvData ? (
          <PreviewSend
            csvData={csvData}
            subject={subject}
            body={body}
            files={files}
            onSendMore={handleSendMore}
            onSendComplete={handleSendComplete}
          />
        ) : null;
      default:
        return null;
    }
  })();

  return (
    <PageTransition className="min-h-screen flex flex-col relative bg-background">
      {/* Subtle background for dashboard to not distract */}
      <AuroraBackground className="fixed inset-0 z-0 opacity-10 pointer-events-none" showRadialGradient={false} />

      <div className="relative z-10 flex flex-col flex-1 h-full">
        <AppNav />
        <Stepper currentStep={step} onStepClick={handleStepClick} completed={sendComplete} disabled={isAIPolishing} />

        <main className="flex-1 px-4 pb-8 overflow-hidden max-w-6xl mx-auto w-full">
          <StepTransition stepKey={step}>{stepContent}</StepTransition>
        </main>

        {!sendComplete && (
          <div className="sticky bottom-0 glass flex items-center justify-between px-4 py-3 sm:px-6 border-t border-border/40 mt-auto">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0 || isAIPolishing}
              className="gap-1 hover:bg-muted/60"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < 3 && (
              <Button
                onClick={handleNext}
                disabled={!canNext() || isAIPolishing}
                className="gap-1 shadow-md shadow-primary/20"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        <Footer />
      </div>

      {/* Placeholder validation dialog */}
      <AlertDialog open={!!placeholderDialog} onOpenChange={(open) => !open && setPlaceholderDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {placeholderDialog?.type === "error" ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              {placeholderDialog?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{placeholderDialog?.description}</AlertDialogDescription>
            {placeholderDialog?.invalidTags && (
              <div className="mt-3 flex flex-wrap gap-2">
                {placeholderDialog.invalidTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md border border-destructive/50 bg-destructive/10 px-2.5 py-1 font-mono text-sm font-medium text-destructive"
                  >
                    {`{{${tag}}}`}
                  </span>
                ))}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {placeholderDialog?.type === "error" ? (
              <AlertDialogCancel>Go Back & Fix</AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setPlaceholderDialog(null);
                    // Navigate to the pending step (from stepper click) or just next step
                    const target = pendingStepRef.current;
                    pendingStepRef.current = null;
                    setStep(target != null ? target : (s) => s + 1);
                  }}
                >
                  Continue Anyway
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
}
