import { isValidEmail } from "@/utils/csvParser";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { replacePlaceholdersMarked } from "@/utils/placeholders";
import { cell, fieldsUsed, joinAnd, nameLine, rowEmail, rowView, emailKey, sanitizePreview } from "./preview";
import type { CsvState } from "./state";
import { card, cardTitle } from "./ui";

interface PreviewCardProps {
  csv: CsvState;
  from: string;
  subject: string;
  body: string;
  /** Field whose values light up (hover on a chip or token). */
  linkedField?: string | null;
  onLink?: (field: string | null) => void;
  className?: string;
}

const NO_ROW: Record<string, string> = {};
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Subject as React text: same output as replacePlaceholdersPlain, with filled values marked. */
function subjectNodes(subject: string, row: Record<string, string>, headers: string[], linked: string | null): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of subject.matchAll(/\{\{(\w+)\}\}/g)) {
    const at = m.index ?? 0;
    if (at > last) out.push(subject.slice(last, at));
    last = at + m[0].length;
    const key = m[1];
    if (!own(row, key) && !headers.includes(key)) {
      out.push(m[0]);
      continue;
    }
    const value = cell(row, key);
    const cls = cn("fill", linked === key && "is-linked");
    out.push(
      value.trim() === "" ? (
        <span key={at} className={cn(cls, "is-empty")} data-field={key} title={`${key} is empty for this recipient`} />
      ) : (
        <span key={at} className={cls} data-field={key}>
          {value}
        </span>
      ),
    );
  }
  if (last < subject.length) out.push(subject.slice(last));
  return out;
}

const bodyStyles =
  "[&_p+p]:mt-3 [&_p+ul]:mt-3 [&_p+ol]:mt-3 [&_ul+p]:mt-3 [&_ol+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-[1.4em] [&_ol]:list-decimal [&_ol]:pl-[1.4em] [&_blockquote]:my-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-line [&_blockquote]:pl-3.5 [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-[3px] [&_h1]:font-display [&_h2]:font-display [&_h3]:font-display [&_h1,&_h2,&_h3]:font-[750] [&_h1,&_h2,&_h3]:text-ink [&_h2]:text-[1.2rem] [&_h1]:text-[1.35rem] [&_h3]:text-[1.1rem] [&_strong]:text-ink";

export function PreviewCard({ csv, from, subject, body, linkedField = null, onLink, className }: PreviewCardProps) {
  const [rawIndex, setIndex] = useState(0);
  // Only rows that will actually be sent to, so "Recipient 1 of N" matches every other count.
  const rows = useMemo(() => {
    const key = emailKey(csv.headers);
    return csv.rows.filter((r) => isValidEmail(cell(r, key)));
  }, [csv]);
  const count = rows.length;
  const index = Math.min(rawIndex, Math.max(0, count - 1));
  const raw = rows[index] ?? NO_ROW;
  // The CSV's columns only, every value a string, so the fillers never see anything else (L6).
  const row = useMemo(() => rowView(csv.headers, raw), [csv.headers, raw]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const html = useMemo(
    () => sanitizePreview(replacePlaceholdersMarked(body, row, csv.headers)),
    [body, row, csv.headers],
  );

  // Body spans come from sanitized HTML, so the linked highlight is toggled on the DOM.
  useEffect(() => {
    bodyRef.current?.querySelectorAll<HTMLElement>(".fill").forEach((el) => {
      el.classList.toggle("is-linked", el.dataset.field === linkedField);
    });
  }, [linkedField, html]);

  const used = fieldsUsed(subject, body).filter((f) => own(row, f) || csv.headers.includes(f));
  const empty = used.filter((f) => !cell(row, f).trim());
  const who = nameLine(csv.headers, row);

  const hover = (e: React.MouseEvent) => {
    if (!onLink) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>(".fill");
    onLink(el?.dataset.field ?? null);
  };

  const iconBtn =
    "grid size-[34px] place-items-center rounded-[10px] border border-line bg-surface text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:border-line disabled:text-line-strong";

  return (
    <section aria-labelledby="pv-h" className={cn(card, "overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-line py-3.5 pr-4 pl-5 max-[720px]:pl-4">
        <h2 id="pv-h" className={cardTitle}>
          Preview
        </h2>
        <div className="inline-flex items-center gap-2">
          <button type="button" className={iconBtn} aria-label="Previous recipient" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <ChevronLeft aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          </button>
          <span className="num text-[14px] whitespace-nowrap text-ink-2" aria-live="polite">
            Recipient <b className="font-[650] text-ink">{(index + 1).toLocaleString("en")}</b> of {count.toLocaleString("en")}
          </span>
          <button
            type="button"
            className={iconBtn}
            aria-label="Next recipient"
            disabled={index >= count - 1}
            onClick={() => setIndex(index + 1)}
          >
            <ChevronRight aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div onMouseOver={hover} onMouseLeave={() => onLink?.(null)}>
        {who && <p className="px-5 pt-4 text-[15px] font-semibold max-[720px]:px-4">{who}</p>}
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-b border-line px-5 pt-2.5 pb-4 text-[14px] max-[720px]:px-4">
          <dt className="text-ink-3">From</dt>
          <dd className="text-ink-2 [overflow-wrap:anywhere]">{from}</dd>
          <dt className="text-ink-3">To</dt>
          <dd className="text-ink-2 [overflow-wrap:anywhere]">{rowEmail(csv, row) || "(blank)"}</dd>
          <dt className="text-ink-3">Subject</dt>
          <dd className="font-semibold text-ink [overflow-wrap:anywhere]">
            {subject.trim() ? subjectNodes(subject, row, csv.headers, linkedField) : <span className="font-normal text-ink-3">No subject yet</span>}
          </dd>
        </dl>
        {body.replace(/<[^>]*>/g, "").trim() ? (
          <div
            ref={bodyRef}
            className={cn("isolate min-h-[220px] px-5 [contain:paint] pt-[18px] pb-5 text-[15px] leading-[1.68] text-ink-2 [overflow-wrap:anywhere] max-[720px]:px-4", bodyStyles)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="min-h-[220px] px-5 pt-[18px] pb-5 text-[15px] text-ink-3 max-[720px]:px-4">The message shows here as you write it.</p>
        )}
      </div>
      <p
        className={cn(
          "mx-5 mb-5 flex items-start gap-2.5 rounded-md bg-surface-2 px-3.5 py-[11px] text-[14px] max-[720px]:mx-4",
          used.length === 0 ? "text-ink-3" : empty.length ? "text-neg" : "text-pos",
        )}
      >
        {used.length > 0 && empty.length === 0 ? (
          <Check aria-hidden="true" className="mt-px size-[17px] flex-none" strokeWidth={2} />
        ) : (
          <CircleAlert aria-hidden="true" className="mt-px size-[17px] flex-none" strokeWidth={1.8} />
        )}
        <span>
          {used.length === 0
            ? "No fields used yet, so everyone gets the same email."
            : empty.length
              ? `${joinAnd(empty)} ${empty.length > 1 ? "are empty for this recipient, so those spots" : "is empty for this recipient, so that spot"} will be blank.`
              : `${joinAnd(used)} ${used.length > 1 ? "are" : "is"} filled in for this recipient.`}
        </span>
      </p>
    </section>
  );
}
