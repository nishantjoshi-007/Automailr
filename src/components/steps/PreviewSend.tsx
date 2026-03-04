import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Send,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MailPlus,
  X,
  AlertTriangle,
  Square,
} from "lucide-react";
import { replacePlaceholders, hasUnresolvedPlaceholders } from "@/utils/placeholders";
import { sendEmail, prepareAttachments, type SendResult } from "@/utils/gmailSender";
import { useAuth } from "@/contexts/AuthContext";
import { isValidEmail } from "@/utils/csvParser";
import type { CSVData } from "@/utils/csvParser";

/** Find the email value from a CSV row regardless of header casing. */
function getEmail(row: Record<string, string>): string {
  const key = Object.keys(row).find((k) => k.toLowerCase().trim() === "email");
  return key ? row[key] : "";
}

/** Check if a file can be previewed. */
function isPreviewable(file: File): boolean {
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const pdfType = "application/pdf";
  return imageTypes.includes(file.type) || file.type === pdfType;
}

/** Component to preview a file. */
function FilePreviewDialog({
  file,
  open,
  onOpenChange,
}: {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{file?.name}</DialogTitle>
          <DialogDescription>{file?.type}</DialogDescription>
        </DialogHeader>
        {preview && (
          <div className="flex items-center justify-center bg-background/50 rounded-lg p-4 min-h-[500px]">
            {file?.type.startsWith("image/") ? (
              <img src={preview} alt={file.name} className="max-w-full max-h-[600px] object-contain" />
            ) : file?.type === "application/pdf" ? (
              <iframe src={preview} title={file.name} className="w-full h-[600px] rounded" />
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface PreviewSendProps {
  csvData: CSVData;
  subject: string;
  body: string;
  files: File[];
  onSendMore: () => void;
  onSendComplete: () => void;
}

/** Animated SVG checkmark shown on send success. */
function SuccessAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="success-checkmark-wrapper">
        <svg className="success-checkmark" viewBox="0 0 52 52" width="80" height="80">
          <circle
            className="success-checkmark-circle"
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="success-checkmark-check"
            d="M14 27l7.8 7.8L38 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-primary animate-fade-in-up-delay">All emails sent!</p>
    </div>
  );
}

export function PreviewSend({ csvData, subject, body, files, onSendMore, onSendComplete }: PreviewSendProps) {
  const { accessToken, user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // When results arrive, notify parent and delay-reveal the table after the success animation
  useEffect(() => {
    if (results) {
      onSendComplete();
      setShowTable(false);
      const timer = setTimeout(() => setShowTable(true), 2200);
      return () => clearTimeout(timer);
    }
  }, [results]); // eslint-disable-line react-hooks/exhaustive-deps

  const row = csvData.rows[currentIndex];
  const previewSubject = useMemo(() => replacePlaceholders(subject, row), [subject, row]);
  const previewBody = useMemo(() => replacePlaceholders(body, row), [body, row]);
  const recipientEmail = getEmail(row);

  // Warn if there are unresolved placeholders in the template
  const hasUnresolved = useMemo(
    () => hasUnresolvedPlaceholders(previewSubject) || hasUnresolvedPlaceholders(previewBody),
    [previewSubject, previewBody],
  );

  /** Small delay between sends to avoid Gmail API rate-limiting. */
  const SEND_DELAY_MS = 250;

  const sendAllEmails = useCallback(
    async (rows: Record<string, string>[], startIndex = 0) => {
      if (!accessToken || !user) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setSending(true);
      if (startIndex === 0) {
        setResults(null);
        setProgress(0);
      }

      const attachments = await prepareAttachments(files);
      const allResults: SendResult[] = startIndex === 0 ? [] : [...(results || [])].slice(0, startIndex);

      for (let i = startIndex; i < rows.length; i++) {
        // Check if send was cancelled
        if (controller.signal.aborted) {
          // Fill remaining rows as cancelled
          for (let j = i; j < rows.length; j++) {
            allResults.push({ email: getEmail(rows[j]), success: false, error: "Cancelled" });
          }
          break;
        }

        const r = rows[i];
        const to = getEmail(r);

        // Skip rows with invalid/blank email
        if (!isValidEmail(to)) {
          allResults.push({ email: to || "(blank)", success: false, error: "Invalid email address" });
          setProgress(((i + 1) / rows.length) * 100);
          continue;
        }

        const subj = replacePlaceholders(subject, r);
        const html = replacePlaceholders(body, r);

        const result = await sendEmail(accessToken, user.email, to, subj, html, attachments);
        allResults.push(result);
        setProgress(((i + 1) / rows.length) * 100);

        // Rate-limit: wait between sends (skip after the last one)
        if (i < rows.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
        }
      }

      setResults(allResults);
      setSending(false);
      abortRef.current = null;
    },
    [accessToken, user, subject, body, files, results],
  );

  const handleSendAll = useCallback(() => {
    sendAllEmails(csvData.rows, 0);
  }, [sendAllEmails, csvData.rows]);

  const handleRetryFailed = useCallback(() => {
    if (!results) return;
    // Collect the rows that failed
    const failedIndices: number[] = [];
    results.forEach((r, i) => {
      if (!r.success) failedIndices.push(i);
    });

    // Re-send only failed rows and merge results
    (async () => {
      if (!accessToken || !user) return;
      setSending(true);
      setProgress(0);

      const attachments = await prepareAttachments(files);
      const updatedResults = [...results];
      let done = 0;

      for (const idx of failedIndices) {
        const r = csvData.rows[idx];
        const to = getEmail(r);
        const subj = replacePlaceholders(subject, r);
        const html = replacePlaceholders(body, r);

        const result = await sendEmail(accessToken, user.email, to, subj, html, attachments);
        updatedResults[idx] = result;
        done++;
        setProgress((done / failedIndices.length) * 100);

        if (done < failedIndices.length) {
          await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
        }
      }

      setResults(updatedResults);
      setSending(false);
    })();
  }, [results, accessToken, user, csvData, subject, body, files]);

  if (results) {
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    return (
      <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
        <SuccessAnimation />

        <div
          className={`transition-all duration-700 ease-out ${
            showTable ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Sending Complete — {successCount}/{results.length} sent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-80 overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{r.email}</TableCell>
                        <TableCell>
                          {r.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.error || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-center gap-3">
                {failedCount > 0 && (
                  <Button variant="outline" className="gap-2" onClick={handleRetryFailed} disabled={sending}>
                    <RefreshCw className="h-4 w-4" />
                    Retry {failedCount} Failed
                  </Button>
                )}
                <Button className="gap-2" onClick={onSendMore}>
                  <MailPlus className="h-4 w-4" />
                  Send More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      {sending && (
        <Card className="glass">
          <CardContent className="py-6 space-y-3">
            <p className="text-sm text-center text-muted-foreground">Sending emails… {Math.round(progress)}%</p>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-center">
              <Button variant="destructive" size="sm" className="gap-2" onClick={() => abortRef.current?.abort()}>
                <Square className="h-3 w-3" />
                Cancel Sending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!sending && (
        <>
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Preview
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => i - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Recipient {currentIndex + 1} of {csvData.rows.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentIndex === csvData.rows.length - 1}
                    onClick={() => setCurrentIndex((i) => i + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasUnresolved && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Some placeholders could not be resolved. Check that your CSV column names match the placeholders in
                  your template.
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-mono">{recipientEmail}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-sm font-medium">{previewSubject}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Body</p>
                <div
                  className="prose prose-invert max-w-none rounded-lg border border-border bg-background/50 p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: previewBody }}
                />
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => {
                      const canPreview = isPreviewable(f);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (canPreview) {
                              setPreviewFile(f);
                              setPreviewOpen(true);
                            }
                          }}
                          className={
                            canPreview ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"
                          }
                          title={canPreview ? "Click to preview" : "Preview not available"}
                        >
                          <Badge variant="secondary" className="gap-1">
                            <Paperclip className="h-3 w-3" />
                            {f.name}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <FilePreviewDialog file={previewFile} open={previewOpen} onOpenChange={setPreviewOpen} />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Send className="h-4 w-4" />
                  Send All ({csvData.rows.length} emails)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Send</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to send {csvData.rows.length} emails via your Gmail account. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSendAll}>Send All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </>
      )}
    </div>
  );
}
