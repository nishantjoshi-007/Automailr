import { useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { Bold, Code, Heading, Italic, Link2, List, ListOrdered, Quote, Strikethrough } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/constants/templates";
import { normaliseUrl } from "./preview";

interface EditorToolbarProps {
  editor: Editor;
  htmlMode: boolean;
  onHtmlMode: (on: boolean) => void;
  /** Whether the subject or message already has text (picking a template then asks first). */
  hasContent: boolean;
  onTemplate: (t: EmailTemplate) => void;
  /** The AI polish button or the Original | Polished switch, first in the right group. */
  polish?: ReactNode;
}

const tb =
  "grid size-9 place-items-center rounded-sm text-ink-2 transition-colors duration-150 hover:bg-surface hover:text-ink aria-pressed:bg-surface aria-pressed:text-accent-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-line)] disabled:cursor-not-allowed disabled:opacity-40 max-[720px]:size-[34px]";
const sep = "h-5 w-px bg-line max-[720px]:mx-[3px]";

function ToolButton({ label, pressed, onClick, disabled, children }: { label: string; pressed?: boolean; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      className={tb}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      // keep the editor's selection
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor, htmlMode, onHtmlMode, hasContent, onTemplate, polish }: EditorToolbarProps) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      heading: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
    }),
  });

  const [templateId, setTemplateId] = useState("");
  const [pending, setPending] = useState<EmailTemplate | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const chain = () => editor.chain().focus();
  const off = htmlMode;
  const icon = { "aria-hidden": true, className: "size-[17px]", strokeWidth: 1.8 } as const;

  const pickTemplate = (id: string) => {
    const t = EMAIL_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (hasContent) setPending(t);
    else {
      setTemplateId(id);
      onTemplate(t);
    }
  };

  const openLink = () => {
    setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
    setUrlError(null);
    setLinkOpen(true);
  };

  const applyLink = () => {
    const href = normaliseUrl(url);
    if (!href) {
      setUrlError("Use a link that starts with https://, http:// or mailto:.");
      return;
    }
    setLinkOpen(false);
    if (editor.state.selection.empty && !editor.isActive("link")) {
      chain()
        .insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] })
        .run();
    } else {
      chain().extendMarkRange("link").setLink({ href }).run();
    }
  };

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 rounded-t-[11px] border-b border-line bg-surface-2 p-1.5"
    >
      <ToolButton label="Bold" pressed={active.bold} disabled={off} onClick={() => chain().toggleBold().run()}>
        <Bold {...icon} />
      </ToolButton>
      <ToolButton label="Italic" pressed={active.italic} disabled={off} onClick={() => chain().toggleItalic().run()}>
        <Italic {...icon} />
      </ToolButton>
      <ToolButton label="Strikethrough" pressed={active.strike} disabled={off} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough {...icon} />
      </ToolButton>
      <span className={cn(sep, polish ? "mx-1" : "mx-1.5")} aria-hidden="true" />
      <ToolButton label="Heading" pressed={active.heading} disabled={off} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <Heading {...icon} />
      </ToolButton>
      <ToolButton label="Bulleted list" pressed={active.bullet} disabled={off} onClick={() => chain().toggleBulletList().run()}>
        <List {...icon} />
      </ToolButton>
      <ToolButton label="Numbered list" pressed={active.ordered} disabled={off} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered {...icon} />
      </ToolButton>
      <ToolButton label="Quote" pressed={active.quote} disabled={off} onClick={() => chain().toggleBlockquote().run()}>
        <Quote {...icon} />
      </ToolButton>
      <ToolButton label="Link" pressed={active.link} disabled={off} onClick={openLink}>
        <Link2 {...icon} />
      </ToolButton>

      <div
        className={cn(
          "ml-auto flex flex-wrap items-center max-[720px]:ml-0 max-[720px]:w-full max-[720px]:pt-1",
          polish ? "gap-1" : "gap-1.5",
        )}
      >
        {polish}
        <Select value={templateId} onValueChange={pickTemplate}>
          <SelectTrigger
            id="tpl-trigger"
            aria-label="Start from a template"
            className={cn(
              "h-9 w-auto max-w-[220px] rounded-sm text-[14px] text-ink-2 max-[720px]:max-w-none max-[720px]:min-w-0 max-[720px]:flex-1",
              polish ? "min-w-0 gap-1 px-2" : "min-w-[148px] gap-2 px-2.5",
            )}
          >
            <SelectValue placeholder="Templates" />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_TEMPLATES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          aria-pressed={htmlMode}
          onClick={() => onHtmlMode(!htmlMode)}
          className={cn(
            "inline-flex h-9 items-center rounded-sm border border-line bg-surface text-[14px] text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink",
            polish ? "gap-1 px-2" : "gap-1.5 px-2.5",
            htmlMode && "border-accent-hover bg-accent-soft text-accent-ink hover:text-accent-ink",
          )}
        >
          <Code aria-hidden="true" className="size-[15px]" strokeWidth={1.8} />
          HTML
        </button>
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            document.getElementById("tpl-trigger")?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your subject and message with the template?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pending?.name}” replaces what you've written. Your current text isn't kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my text</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) {
                  setTemplateId(pending.id);
                  onTemplate(pending);
                }
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent
          className="max-w-md"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.commands.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{active.link ? "Edit link" : "Add a link"}</DialogTitle>
            <DialogDescription>Web addresses (https://) and email links (mailto:) only.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <label htmlFor="link-url" className="text-[14.5px] font-semibold">
              Link address
            </label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://…"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={urlError ? true : undefined}
              aria-describedby={urlError ? "link-error" : undefined}
            />
            {urlError && (
              <p id="link-error" className="text-[14px] text-neg">
                {urlError}
              </p>
            )}
            <DialogFooter className="mt-3 gap-2">
              {active.link && (
                <Button
                  type="button"
                  variant="outline"
                  className="sm:mr-auto"
                  onClick={() => {
                    setLinkOpen(false);
                    chain().extendMarkRange("link").unsetLink().run();
                  }}
                >
                  Remove link
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{active.link ? "Update link" : "Add link"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
