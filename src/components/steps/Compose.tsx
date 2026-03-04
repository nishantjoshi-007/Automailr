import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMAIL_TEMPLATES } from "@/constants/templates";
import { useAIPolish } from "@/hooks/useAIPolish";
import {
  PenLine,
  Sparkles,
  Loader2,
  Undo2,
  WandSparkles,
  AlertCircle,
  X,
  Code,
  Type,
  LinkIcon,
  Bold,
  Italic,
  Strikethrough,
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Unlink,
} from "lucide-react";

interface ComposeProps {
  headers: string[];
  subject: string;
  body: string;
  onSubjectChange: (s: string) => void;
  onBodyChange: (b: string) => void;
  onPolishingChange?: (isPolishing: boolean) => void;
}

type EditorMode = "richtext" | "html";

export function Compose({ headers, subject, body, onSubjectChange, onBodyChange, onPolishingChange }: ComposeProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>("richtext");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your email body here…" }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline cursor-pointer" } }),
    ],
    content: body,
    onUpdate: ({ editor }) => {
      onBodyChange(editor.getHTML());
    },
  });

  const ai = useAIPolish({ subject, body, onSubjectChange, onBodyChange });

  // Notify parent when polishing state changes
  useEffect(() => {
    onPolishingChange?.(ai.isPolishing);
  }, [ai.isPolishing, onPolishingChange]);

  // Sync Tiptap editor when body changes externally (e.g., AI toggle, template)
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    if (!editor) return;
    // Skip if this update originated from the editor's own onUpdate
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const currentHtml = editor.getHTML();
    if (body !== currentHtml) {
      editor.commands.setContent(body, { emitUpdate: false });
    }
  }, [body, editor]);

  // Wrap onBodyChange to track internal updates
  const handleEditorUpdate = useCallback(
    (html: string) => {
      isInternalUpdate.current = true;
      onBodyChange(html);
    },
    [onBodyChange],
  );

  // Update the editor's onUpdate handler to use our wrapper
  useEffect(() => {
    if (!editor) return;
    const handler = () => handleEditorUpdate(editor.getHTML());
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
  }, [editor, handleEditorUpdate]);

  const insertPlaceholder = useCallback(
    (header: string) => {
      if (editorMode === "richtext") {
        editor?.chain().focus().insertContent(`{{${header}}}`).run();
      } else {
        // In HTML mode, append at cursor or end — handled by focusing the textarea
        // We'll insert via the body state; the textarea will pick it up
        onBodyChange(body + `{{${header}}}`);
      }
    },
    [editor, editorMode, body, onBodyChange],
  );

  /** Switch between Rich Text and HTML modes, syncing content */
  const toggleEditorMode = useCallback(() => {
    if (editorMode === "richtext") {
      // Switching to HTML: Tiptap HTML is already in `body`
      setEditorMode("html");
    } else {
      // Switching to Rich Text: load current body HTML into Tiptap
      editor?.commands.setContent(body);
      setEditorMode("richtext");
    }
  }, [editorMode, editor, body]);

  const applyTemplate = useCallback(
    (templateId: string) => {
      const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
      if (tpl) {
        ai.clearPolish();
        onSubjectChange(tpl.subject);
        editor?.commands.setContent(tpl.body);
        onBodyChange(tpl.body);
      }
    },
    [editor, onSubjectChange, onBodyChange, ai],
  );

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <Card className="glass">
        <CardHeader className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              Compose Your Email
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Template Select */}
              <Select onValueChange={applyTemplate}>
                <SelectTrigger className="w-52">
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  <SelectValue placeholder="Use a template" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject">Subject</Label>
              {ai.isAIAvailable && (
                <div className="flex items-center gap-1.5">
                  {/* AI Polish Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={ai.polish}
                    disabled={!ai.canPolish}
                    className="h-7 gap-1.5 px-2.5 text-xs"
                    title={
                      !ai.meetsMinChars
                        ? `Write at least ${ai.minBodyChars} characters (${ai.bodyCharCount}/${ai.minBodyChars})`
                        : "Polish subject & body with AI"
                    }
                  >
                    {ai.isPolishing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <WandSparkles className="h-3.5 w-3.5" />
                    )}
                    {ai.isPolishing ? "Polishing…" : "AI Polish"}
                  </Button>

                  {/* Original / AI Toggle */}
                  {ai.isPolished && (
                    <Button
                      variant={ai.isShowingOriginal ? "secondary" : "default"}
                      size="sm"
                      onClick={ai.toggleVersion}
                      className="h-7 gap-1.5 px-2.5 text-xs"
                      title={ai.isShowingOriginal ? "Switch to AI version" : "Revert to original"}
                    >
                      {ai.isShowingOriginal ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Show AI
                        </>
                      ) : (
                        <>
                          <Undo2 className="h-3.5 w-3.5" />
                          Original
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="e.g. Hello {{first_name}}!"
              disabled={ai.isPolishing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Body</Label>
              {/* Editor Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditorMode}
                disabled={ai.isPolishing}
                className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                title={editorMode === "richtext" ? "Switch to HTML editor" : "Switch to rich text editor"}
              >
                {editorMode === "richtext" ? (
                  <>
                    <Code className="h-3 w-3" />
                    HTML
                  </>
                ) : (
                  <>
                    <Type className="h-3 w-3" />
                    Rich Text
                  </>
                )}
              </Button>
            </div>

            {/* AI Error Message */}
            {ai.error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{ai.error}</span>
                <button
                  onClick={ai.dismissError}
                  className="shrink-0 rounded-sm p-0.5 hover:bg-destructive/20 transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Char count hint when body is too short */}
            {ai.isAIAvailable && !ai.meetsMinChars && ai.bodyCharCount > 0 && (
              <p className="text-xs text-muted-foreground">
                AI Polish requires at least {ai.minBodyChars} characters ({ai.bodyCharCount}/{ai.minBodyChars})
              </p>
            )}

            {editorMode === "richtext" ? (
              <div
                className={`tiptap-editor rounded-lg border border-border bg-background/50 ${ai.isPolishing ? "pointer-events-none opacity-60" : ""}`}
              >
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
                  {/* Inline formatting */}
                  <ToolbarBtn
                    icon={<Bold className="h-3.5 w-3.5" />}
                    title="Bold"
                    active={!!editor?.isActive("bold")}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<Italic className="h-3.5 w-3.5" />}
                    title="Italic"
                    active={!!editor?.isActive("italic")}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<Strikethrough className="h-3.5 w-3.5" />}
                    title="Strikethrough"
                    active={!!editor?.isActive("strike")}
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<CodeXml className="h-3.5 w-3.5" />}
                    title="Inline code"
                    active={!!editor?.isActive("code")}
                    onClick={() => editor?.chain().focus().toggleCode().run()}
                    disabled={ai.isPolishing}
                  />

                  <div className="mx-1 h-4 w-px bg-border" />

                  {/* Headings */}
                  <ToolbarBtn
                    icon={<Heading1 className="h-3.5 w-3.5" />}
                    title="Heading 1"
                    active={!!editor?.isActive("heading", { level: 1 })}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<Heading2 className="h-3.5 w-3.5" />}
                    title="Heading 2"
                    active={!!editor?.isActive("heading", { level: 2 })}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<Heading3 className="h-3.5 w-3.5" />}
                    title="Heading 3"
                    active={!!editor?.isActive("heading", { level: 3 })}
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    disabled={ai.isPolishing}
                  />

                  <div className="mx-1 h-4 w-px bg-border" />

                  {/* Lists & block-level */}
                  <ToolbarBtn
                    icon={<List className="h-3.5 w-3.5" />}
                    title="Bullet list"
                    active={!!editor?.isActive("bulletList")}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<ListOrdered className="h-3.5 w-3.5" />}
                    title="Ordered list"
                    active={!!editor?.isActive("orderedList")}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<Quote className="h-3.5 w-3.5" />}
                    title="Blockquote"
                    active={!!editor?.isActive("blockquote")}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    disabled={ai.isPolishing}
                  />
                  <ToolbarBtn
                    icon={<Minus className="h-3.5 w-3.5" />}
                    title="Horizontal rule"
                    active={false}
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    disabled={ai.isPolishing}
                  />

                  <div className="mx-1 h-4 w-px bg-border" />

                  {/* Link */}
                  <ToolbarBtn
                    icon={<LinkIcon className="h-3.5 w-3.5" />}
                    title="Insert link"
                    active={!!editor?.isActive("link")}
                    onClick={() => {
                      if (!editor) return;
                      if (editor.isActive("link")) {
                        editor.chain().focus().unsetLink().run();
                        return;
                      }
                      setLinkUrl("");
                      setLinkDialogOpen(true);
                    }}
                    disabled={ai.isPolishing}
                  />
                  {editor?.isActive("link") && (
                    <ToolbarBtn
                      icon={<Unlink className="h-3.5 w-3.5" />}
                      title="Remove link"
                      active={false}
                      onClick={() => editor?.chain().focus().unsetLink().run()}
                      disabled={ai.isPolishing}
                    />
                  )}
                </div>
                <EditorContent editor={editor} />
              </div>
            ) : (
              <Textarea
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder="<p>Write your raw HTML here…</p>"
                className="min-h-[250px] font-mono text-sm bg-background/50 resize-y"
                disabled={ai.isPolishing}
                spellCheck={false}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Click to insert placeholder at cursor</Label>
            <div className="flex flex-wrap gap-2">
              {headers.map((h) => (
                <Badge
                  key={h}
                  variant="secondary"
                  className="cursor-pointer font-mono text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => insertPlaceholder(h)}
                >
                  {`{{${h}}}`}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Link Dialog ─── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              Insert Link
            </DialogTitle>
            <DialogDescription>
              Enter the URL for the link. The selected text will become clickable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (linkUrl.trim()) {
                    editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
                    setLinkDialogOpen(false);
                  }
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (linkUrl.trim()) {
                  editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
                }
                setLinkDialogOpen(false);
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Small toolbar toggle button used inside the rich-text toolbar */
function ToolbarBtn({
  icon,
  title,
  active,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-7 w-7 p-0"
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}
