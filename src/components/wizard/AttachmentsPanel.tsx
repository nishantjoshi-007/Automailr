import { useRef, useState } from "react";
import { ChevronDown, Paperclip, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_ATTACHMENT_BYTES } from "./constants";
import { formatBytes, plural, totalBytes } from "./preview";
import { dropOver, dropZone, hint, linkish } from "./ui";

interface AttachmentsPanelProps {
  files: File[];
  onFiles: (files: File[]) => void;
  /** Names persisted from before a reload (files themselves can't be stored). */
  savedNames: string[];
}

export function AttachmentsPanel({ files, onFiles, savedNames }: AttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const total = totalBytes(files);
  const isOver = total > MAX_ATTACHMENT_BYTES;
  const lost = files.length === 0 && savedNames.length > 0;
  // Opened once on mount when files were lost; after that the user owns it.
  const [startOpen] = useState(lost);

  const add = (list: FileList | null) => {
    if (list?.length) onFiles([...files, ...Array.from(list)]);
  };

  const summary = files.length
    ? `${plural(files.length, "file", "files")} · ${formatBytes(total)}`
    : "Optional · none added";

  return (
    <details className="group rounded-md border border-line" open={startOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-md px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <Paperclip aria-hidden="true" className="size-[17px] text-ink-3" strokeWidth={1.8} />
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 max-[720px]:flex-col">
          <span className="text-[15px] font-semibold">Attachments</span>
          <span aria-live="polite" className="num ml-auto text-right text-[14px] text-ink-3 max-[720px]:ml-0 max-[720px]:text-left max-[720px]:text-[13.5px]">
            {summary}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-[17px] text-ink-3 transition-transform duration-150 group-open:rotate-180"
          strokeWidth={1.8}
        />
      </summary>
      <div className="grid gap-3 px-4 pb-4">
        {lost && (
          <p className="text-[14px] text-neg">
            Your attachments ({savedNames.join(", ")}) didn't survive the reload. Add them again.
          </p>
        )}
        <button
          type="button"
          className={cn(dropZone, "py-[22px]", over && dropOver)}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            add(e.dataTransfer.files);
          }}
        >
          <Upload aria-hidden="true" className="size-[22px] text-ink-3" strokeWidth={1.8} />
          <span>
            Drop files here, or <span className={linkish}>choose files</span>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        {files.length > 0 && (
          <ul className="grid gap-1.5">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 rounded-[10px] bg-surface-2 py-1 pr-1 pl-3 text-[14px]">
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="num font-mono text-[13px] text-ink-3">{formatBytes(f.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  className="grid size-8 place-items-center rounded-[7px] text-ink-3 transition-colors duration-150 hover:bg-surface hover:text-ink"
                  onClick={() => onFiles(files.filter((_, j) => j !== i))}
                >
                  <X aria-hidden="true" className="size-[15px]" strokeWidth={1.8} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p aria-live="polite" className={cn(hint, "num", isOver && "text-neg")}>
          {files.length === 0
            ? "Up to 25\u202fMB in total. Every recipient gets the same files."
            : `${formatBytes(total)} of 25\u202fMB${isOver ? ". That's over Gmail's limit, so remove a file before sending." : ""}`}
        </p>
      </div>
    </details>
  );
}
