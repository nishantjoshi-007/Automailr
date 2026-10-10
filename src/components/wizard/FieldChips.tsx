import { cn } from "@/lib/utils";
import { isUsableField, UNUSABLE_FIELD_TITLE } from "./preview";
import { chip, chipActive, lblSm } from "./ui";

interface FieldChipsProps {
  headers: string[];
  fileName: string;
  linkedField: string | null;
  onInsert: (field: string) => void;
  onLink: (field: string | null) => void;
}

/** "Insert a field from contacts.csv": one chip per usable column. */
export function FieldChips({ headers, fileName, linkedField, onInsert, onLink }: FieldChipsProps) {
  return (
    <div>
      <span className={lblSm} id="fields-lbl">
        Insert a field from {fileName}
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="fields-lbl">
        {headers.map((h) => {
          const usable = isUsableField(h);
          return (
            <button
              key={h}
              type="button"
              translate="no"
              disabled={!usable}
              title={usable ? `Insert {{${h}}}` : UNUSABLE_FIELD_TITLE}
              aria-label={usable ? `Insert {{${h}}}` : `${h}: ${UNUSABLE_FIELD_TITLE}`}
              className={cn(
                chip,
                usable ? "hover:border-accent-hover hover:bg-accent-soft hover:text-accent-ink" : "cursor-not-allowed text-ink-3 line-through opacity-70",
                usable && linkedField === h && chipActive,
              )}
              // keep the caret where it is in the subject or the editor
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsert(h)}
              onMouseEnter={() => usable && onLink(h)}
              onMouseLeave={() => onLink(null)}
              onFocus={() => usable && onLink(h)}
              onBlur={() => onLink(null)}
            >
              <span aria-hidden="true" className="opacity-50">{"{{"}</span>
              {h}
              <span aria-hidden="true" className="opacity-50">{"}}"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
