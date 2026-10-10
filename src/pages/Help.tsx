import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { AlertCircle, Check, Copy, Download } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { Prose, ProseSection } from "@/components/Prose";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SAMPLE_CSV, downloadSampleCSV } from "@/utils/csvParser";

const SECTIONS = {
  "three-steps": "Three steps",
  "your-csv": "Your CSV",
  fields: "Fields",
  attachments: "Attachments",
  sending: "Sending",
  "ai-polish": "AI polish",
  permissions: "Permissions and privacy",
  questions: "Questions",
} as const;

const TOC = Object.entries(SECTIONS).map(([id, title]) => ({ id, title }));

/** A {{field}} token, as it appears in the editor. */
function Tok({ children }: { children: string }) {
  return (
    <span className="tok" translate="no">
      {`{{${children}}}`}
    </span>
  );
}

const external = { target: "_blank", rel: "noopener" } as const;

/* ------------------------------------------------------------------ */

const STEPS: { name: string; body: ReactNode }[] = [
  {
    name: "Recipients",
    body: (
      <>
        Upload a CSV with an <code>email</code> column, plus any columns you want in the message, like first_name or
        company. Up to <span className="num">5,000</span> rows. Rows with an invalid or blank email are skipped and listed
        in the results.
      </>
    ),
  },
  {
    name: "Message",
    body: (
      <>
        Write once, and click a column name to drop in a field like <Tok>company</Tok>. Attach files if you need to. The
        preview shows each person&rsquo;s copy as you type.
      </>
    ),
  },
  {
    name: "Review & send",
    body: (
      <>
        Step through every recipient&rsquo;s email, then send from your Gmail. Messages go out one at a time,{" "}
        <span className="num whitespace-nowrap">250&#8239;ms</span> apart, and any that fail can be retried.
      </>
    ),
  },
];

