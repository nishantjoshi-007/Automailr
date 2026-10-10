import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Laptop,
  Lock,
  Send,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A `{{field}}` token as it appears in the editor. */
function Tok({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("tok", className)} translate="no">
      <span className="opacity-55">{"{{"}</span>
      {name}
      <span className="opacity-55">{"}}"}</span>
    </span>
  );
}

const h2Class = "heading text-[clamp(2rem,1.3rem+2vw,3.1rem)] leading-[1.02]";

/** Section heading: h2 left, one sentence right (stacked under 900 px). */
function SectionHead({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <div className="mb-[clamp(32px,4vw,52px)] grid grid-cols-1 items-end gap-x-12 gap-y-4 min-[900px]:grid-cols-2">
      <h2 id={id} className={h2Class}>
        {title}
      </h2>
      <p className="max-w-[34rem] text-[1.08rem] text-ink-2">{children}</p>
    </div>
  );
}

/* ---------- Hero ---------- */

const SAMPLE_ROWS = [
  { email: "alice.johnson@acmecorp.com", name: "Alice", company: "Acme Corp" },
  { email: "ben.okafor@northwindtraders.com", name: "Ben", company: "Northwind Traders" },
  { email: "diego.alvarez@contoso.com", name: "Diego", company: "Contoso" },
];

const cell = "overflow-hidden px-3 py-[9px] text-left text-ellipsis whitespace-nowrap";
const firstCell = "pl-4 max-[480px]:pl-3.5";
const companyCell = "max-[640px]:hidden";
const fill = "rounded-[4px] bg-accent-soft px-[3px] text-ink box-decoration-clone";

