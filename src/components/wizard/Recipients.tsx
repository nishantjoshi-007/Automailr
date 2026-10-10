import { useRef, useState, type DragEvent } from "react";
import { Check, CircleAlert, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { downloadSampleCSV, isValidEmail, parseCSV } from "@/utils/csvParser";
import { INVALID_ROWS_SHOWN, PREVIEW_ROWS } from "./constants";
import { cell, emailKey, isUsableField, plural, UNUSABLE_FIELD_TITLE } from "./preview";
import type { CsvState } from "./state";
import { card, cardTitle, chip, dropOver, dropZone, linkish } from "./ui";

interface RecipientsProps {
  csv: CsvState | null;
  onCsv: (csv: CsvState) => void;
}

const isCsvFile = (f: File) => /\.csv$/i.test(f.name) || f.type === "text/csv";

export function Recipients({ csv, onCsv }: RecipientsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = async (file: File | undefined) => {
    if (!file) return;
    if (!isCsvFile(file)) {
      setError("That isn't a .csv file.");
      return;
    }
    setError(null);
    setReading(file.name);
    const result = await parseCSV(file);
    setReading(null);
    if (!result.success || !result.data) {
      setError(result.error ?? "That file couldn't be read.");
      return;
    }
    onCsv({ fileName: file.name, headers: result.data.headers, rows: result.data.rows });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,text/csv"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        void read(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );

  const errorLine = error && (
    <p role="alert" className="flex items-start gap-2 text-[14.5px] text-neg">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-[17px] flex-none" strokeWidth={1.8} />
      {error}
    </p>
  );

  if (!csv) {
    return (
      <section aria-label="Upload a CSV" className={cn(card, "mx-auto mb-8 grid max-w-[720px] gap-5 p-6 max-[720px]:p-4")}>
        <button
          type="button"
          className={cn(dropZone, "py-10", over && dropOver)}
          aria-busy={reading !== null}
          aria-describedby="csv-hint"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
        >
          <Upload aria-hidden="true" className="size-[22px] text-ink-3" strokeWidth={1.8} />
          {reading ? (
            <span>Reading {reading}…</span>
          ) : (
            <span>
              Drop a CSV here, or <span className={linkish}>choose a file</span>
            </span>
          )}
          <span id="csv-hint" className="text-[14px] text-ink-3">
            A .csv with an email column. Up to 5,000 rows.
          </span>
        </button>
        {fileInput}
        {errorLine}
        <div>
          <button type="button" className={cn(linkish, "text-[15px]")} onClick={downloadSampleCSV}>
            Download a sample CSV
          </button>
        </div>
        <div className="border-t border-line pt-5">
          <h2 className="mb-2 text-[14.5px] font-semibold">What the file needs</h2>
          <ul className="grid list-disc gap-1 pl-5 text-[15px] text-ink-2 marker:text-ink-3">
            <li>
              An <code className="text-ink">email</code> column, in any capitalisation.
            </li>
            <li>One row per person.</li>
            <li>Column names made of letters, numbers and underscores, if you want to use them as fields.</li>
          </ul>
        </div>
      </section>
    );
  }

  return <RecipientsTable csv={csv} onReplace={() => inputRef.current?.click()} fileInput={fileInput} errorLine={errorLine} />;
}

interface TableProps {
  csv: CsvState;
  onReplace: () => void;
  fileInput: React.ReactNode;
  errorLine: React.ReactNode;
}

function RecipientsTable({ csv, onReplace, fileInput, errorLine }: TableProps) {
  const [onlyInvalid, setOnlyInvalid] = useState(false);
  const key = emailKey(csv.headers);
  const columns = [key, ...csv.headers.filter((h) => h !== key)];
  const invalid = csv.rows.filter((r) => !isValidEmail(cell(r, key)));
  const showInvalid = onlyInvalid && invalid.length > 0;
  const rows = showInvalid ? invalid.slice(0, INVALID_ROWS_SHOWN) : csv.rows.slice(0, PREVIEW_ROWS);
  const total = showInvalid ? invalid.length : csv.rows.length;

  return (
    <div className="grid grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] items-start gap-6 pb-8 max-[1080px]:grid-cols-1">
      <section aria-labelledby="csv-h" className={cn(card, "overflow-hidden")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-3.5 pr-4 pl-5 max-[720px]:pl-4">
          <FileSpreadsheet aria-hidden="true" className="size-[18px] text-ink-3" strokeWidth={1.8} />
          <h2 id="csv-h" className="min-w-0 truncate font-mono text-[15px] font-semibold">
            {csv.fileName}
          </h2>
          <span className="num text-[14px] text-ink-3">
            {plural(csv.rows.length, "row", "rows")} · {plural(csv.headers.length, "column", "columns")}
          </span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={onReplace}>
            Replace file
          </Button>
          {fileInput}
        </div>
        {errorLine && <div className="px-5 pt-4">{errorLine}</div>}
        <div className="overflow-x-auto">
          <Table className="font-mono text-[12.5px]">
            <TableHeader className="bg-surface-2">
              <TableRow className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead key={c} className="h-9 px-4 font-medium whitespace-nowrap text-ink-2">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  {columns.map((c) => {
                    const v = cell(r, c);
                    const bad = c === key && !isValidEmail(v);
                    return (
                      <TableCell key={c} className="max-w-[260px] truncate px-4 py-2.5 whitespace-nowrap text-ink-2">
                        {bad ? (
                          <span className="inline-flex items-center gap-1.5 text-neg" title="Invalid email, this row is skipped">
                            <CircleAlert aria-hidden="true" className="size-3.5 flex-none" strokeWidth={2} />
                            {v || "(blank)"}
                            <span className="sr-only">, invalid email, this row is skipped</span>
                          </span>
                        ) : (
                          v
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line px-5 py-3 max-[720px]:px-4">
          <p className="num text-[14px] text-ink-3">
            Showing {rows.length.toLocaleString("en")} of {plural(total, showInvalid ? "invalid row" : "row", showInvalid ? "invalid rows" : "rows")}
          </p>
          {invalid.length > 0 && (
            <Button variant="outline" size="sm" aria-pressed={onlyInvalid} onClick={() => setOnlyInvalid((v) => !v)}>
              {invalid.length === 1 ? "Show only the invalid row" : `Show only the ${plural(invalid.length, "invalid row", "invalid rows")}`}
            </Button>
          )}
        </div>
      </section>

      <section aria-labelledby="fields-h" className={cn(card, "grid gap-4 p-6 max-[720px]:p-4")}>
        <h2 id="fields-h" className={cardTitle}>
          Fields
        </h2>
        <ul className="grid gap-2 text-[15px]">
          <li className="flex items-start gap-2 text-pos">
            <Check aria-hidden="true" className="mt-0.5 size-[17px] flex-none" strokeWidth={2} />
            <span>
              <code>{key}</code> column found
            </span>
          </li>
          {invalid.length > 0 && (
            <li className="flex items-start gap-2 text-neg">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-[17px] flex-none" strokeWidth={1.8} />
              <span>
                {invalid.length === 1
                  ? "1 row has an invalid or blank email. It's skipped when sending."
                  : `${plural(invalid.length, "row", "rows")} have an invalid or blank email. They're skipped when sending.`}
              </span>
            </li>
          )}
        </ul>
        <div>
          <p className="mb-2.5 text-[14.5px] text-ink-2">Use these in your message:</p>
          <ul className="flex flex-wrap gap-2" aria-label="Fields from the file">
            {csv.headers.map((h) => {
              const usable = isUsableField(h);
              return (
                <li
                  key={h}
                  translate="no"
                  title={usable ? undefined : UNUSABLE_FIELD_TITLE}
                  className={cn(chip, !usable && "text-ink-3 line-through opacity-70")}
                >
                  <span aria-hidden="true" className="opacity-50">{"{{"}</span>
                  {h}
                  <span aria-hidden="true" className="opacity-50">{"}}"}</span>
                  {!usable && <span className="sr-only"> (can't be used as a field: {UNUSABLE_FIELD_TITLE.toLowerCase()})</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
