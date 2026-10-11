import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Sparkles, X } from "lucide-react";
import { Tooltip } from "@/components/Tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/constants/templates";
import type { useAIPolish } from "@/hooks/useAIPolish";
import { AttachmentsPanel } from "./AttachmentsPanel";
import { EditorToolbar } from "./EditorToolbar";
import { FieldChips } from "./FieldChips";
import { FieldTokens, fieldTokensKey } from "./placeholderDecorations";
import { PreviewCard } from "./PreviewCard";
import { hasText } from "./preview";
import type { CsvState, WizardState } from "./state";
import { card, lbl } from "./ui";

interface MessageProps {
  state: WizardState;
  csv: CsvState;
  from: string;
  files: File[];
  onFiles: (files: File[]) => void;
  onMessage: (patch: { subject?: string; body?: string }) => void;
  onTemplate: (t: EmailTemplate) => void;
  ai: ReturnType<typeof useAIPolish>;
}

type Target = "subject" | "editor" | "html";

export function Message({ state, csv, from, files, onFiles, onMessage, onTemplate, ai }: MessageProps) {
  const { subject, body, polish } = state;
  const [htmlMode, setHtmlMode] = useState(false);
  const [linkedField, setLinkedField] = useState<string | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTarget = useRef<Target>("editor");
  /** The last HTML the editor itself produced; anything else in `body` came from outside. */
  const lastEmitted = useRef(body);

  const onBody = useCallback(
    (html: string) => {
      lastEmitted.current = html;
      onMessage({ body: html });
    },
    [onMessage],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { class: "text-accent-ink underline underline-offset-[3px]", rel: "noopener noreferrer" },
        },
      }),
      Placeholder.configure({ placeholder: "Write your message…" }),
      FieldTokens.configure({ headers: csv.headers }),
    ],
    content: body,
    onUpdate: ({ editor: e }) => onBody(e.getHTML()),
    onFocus: () => {
      lastTarget.current = "editor";
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": "msg-lbl",
        spellcheck: "true",
      },
    },
  });

  const htmlModeRef = useRef(htmlMode);
  useEffect(() => {
    htmlModeRef.current = htmlMode;
  }, [htmlMode]);

  // Template, polish and version switches change `body` from outside the editor.
  useEffect(() => {
    if (!editor || body === lastEmitted.current) return;
    lastEmitted.current = body;
    editor.commands.setContent(body, { emitUpdate: false });
    // In rich-text mode, send what the editor shows: TipTap's version of that HTML (L7).
    // The HTML textarea is left alone; there the raw HTML is what you see and send.
    if (htmlModeRef.current || !hasText(body)) return;
    const shown = editor.getHTML();
    if (shown !== body) onBody(shown);
  }, [body, editor, onBody]);

  useEffect(() => {
    if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(fieldTokensKey, csv.headers));
  }, [csv.headers, editor]);

  useEffect(() => {
    editor?.setEditable(!ai.busy, false);
  }, [ai.busy, editor]);

  const insertField = (field: string) => {
    const text = `{{${field}}} `;
    const target = lastTarget.current === "html" && !htmlMode ? "editor" : lastTarget.current === "editor" && htmlMode ? "html" : lastTarget.current;
    if (target === "editor" && editor) {
      editor.chain().focus().insertContent({ type: "text", text }).run();
      return;
    }
    const el = target === "subject" ? subjectRef.current : textareaRef.current;
    if (!el) return;
    const value = target === "subject" ? subject : body;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const next = value.slice(0, start) + text + value.slice(end);
    onMessage(target === "subject" ? { subject: next } : { body: next });
    const caret = start + text.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const onEditorHover = (e: React.MouseEvent) => {
    const field = (e.target as HTMLElement).closest<HTMLElement>(".tok")?.dataset.field ?? null;
    if (field !== linkedField) setLinkedField(field);
  };

  const polishControl = !ai.available ? undefined : polish ? (
    <div
      role="group"
      aria-label="Which version to use"
      className="inline-flex h-9 rounded-sm border border-line bg-surface p-0.5 max-[720px]:flex-[1_0_100%]"
    >
      {(["original", "polished"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={polish.showing === v}
          onClick={() => ai.choose(v)}
          className="rounded-[6px] px-2 text-[14px] font-[550] text-ink-2 transition-colors duration-150 hover:text-ink aria-pressed:bg-surface-2 aria-pressed:text-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-line)] max-[720px]:flex-1"
        >
          {v === "original" ? "Original" : "Polished"}
        </button>
      ))}
    </div>
  ) : (
    <Tooltip
      content={
        ai.meetsMin
          ? "Rewrites the subject and message with Google Gemini. Fields stay as they are, and you can switch back. Don't polish anything you wouldn't send to Google. For users 18 and over."
          : `Write at least ${ai.minChars} characters to use AI polish (${ai.charCount} of ${ai.minChars}).`
      }
      tipClassName="max-[720px]:right-auto max-[720px]:left-0"
    >
      {(tip) => (
        <button
          type="button"
          aria-label={ai.busy ? "Polishing…" : "Polish with AI"}
          aria-describedby={tip["aria-describedby"]}
          aria-disabled={!ai.canPolish}
          aria-busy={ai.busy || undefined}
          onClick={() => void ai.run()}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-sm border border-line bg-surface px-2 text-[14px] whitespace-nowrap text-ink-2 transition-colors duration-150 max-[720px]:w-9 max-[720px]:justify-center max-[720px]:px-0",
            ai.canPolish ? "hover:border-line-strong hover:text-ink" : "cursor-not-allowed bg-surface-2 text-ink-3",
          )}
        >
          <Sparkles aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span className="max-[720px]:sr-only">{ai.busy ? "Polishing…" : "Polish"}</span>
        </button>
      )}
    </Tooltip>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] items-start gap-6 pb-8 max-[1080px]:grid-cols-1">
      <section aria-label="Message editor" className={cn(card, "grid gap-[22px] p-6 max-[720px]:gap-[18px] max-[720px]:p-4")}>
        <div>
          <label htmlFor="subject" className={lbl}>
            Subject
          </label>
          <Input
            id="subject"
            ref={subjectRef}
            value={subject}
            placeholder="Write a subject…"
            autoComplete="off"
            className="h-[50px] px-3.5 text-[16.5px] font-[550] md:text-[16.5px]"
            onChange={(e) => onMessage({ subject: e.target.value })}
            onFocus={() => {
              lastTarget.current = "subject";
            }}
            disabled={ai.busy}
          />
        </div>

        <div>
          <span id="msg-lbl" className={lbl}>
            Message
          </span>
          <div className="rounded-md border border-line bg-surface transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft">
            {editor && (
              <EditorToolbar
                editor={editor}
                htmlMode={htmlMode}
                onHtmlMode={setHtmlMode}
                hasContent={subject.trim().length > 0 || hasText(body)}
                onTemplate={onTemplate}
                polish={polishControl}
              />
            )}
            <div
              className={cn("tiptap-editor transition-opacity duration-200", ai.busy && "opacity-45", htmlMode && "hidden")}
              onMouseOver={onEditorHover}
              onMouseLeave={() => setLinkedField(null)}
            >
              <EditorContent editor={editor} />
            </div>
            {htmlMode && (
              <Textarea
                ref={textareaRef}
                aria-labelledby="msg-lbl"
                value={body}
                spellCheck={false}
                onChange={(e) => onMessage({ body: e.target.value })}
                onFocus={() => {
                  lastTarget.current = "html";
                }}
                className="min-h-[300px] rounded-none rounded-b-[11px] border-0 px-5 py-[18px] font-mono text-[13.5px] leading-[1.6] focus-visible:ring-0 max-[720px]:min-h-[240px] max-[720px]:px-3.5"
              />
            )}
          </div>
          {ai.available && polish && (
            <p className="mt-2 text-[13.5px] text-ink-3">
              Rewritten by Gemini. Read it through before you send. Don&rsquo;t polish anything you wouldn&rsquo;t send to Google.
              For users 18 and over.
            </p>
          )}
          {ai.error && (
            <p role="alert" className="mt-2 flex items-start gap-2 text-[14px] text-neg">
              <span className="flex-1">{ai.error}</span>
              <button
                type="button"
                aria-label="Dismiss the error"
                className="grid size-7 place-items-center rounded-[7px] text-neg hover:bg-neg-soft"
                onClick={ai.dismissError}
              >
                <X aria-hidden="true" className="size-4" strokeWidth={1.8} />
              </button>
            </p>
          )}
        </div>

        <FieldChips
          headers={csv.headers}
          fileName={csv.fileName}
          linkedField={linkedField}
          onInsert={insertField}
          onLink={setLinkedField}
        />

        <AttachmentsPanel files={files} onFiles={onFiles} savedNames={state.attachmentNames} />
      </section>

      <PreviewCard
        csv={csv}
        from={from}
        subject={subject}
        body={body}
        linkedField={linkedField}
        onLink={setLinkedField}
        className="sticky top-4 max-[1080px]:static"
      />
    </div>
  );
}