/** Static product moment: one CSV row becoming Alice's email. */
function MergeFigure() {
  return (
    <figure
      aria-label="Example: one row of a CSV becomes one personal email"
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-elev"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 text-[13px] text-ink-3 max-[480px]:px-3.5">
        <span className="inline-flex items-center gap-2 font-mono text-[13px] text-ink">
          <FileSpreadsheet aria-hidden="true" className="size-4 text-ink-3" strokeWidth={1.8} />
          contacts.csv
        </span>
        <span className="num">42 rows · 4 columns</span>
      </div>

      <table className="w-full table-fixed border-collapse font-mono text-[11.5px]">
        <thead>
          <tr>
            <th className={cn(cell, firstCell, "w-1/2 bg-surface-2 font-medium text-ink-3 max-[640px]:w-[66%]")}>
              email
            </th>
            <th className={cn(cell, "w-[19%] bg-surface-2 font-medium text-ink-3 max-[640px]:w-[34%]")}>first_name</th>
            <th className={cn(cell, companyCell, "w-[31%] bg-surface-2 font-medium text-ink-3")}>company</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ROWS.map((row, i) => {
            const on = i === 0;
            const td = cn(cell, "border-t border-line", on ? "bg-accent-soft text-ink" : "text-ink-2");
            return (
              <tr key={row.email}>
                <td className={cn(td, firstCell, on && "shadow-[inset_3px_0_0_var(--color-accent-ink)]")}>
                  {row.email}
                </td>
                <td className={td}>{row.name}</td>
                <td className={cn(td, companyCell)}>{row.company}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center gap-2.5 border-y border-line bg-surface-2 px-5 py-3 text-[13px] text-ink-3 max-[480px]:px-3.5">
        <ArrowDown aria-hidden="true" className="size-4 flex-none text-accent-ink" strokeWidth={1.8} />
        <span>
          <b className="num font-semibold text-ink">Recipient 1 of 42</b> · what Alice receives
        </span>
      </div>

      <div className="px-5 pt-[18px] pb-[22px] max-[480px]:px-3.5">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 border-b border-line pb-3.5 text-[13.5px]">
          <dt className="text-ink-3">To</dt>
          <dd className="text-ink [overflow-wrap:anywhere]">alice.johnson@acmecorp.com</dd>
          <dt className="text-ink-3">Subject</dt>
          <dd className="text-ink [overflow-wrap:anywhere]">
            Speaking at the October meetup, <mark className={fill}>Alice</mark>?
          </dd>
        </dl>
        <div className="grid gap-2.5 pt-3.5 text-[14.5px] leading-[1.6] text-ink-2">
          <p>
            Hi <mark className={fill}>Alice</mark>,
          </p>
          <p>
            I run the Riverside Product Meetup, a monthly evening for about 80 designers and engineers. A few people
            mentioned the work <mark className={fill}>Acme Corp</mark> has been doing on onboarding…
          </p>
        </div>
      </div>
    </figure>
  );
}

function Hero({ ctaTo }: { ctaTo: string }) {
  return (
    <section className="pt-[clamp(48px,7vw,104px)] pb-[clamp(56px,7vw,112px)]">
      <div className="container grid grid-cols-1 items-center gap-[clamp(32px,5vw,72px)] min-[900px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <div>
          <h1 className="heading max-w-[15ch] text-[clamp(2.6rem,1.6rem+3vw,4.4rem)] leading-[0.98] tracking-[-0.035em] font-stretch-[106%] min-[900px]:max-w-[13ch]">
            Mail merge for Gmail, run entirely in your browser.
          </h1>
          <p className="mt-6 max-w-[36rem] text-[clamp(1.07rem,1rem+0.3vw,1.25rem)] leading-[1.55] text-ink-2">
            Upload a CSV, write one message with fields like <Tok name="first_name" />, check each person’s copy, then
            send from your own Gmail account. Free and open source.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button asChild size="lg" className="max-[720px]:w-full">
              <Link to={ctaTo} viewTransition>
                Start sending
              </Link>
            </Button>
            <a
              href="https://github.com/nishantjoshi-007/Automailr"
              target="_blank"
              rel="noopener"
              className="font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:decoration-ink"
            >
              Read the source on GitHub
            </a>
          </div>
          <p className="mt-[18px] text-sm text-ink-3">
            You’ll sign in with Google. No account to create, nothing to install.
          </p>
        </div>

        <MergeFigure />
      </div>
    </section>
  );
}

/* ---------- Three steps ---------- */

const fragClass =
  "mt-auto grid gap-1.5 rounded-md border border-line bg-surface px-3.5 py-3 text-[13.5px] max-[900px]:col-start-2";

function PagerChip({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-[26px] place-items-center rounded-[7px] border border-line text-ink-3">
      <Icon className="size-3.5" strokeWidth={1.8} />
    </span>
  );
}

const STEPS: { title: string; body: ReactNode; frag: ReactNode }[] = [
  {
    title: "Recipients",
    body: "Upload a CSV with an email column, plus any columns you want in the message, like first_name or company. Up to 5,000 rows. Invalid addresses are flagged and won’t be sent.",
    frag: (
      <>
        <div className="flex items-center justify-between gap-2.5">
          <span className="font-mono text-[0.9em]">contacts.csv</span>
          <span className="num text-ink-3">42 rows</span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-medium text-pos">
          <Check className="size-[15px]" strokeWidth={2.2} />
          email column found
        </span>
      </>
    ),
  },
  {
    title: "Message",
    body: (
      <>
        Write once, and click a column name to drop in a field like <Tok name="company" />. Attach files if you need to.
        The preview beside the editor shows each person’s copy as you type.
      </>
    ),
    frag: (
      <>
        <span>
          Hi <Tok name="first_name" />,
        </span>
        <span className="text-ink-3">Fields: email, first_name, last_name, company</span>
      </>
    ),
  },
  {
    title: "Review & send",
    body: "Step through every recipient’s email, then send from your Gmail. Messages go out one at a time, 250 ms apart, and any that fail can be retried.",
    frag: (
      <>
        <div className="flex items-center justify-between gap-2.5">
          <span className="num">Recipient 1 of 42</span>
          <span className="inline-flex gap-1">
            <PagerChip icon={ChevronLeft} />
            <PagerChip icon={ChevronRight} />
          </span>
        </div>
        <span className="num text-ink-3">250{" "}ms between sends</span>
      </>
    ),
  },
];

function Steps() {
  return (
    <section id="how" className="pb-[clamp(64px,8vw,112px)]">
      <div className="container">
        <SectionHead title="Three steps">
          Recipients, message, review. You can go back to any step before anything is sent.
        </SectionHead>
        <ol className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col gap-3.5 rounded-xl bg-surface-2 px-7 pt-7 pb-6 max-[900px]:grid max-[900px]:grid-cols-[auto_minmax(0,1fr)] max-[900px]:gap-x-6 max-[720px]:flex"
            >
              <span
                aria-hidden="true"
                className="numeral text-[76px] leading-[0.8] text-ink font-stretch-[118%] max-[900px]:row-span-3 max-[720px]:text-[60px]"
              >
                {i + 1}
              </span>
              <h3 className="mt-2.5 font-display text-[1.45rem] font-[750] tracking-[-0.015em] font-stretch-[104%] max-[900px]:mt-0">
                {step.title}
              </h3>
              <p className="text-[15.5px] text-ink-2">{step.body}</p>
              <div aria-hidden="true" className={fragClass}>
                {step.frag}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Privacy (the one inverted block) ---------- */

const PROMISES: { icon: LucideIcon; title: string; body: ReactNode }[] = [
  {
    icon: Laptop,
    title: "Read on your device",
    body: "Your CSV is parsed in the browser tab. Messages go from your browser straight to the Gmail API.",
  },
  {
    icon: Send,
    title: "Send-only permission",
    body: (
      <>
        Google sign-in asks for{" "}
        <code className="text-invert-ink" translate="no">
          gmail.send
        </code>
        , plus your basic profile (name, email address and picture) to show who is signed in. Automailr can send email
        as you. It can’t read, search or delete anything in your inbox.
      </>
    ),
  },
  {
    icon: Lock,
    title: "Encrypted sign-in token",
    body: "Your Google access token is encrypted in the browser with AES-256-GCM and expires after 55 minutes. Signing out deletes the key.",
  },
];

function Privacy() {
  return (
    <section aria-labelledby="privacy-h" className="pb-[clamp(64px,8vw,112px)]">
      <div className="container">
        <div className="rounded-[28px] bg-invert-bg p-[clamp(32px,5vw,64px)] text-invert-ink max-[720px]:rounded-[22px]">
          <h2 id="privacy-h" className={cn(h2Class, "max-w-[18ch]")}>
            Your list stays between your browser and Google.
          </h2>
          <p className="mt-[18px] max-w-[40rem] text-[1.08rem] text-invert-muted">
            Automailr is a set of static files. There’s no Automailr server or database, so there’s nowhere for a copy
            of your data to end up.
          </p>
          <ul className="mt-[clamp(32px,4vw,52px)] grid grid-cols-1 gap-7 border-t border-invert-line pt-8 min-[720px]:grid-cols-3 min-[720px]:gap-8">
            {PROMISES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-[11px] bg-invert-accent text-invert-on-accent"
                >
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-[18px] text-[1.12rem] font-[650]">{title}</h3>
                <p className="mt-2 text-[15px] text-invert-muted">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-9 max-w-[52rem] border-t border-invert-line pt-6 text-[14.5px] text-invert-muted">
            AI polish is optional. If you use it, your subject and message, with the{" "}
            <Tok name="fields" className="bg-invert-line/60! text-invert-ink! shadow-none!" /> still in place, go to
            Google’s Gemini API. Your recipient list doesn’t.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Limits ---------- */

function Approx() {
  return <span className="mr-[0.04em] font-semibold text-ink-3">~</span>;
}

const LIMITS: { big: ReactNode; label: string }[] = [
  { big: "5,000", label: "rows per CSV. Split bigger lists into batches." },
  {
    big: (
      <>
        25<small className="ml-[0.08em] text-[0.48em] tracking-[-0.01em] font-stretch-[104%]">MB</small>
      </>
    ),
    label: "of attachments per message, in total. That’s Gmail’s cap.",
  },
  {
    big: (
      <>
        <Approx />
        500
      </>
    ),
    label: "emails a day from a personal Gmail account.",
  },
  {
    big: (
      <>
        <Approx />
        2,000
      </>
    ),
    label: "emails a day from a Google Workspace account.",
  },
];

function limitCellClass(i: number) {
  return cn(
    "pt-7 pr-7 pb-2",
    i > 0 && "border-l border-line pl-7",
    i === 2 && "max-[900px]:border-l-0 max-[900px]:pl-0",
    i >= 2 && "max-[900px]:border-t",
    "max-[480px]:border-l-0 max-[480px]:px-0 max-[480px]:pt-[22px] max-[480px]:pb-1.5",
    i > 0 && "max-[480px]:border-t",
  );
}

function Limits() {
  return (
    <section aria-labelledby="limits-h" className="pb-[clamp(64px,8vw,112px)]">
      <div className="container">
        <SectionHead id="limits-h" title="Limits">
          Worth knowing before you upload a big list.
        </SectionHead>
        <ul className="grid grid-cols-1 border-t border-line min-[480px]:grid-cols-2 min-[900px]:grid-cols-4">
          {LIMITS.map((limit, i) => (
            <li key={limit.label} className={limitCellClass(i)}>
              <div className="numeral text-[clamp(2.8rem,1.7rem+2.6vw,4.4rem)] whitespace-nowrap">{limit.big}</div>
              <p className="mt-3 max-w-[18rem] text-[15px] text-ink-2">{limit.label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-7 max-w-[46rem] text-[14.5px] text-ink-3">
          The daily caps are Google’s, not Automailr’s. They count everything you send from that account in a day, and
          Google can change them.
        </p>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

export default function Home() {
  const { accessToken } = useAuth();
  const ctaTo = accessToken ? "/app" : "/login";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero ctaTo={ctaTo} />
        <Steps />
        <Privacy />
        <Limits />
      </main>
      <Footer />
    </div>
  );
}