function Steps() {
  return (
    <ol className="mt-6 grid list-none gap-6 pl-0">
      {STEPS.map((step, i) => (
        <li key={step.name} className="mt-0 grid grid-cols-[2.6rem_minmax(0,1fr)] gap-x-4">
          <span aria-hidden="true" className="numeral pt-0.5 text-[2.4rem] text-ink font-stretch-[118%]">
            {i + 1}
          </span>
          <div>
            <h3>{step.name}</h3>
            <p className="mt-1.5">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */

function SampleCsv() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_CSV);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <figure className="overflow-hidden rounded-md border border-line bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-line py-1.5 pr-1.5 pl-4">
        <span className="font-mono text-[13px] text-ink-2">sample-contacts.csv</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Copy sample CSV"
          onClick={copy}
          className="h-9 gap-1.5 px-3 text-[14px] font-medium"
        >
          {copied ? (
            <Check aria-hidden="true" className="text-pos" strokeWidth={2.2} />
          ) : (
            <Copy aria-hidden="true" strokeWidth={1.8} />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
        <span role="status" className="sr-only">
          {copied ? "Sample CSV copied" : ""}
        </span>
      </figcaption>
      <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-ink">
        <code className="bg-transparent p-0">{SAMPLE_CSV}</code>
      </pre>
    </figure>
  );
}

/* ------------------------------------------------------------------ */

function FieldsDemo() {
  const [firstName, setFirstName] = useState("Alice");
  const [company, setCompany] = useState("Acme Corp");
  const id = useId();

  const empty = [!firstName.trim() && "first_name", !company.trim() && "company"].filter(Boolean) as string[];

  const fill = (value: string) =>
    value.trim() ? (
      <mark className="rounded-[4px] bg-accent-soft px-[0.2em] text-ink">{value}</mark>
    ) : (
      <span className="inline-block w-[4.5em] border-b border-dashed border-neg align-baseline">
        <span className="sr-only">blank</span>
      </span>
    );

  return (
    <div
      role="group"
      aria-labelledby={`${id}-cap`}
      className="rounded-lg border border-line bg-surface p-5 max-sm:p-4"
    >
      <p id={`${id}-cap`} className="text-[13.5px] text-ink-3">
        Try it: change a value and watch the preview.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-first`} className="font-mono text-[13px] text-ink-2">
            first_name
          </label>
          <Input
            id={`${id}-first`}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-company`} className="font-mono text-[13px] text-ink-2">
            company
          </label>
          <Input
            id={`${id}-company`}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <dl className="mt-5 grid gap-3 border-t border-line pt-4 text-[15px]">
        <div>
          <dt className="font-medium text-[13px] text-ink-3">Message</dt>
          <dd className="mt-1 text-ink-2">
            Hi <Tok>first_name</Tok>, I&rsquo;d like to invite <Tok>company</Tok> to the October meetup.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[13px] text-ink-3">Preview</dt>
          <dd className="mt-1 text-ink" aria-live="polite">
            Hi {fill(firstName)}, I&rsquo;d like to invite {fill(company)} to the October meetup.
          </dd>
        </div>
      </dl>

      <p aria-live="polite" className="mt-3 flex items-start gap-2 text-[14px]">
        {empty.length === 0 ? (
          <>
            <Check aria-hidden="true" className="mt-[3px] size-4 flex-none text-pos" strokeWidth={2.2} />
            <span className="text-ink-2">Every field is filled.</span>
          </>
        ) : (
          <>
            <AlertCircle aria-hidden="true" className="mt-[3px] size-4 flex-none text-neg" strokeWidth={2.2} />
            <span className="text-neg">
              {empty.join(" and ")} {empty.length > 1 ? "are" : "is"} empty, so this person sees a blank.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Limits() {
  return (
    <ul className="mt-6 grid list-none border-t border-line pl-0 sm:grid-cols-2">
      <li className="mt-0 py-5 sm:pr-6">
        <div className="numeral text-[clamp(2.4rem,1.8rem+1.6vw,3.2rem)] whitespace-nowrap text-ink">
          <span className="mr-[0.04em] font-semibold text-ink-3">~</span>500
        </div>
        <p className="mt-2 text-[15px]">emails a day from a personal Gmail account.</p>
      </li>
      <li className="mt-0 border-line py-5 max-sm:border-t sm:border-l sm:pl-6">
        <div className="numeral text-[clamp(2.4rem,1.8rem+1.6vw,3.2rem)] whitespace-nowrap text-ink">
          <span className="mr-[0.04em] font-semibold text-ink-3">~</span>2,000
        </div>
        <p className="mt-2 text-[15px]">emails a day from a Google Workspace account.</p>
      </li>
    </ul>
  );
}

/* ------------------------------------------------------------------ */

const QUESTIONS: { q: string; a: ReactNode }[] = [
  {
    q: "Is it free?",
    a: (
      <>
        Yes. Automailr is free and open source under the MIT Non-Commercial License, which allows personal,
        educational, research and other non-commercial use. Emails go out through your own Gmail account, so
        Google&rsquo;s daily sending limits apply.
      </>
    ),
  },
  {
    q: "Can Google see my list?",
    a: (
      <>
        Your CSV file is read in your browser and isn&rsquo;t uploaded anywhere. Each email you send goes through your
        Gmail account, so Google handles those messages, recipient address included, as it does any email you send.
        AI polish never sends the list to Gemini.
      </>
    ),
  },
  {
    q: "What happens if sending fails part-way?",
    a: (
      <>
        Emails that went out stay sent, and each one that failed is marked in the results. You can retry the failed
        ones and download the results as a CSV. If your sign-in runs out mid-batch, sending pauses until you sign in
        again.
      </>
    ),
  },
  {
    q: "Can I stop a batch?",
    a: (
      <>
        Yes, at any time. Emails already sent stay sent, and the rest are marked as not sent. You can send those
        afterwards.
      </>
    ),
  },
  {
    q: "Why does it sign me out after 55 minutes?",
    a: (
      <>
        Signing in with Google gives Automailr an access token, not your password, and that token lasts{" "}
        <span className="num whitespace-nowrap">55&#8239;minutes</span>. Keeping it short-lived limits what anyone
        could do with it. When it runs out, sign in again; a batch in progress pauses and carries on after you do.
      </>
    ),
  },
  {
    q: "What file types can I attach?",
    a: (
      <>
        Any type, up to <span className="num whitespace-nowrap">25&#8239;MB</span> in total per message. Every
        recipient gets the same files.
      </>
    ),
  },
  {
    q: "Does Automailr keep my list?",
    a: (
      <>
        No. There&rsquo;s no Automailr server or database. While you work, your rows are kept encrypted in this
        tab&rsquo;s sessionStorage, and they&rsquo;re removed when you sign out or start a new batch.
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */

export default function Help() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <main id="main">
        <Prose
          title="Help"
          intro="How Automailr works, what your CSV needs, and what happens when you send."
          toc={TOC}
        >
          <ProseSection id="three-steps" title={SECTIONS["three-steps"]}>
            <p>Recipients, message, review. You can go back to any step before anything is sent.</p>
            <Steps />
          </ProseSection>

          <ProseSection id="your-csv" title={SECTIONS["your-csv"]}>
            <p>A plain CSV file whose first row names the columns.</p>
            <ul>
              <li>
                One column must be called <code>email</code>. Any capitalisation works, so <code>Email</code> is fine
                too.
              </li>
              <li>
                Up to <span className="num">5,000</span> rows. Split bigger lists into batches.
              </li>
              <li>
                Every other column becomes a field you can use in the message, like <Tok>first_name</Tok>. Use letters,
                numbers and underscores in column names.
              </li>
              <li>Rows with an invalid or blank email are skipped and listed in the results.</li>
            </ul>
            <SampleCsv />
            <div>
              <Button type="button" variant="outline" onClick={downloadSampleCSV}>
                <Download aria-hidden="true" strokeWidth={1.8} />
                Download a sample CSV
              </Button>
            </div>
          </ProseSection>

          <ProseSection id="fields" title={SECTIONS.fields}>
            <p>
              A field is a column name in double curly braces. Put <Tok>first_name</Tok> in the subject or message and
              each recipient sees their own first_name from the CSV in its place.
            </p>
            <FieldsDemo />
            <p>
              A field that isn&rsquo;t a column in your CSV stops you at the Message step, so a typo can&rsquo;t go out.
              An empty cell leaves a blank in that person&rsquo;s copy, and the preview points it out before you send.
            </p>
          </ProseSection>

          <ProseSection id="attachments" title={SECTIONS.attachments}>
            <p>
              Attach any type of file, up to <span className="num whitespace-nowrap">25&#8239;MB</span> in total per
              message. Every recipient gets the same files. Attachments are held in memory only, so they aren&rsquo;t
              kept across a reload: add them again if the page reloads.
            </p>
          </ProseSection>

          <ProseSection id="sending" title={SECTIONS.sending}>
            <p>
              Emails go out one at a time, <span className="num whitespace-nowrap">250&#8239;ms</span> apart, straight
              from your browser to the Gmail API.
            </p>
            <ul>
              <li>You can stop at any time. The ones not sent yet can be sent afterwards.</li>
              <li>Any that fail can be retried.</li>
              <li>Rows with an invalid or blank email are skipped and listed in the results.</li>
              <li>The results can be downloaded as a CSV.</li>
            </ul>
            <p>
              Your Google sign-in lasts <span className="num whitespace-nowrap">55&#8239;minutes</span>, and a long
              batch can outlast it. If the time left looks too short for the batch, Automailr asks you to sign in again
              before it starts. If the sign-in runs out mid-batch, sending pauses, and you can sign in again and
              continue.
            </p>
            <Limits />
            <p className="text-[14.5px] text-ink-3">
              The daily caps are Google&rsquo;s, not Automailr&rsquo;s. They count everything you send from that account
              in a day, and Google can change them.
            </p>
          </ProseSection>

          <ProseSection id="ai-polish" title={SECTIONS["ai-polish"]}>
            <p>
              AI polish is optional. If you press Polish with AI, your subject and message, with the <Tok>fields</Tok>{" "}
              still in place, go to Google&rsquo;s Gemini API, and the rewritten version comes back for you to check.
              Your original is kept. Your recipient list is never sent.
            </p>
          </ProseSection>

          <ProseSection id="permissions" title={SECTIONS.permissions}>
            <p>
              Automailr asks Google for <code>gmail.send</code>, which lets it send email as you. It also gets your basic
              Google profile (name, email address and picture) so it can show who is signed in. It can&rsquo;t read,
              search or delete anything in your mailbox. The app is verified by Google, so there&rsquo;s no
              &ldquo;unverified app&rdquo; screen when you sign in.
            </p>
            <p>
              Signing out destroys the encrypted token and its key in this browser. It doesn&rsquo;t revoke the grant
              at Google: the token simply expires within the hour. You can revoke access at any time at{" "}
              <a href="https://myaccount.google.com/permissions" {...external}>
                myaccount.google.com/permissions
              </a>
              . The <Link to="/privacy">Privacy</Link> page has the details of what stays in your browser and what
              leaves it.
            </p>
          </ProseSection>

          <ProseSection id="questions" title={SECTIONS.questions}>
            <Accordion type="multiple" className="border-t border-line">
              {QUESTIONS.map((item, i) => (
                <AccordionItem key={item.q} value={`q${i}`}>
                  <AccordionTrigger className="gap-4 py-4 text-left text-[16px] font-semibold">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pr-8 text-[15.5px] leading-[1.65] text-ink-2">
                    <p>{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ProseSection>
        </Prose>
      </main>
      <Footer />
    </div>
  );
}
