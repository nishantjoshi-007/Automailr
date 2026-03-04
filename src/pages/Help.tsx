import { useState, useMemo } from "react";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  ChevronLeft,
  HelpCircle,
  FileSpreadsheet,
  Lock,
  Shield,
  Send,
  Upload,
  Pencil,
  Paperclip,
  Eye,
  Zap,
  AlertTriangle,
  ExternalLink,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { downloadSampleCSV } from "@/utils/csvParser";
import { useNavigate } from "react-router-dom";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

/* ------------------------------------------------------------------ */
/*  Tiny copy-to-clipboard button                                     */
/* ------------------------------------------------------------------ */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive placeholder demo                                      */
/* ------------------------------------------------------------------ */
function PlaceholderDemo() {
  const [name, setName] = useState("Alice");
  const [company, setCompany] = useState("Acme Corp");

  const preview = useMemo(
    () =>
      `Hi ${name},\n\nI came across ${company} and was really impressed by what your team is building. Would you be open to a quick chat this week?\n\nBest regards`,
    [name, company],
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Input side */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your CSV data</p>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">first_name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs font-mono space-y-0.5">
          <p className="text-muted-foreground">{`Hi {{first_name}},`}</p>
          <p className="text-muted-foreground">{`I came across {{company}} and was...`}</p>
        </div>
      </div>

      {/* Output side */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</p>
          <Zap className="h-3 w-3 text-yellow-500" />
        </div>
        <div className="min-h-[140px] p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 text-sm whitespace-pre-wrap leading-relaxed">
          {preview}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workflow steps visual                                              */
/* ------------------------------------------------------------------ */
const WORKFLOW_STEPS = [
  { icon: Upload, label: "Upload CSV", color: "text-blue-500 bg-blue-500/10", desc: "Import your contact list" },
  {
    icon: Pencil,
    label: "Compose",
    color: "text-violet-500 bg-violet-500/10",
    desc: "Write your email & use placeholders",
  },
  {
    icon: Paperclip,
    label: "Attach",
    color: "text-amber-500 bg-amber-500/10",
    desc: "Add optional file attachments",
  },
  {
    icon: Eye,
    label: "Preview",
    color: "text-emerald-500 bg-emerald-500/10",
    desc: "Review each personalized email",
  },
  { icon: Send, label: "Send", color: "text-primary bg-primary/10", desc: "Send all emails via Gmail" },
];

function WorkflowStrip() {
  return (
    <div className="flex items-start justify-between gap-2 overflow-x-auto pb-2">
      {WORKFLOW_STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col items-center text-center min-w-[80px]">
            <div className={`p-2.5 rounded-xl ${step.color} mb-2`}>
              <step.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">{step.label}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{step.desc}</span>
          </div>
          {i < WORKFLOW_STEPS.length - 1 && <div className="hidden sm:block h-px w-8 bg-border/60 mt-5 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main help page                                                    */
/* ------------------------------------------------------------------ */
export default function Help() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const CSV_SAMPLE = `email,first_name,last_name,company
alice@example.com,Alice,Johnson,Acme Corp
bob@example.com,Bob,Smith,Globex Inc
carol@example.com,Carol,Williams,Initech`;

  return (
    <PageTransition className="min-h-screen flex flex-col bg-background relative">
      <AppNav />
      <AuroraBackground className="fixed inset-0 z-0 opacity-20 pointer-events-none" showRadialGradient={false} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-5xl px-4 py-8 space-y-10 flex-1 w-full"
      >
        {/* ─── Header ─── */}
        <motion.div variants={item} className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Help Center</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Everything you need to start sending personalized emails at scale — no backend, no sign-ups, just your
            Gmail.
          </p>
        </motion.div>

        {/* ─── How it works (visual workflow) ─── */}
        <motion.div variants={item}>
          <Card className="glass border-border/60 overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowStrip />
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Tabbed guide sections ─── */}
        <motion.div variants={item}>
          <Tabs defaultValue="csv" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 h-11">
              <TabsTrigger value="csv" className="gap-1.5 text-xs sm:text-sm">
                <FileSpreadsheet className="h-4 w-4 hidden sm:block" /> CSV Format
              </TabsTrigger>
              <TabsTrigger value="placeholders" className="gap-1.5 text-xs sm:text-sm">
                <Pencil className="h-4 w-4 hidden sm:block" /> Placeholders
              </TabsTrigger>
              <TabsTrigger value="sending" className="gap-1.5 text-xs sm:text-sm">
                <Send className="h-4 w-4 hidden sm:block" /> Sending
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: CSV ── */}
            <TabsContent value="csv">
              <Card className="glass border-border/60">
                <CardContent className="pt-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">CSV File Requirements</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your CSV is the contact list. Each row is one recipient, each column is a personalization
                        field. The only <span className="font-semibold text-foreground">required</span> column is{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground text-xs">
                          email
                        </code>
                        .
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Rules grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { ok: true, text: "Must have an email column (case-insensitive)" },
                      { ok: true, text: "Supports any extra columns as placeholders" },
                      { ok: true, text: "Max 1,500 rows per batch" },
                      { ok: false, text: "No duplicate column headers" },
                      { ok: false, text: "No completely empty rows" },
                      { ok: true, text: "UTF-8 encoding recommended" },
                    ].map((rule) => (
                      <div key={rule.text} className="flex items-start gap-2 text-sm">
                        {rule.ok ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        )}
                        <span className="text-muted-foreground">{rule.text}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Code example */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Example
                    </p>
                    <div className="relative p-4 rounded-lg bg-muted/50 border border-border/50 font-mono text-xs leading-relaxed overflow-x-auto">
                      <CopyButton text={CSV_SAMPLE} />
                      {CSV_SAMPLE.split("\n").map((line, i) => (
                        <div key={i} className={i === 0 ? "text-primary font-semibold" : "text-muted-foreground"}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" onClick={downloadSampleCSV} className="gap-2 w-full sm:w-auto">
                    <Download className="h-4 w-4" /> Download Sample CSV
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Placeholders ── */}
            <TabsContent value="placeholders">
              <Card className="glass border-border/60">
                <CardContent className="pt-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0 mt-0.5">
                      <Pencil className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Dynamic Placeholders</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Use{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground text-xs">{`{{column_name}}`}</code>{" "}
                        in your subject or body. Automailr replaces them with data from each CSV row.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Available placeholder badges */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Common placeholders
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["email", "first_name", "last_name", "company"].map((p) => (
                        <Badge key={p} variant="secondary" className="font-mono text-xs gap-1">
                          {`{{${p}}}`}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                        + any column from your CSV
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Live demo */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <p className="text-sm font-semibold text-foreground">
                        Try it — type below to see placeholders in action
                      </p>
                    </div>
                    <PlaceholderDemo />
                  </div>

                  <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-start gap-3 text-sm text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Unresolved placeholders (e.g. <code className="font-mono text-xs">{`{{missing_col}}`}</code>)
                      will appear literally in the sent email. Automailr warns you in the preview step.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Tab: Sending ── */}
            <TabsContent value="sending">
              <Card className="glass border-border/60">
                <CardContent className="pt-6 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                      <Send className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">Sending Emails</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Emails are sent one-by-one through your Gmail account using the official Gmail API. Nothing
                        goes through our servers.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Stats / limits */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: "~500", label: "Daily limit (free Gmail)", color: "text-blue-500" },
                      { value: "~2,000", label: "Daily limit (Workspace)", color: "text-violet-500" },
                      { value: "25 MB", label: "Max attachment size", color: "text-amber-500" },
                      { value: "250ms", label: "Delay between sends", color: "text-emerald-500" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center"
                      >
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>
                        Preview every email before sending — navigate between recipients to verify personalization.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>
                        Cancel mid-batch if needed — unsent emails show as "Cancelled" in the results table.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Retry any failed emails individually without re-sending successful ones.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      <span>Rows with invalid email addresses are automatically skipped and marked as failed.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ─── Security & Privacy panel ─── */}
        {/* <motion.div variants={item}>
          <Card className="glass border-border/60 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-green-500" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: Lock,
                    title: "No Backend",
                    desc: "Everything runs in your browser. Your data never touches our servers.",
                    color: "text-green-500 bg-green-500/10",
                  },
                  {
                    icon: Shield,
                    title: "Session Storage",
                    desc: "Your OAuth token lives in session storage and is cleared when you close the tab.",
                    color: "text-blue-500 bg-blue-500/10",
                  },
                  {
                    icon: Eye,
                    title: "Minimal Permissions",
                    desc: "Only gmail.send scope is requested — we can't read or delete your emails.",
                    color: "text-violet-500 bg-violet-500/10",
                  },
                ].map((card) => (
                  <div key={card.title} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
                    <div className={`inline-flex p-2 rounded-lg ${card.color}`}>
                      <card.icon className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">{card.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                You can revoke access at any time via{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Google Permissions <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </CardContent>
          </Card>
        </motion.div> */}

        {/* ─── Keyboard shortcuts / tips strip ─── */}
        <motion.div variants={item}>
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-foreground">Pro Tip</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use the rich text editor to format your emails with <strong>bold</strong>, <em>italic</em>, bullet
                lists, and more. Your formatting carries through to every recipient's personalized email.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── FAQ — separate section ─── */}
      <div className="relative z-10 border-t border-border/40 bg-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mx-auto max-w-5xl px-4 py-10 space-y-6"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">Quick answers to common questions about Automailr.</p>
          </div>

          <Card className="glass border-border/60">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="q1">
                  <AccordionTrigger className="text-sm text-left">Is Automailr free to use?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Yes! Automailr is completely free and open-source. It runs entirely in your browser — there are no
                    premium tiers, usage fees, or hidden costs. The only limit is Google's own daily sending quota.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger className="text-sm text-left">Can Google see my data?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Automailr calls Google's Gmail API directly from your browser to send emails. Google processes the
                    emails as it would with any sent mail — but Automailr itself has no server that stores or reads
                    your data. Your CSV, template, and attachments stay local.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger className="text-sm text-left">
                    What happens if sending fails mid-batch?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    You'll see a detailed results table showing which emails succeeded and which failed (with error
                    messages). You can use the <strong>Retry Failed</strong> button to re-send only the failed ones
                    without duplicating the successful sends.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4">
                  <AccordionTrigger className="text-sm text-left">
                    Can I cancel a batch after it starts?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Yes. A <strong>Cancel Sending</strong> button appears during sending. Already-sent emails cannot
                    be recalled, but remaining emails will be marked as "Cancelled" in the results.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q5">
                  <AccordionTrigger className="text-sm text-left">
                    Why does it ask for Google permissions?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Automailr requests the{" "}
                    <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">gmail.send</code> scope — the
                    most minimal permission needed to send an email on your behalf. It cannot read your inbox, manage
                    labels, or delete messages. You can revoke this at any time from Google's permissions page.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q6">
                  <AccordionTrigger className="text-sm text-left">What file types can I attach?</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    Any file type is supported, as long as the total attachment size stays under Gmail's 25 MB limit.
                    Images and PDFs can be previewed inline before sending.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="sticky bottom-0 z-20 glass flex items-center px-4 py-3 sm:px-6 mt-auto border-t border-border/40">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1 hover:bg-muted/60">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <Footer />
    </PageTransition>
  );
}
