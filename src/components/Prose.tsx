import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ProseTocItem {
  id: string;
  title: string;
}

/*
  Element styles are attached through `:where(.prose) <el>` selectors, so they
  carry the specificity of a bare element: any utility class on an element
  inside the article still wins over them.
*/
const proseClass = cn(
  "text-[16px] leading-[1.65] text-ink-2",
  // Headings
  "[:where(&)_h2]:scroll-mt-24 [:where(&)_h2]:font-display [:where(&)_h2]:text-[1.5rem] [:where(&)_h2]:font-[750] [:where(&)_h2]:leading-[1.15] [:where(&)_h2]:tracking-[-0.015em] [:where(&)_h2]:text-balance [:where(&)_h2]:text-ink [:where(&)_h2]:font-stretch-[104%]",
  "[:where(&)_h3]:scroll-mt-24 [:where(&)_h3]:text-[1.12rem] [:where(&)_h3]:font-[650] [:where(&)_h3]:leading-[1.3] [:where(&)_h3]:text-ink",
  // Flow: sections are spaced apart, their children stack 16 px apart
  "[:where(&)_section+section]:mt-14 [:where(&)_section>*+*]:mt-4 [:where(&)_section>h3]:mt-8 [:where(&)_section>h2+*]:mt-3",
  // Lists
  "[:where(&)_ul]:list-disc [:where(&)_ul]:pl-[1.3em] [:where(&)_ol]:list-decimal [:where(&)_ol]:pl-[1.3em] [:where(&)_li+li]:mt-2 [:where(&)_li]:marker:text-ink-3",
  // Inline
  "[:where(&)_strong]:font-semibold [:where(&)_strong]:text-ink",
  "[:where(&)_code]:rounded-[6px] [:where(&)_code]:bg-surface-2 [:where(&)_code]:px-[0.35em] [:where(&)_code]:py-[0.1em] [:where(&)_code]:text-ink",
  "[:where(&)_a]:text-accent-ink [:where(&)_a]:underline [:where(&)_a]:underline-offset-[3px] [:where(&)_a]:[overflow-wrap:anywhere]",
  // Definition lists: a term in ink, its description below
  "[:where(&)_dt]:font-semibold [:where(&)_dt]:text-ink [:where(&)_dd]:mt-1 [:where(&)_dd+dt]:mt-5",
);

interface ProseProps {
  /** The page h1. */
  title: ReactNode;
  /** One line under the h1, in secondary ink. */
  intro?: ReactNode;
  /** A quiet line under the h1, e.g. "Last updated …". */
  meta?: ReactNode;
  /** The h2s, listed in the "On this page" rail at ≥ 1024 px. */
  toc?: readonly ProseTocItem[];
  children: ReactNode;
  className?: string;
}

/** The toc entry whose h2 was the last to pass the top third of the viewport (scroll spy). */
function useCurrentSection(ids: readonly string[]): string | null {
  const [current, setCurrent] = useState<string | null>(ids[0] ?? null);
  const key = ids.join(" ");
  useEffect(() => {
    const headings = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0 || typeof IntersectionObserver === "undefined") return;
    const pick = () => {
      const line = window.innerHeight * 0.3;
      let at = headings[0].id;
      for (const h of headings) if (h.getBoundingClientRect().top <= line) at = h.id;
      setCurrent(at);
    };
    // Fires whenever a heading enters or leaves the top 30% of the viewport.
    const io = new IntersectionObserver(pick, { rootMargin: "0px 0px -70% 0px" });
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, [key]);
  return current;
}

function TocRail({ toc }: { toc: readonly ProseTocItem[] }) {
  const current = useCurrentSection(toc.map((t) => t.id));
  return (
    <nav aria-labelledby="on-this-page" className="sticky top-[88px] hidden self-start lg:block">
      <p id="on-this-page" className="text-[13.5px] font-medium text-ink-3">
        On this page
      </p>
      <ol className="mt-2.5 grid list-none gap-0.5 pl-0 text-[14px]">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={current === item.id ? "location" : undefined}
              className="block border-l-2 border-transparent py-1 pl-3 text-ink-2 no-underline transition-colors duration-150 hover:text-ink hover:underline hover:underline-offset-[3px] aria-[current=location]:border-accent aria-[current=location]:text-ink"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Article column for text pages (Help, Privacy, Terms, Contact): 72ch wide, page h1.
 * With a toc, a sticky "On this page" rail sits beside the article at ≥ 1024 px.
 */
export function Prose({ title, intro, meta, toc, children, className }: ProseProps) {
  const hasToc = Boolean(toc && toc.length > 0);
  return (
    <article
      className={cn(
        "container py-[clamp(40px,6vw,88px)]",
        hasToc && "lg:grid lg:grid-cols-[minmax(0,72ch)_240px] lg:items-start lg:gap-16",
        className,
      )}
    >
      <div className={cn("max-w-[72ch]", proseClass)}>
        <header>
          <h1 className="heading text-[clamp(1.7rem,1.3rem+1vw,2.2rem)] text-ink">{title}</h1>
          {intro && <p className="mt-4 text-[1.08rem] leading-[1.55] text-ink-2">{intro}</p>}
          {meta && <p className="mt-3 text-[14px] text-ink-3">{meta}</p>}
        </header>

        <div className={hasToc ? "mt-12" : "mt-6"}>{children}</div>
      </div>

      {toc && hasToc && <TocRail toc={toc} />}
    </article>
  );
}

interface ProseSectionProps {
  id: string;
  title: ReactNode;
  children: ReactNode;
}

/** One h2 section inside <Prose>; the id is the "On this page" anchor. */
export function ProseSection({ id, title, children }: ProseSectionProps) {
  return (
    <section>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
