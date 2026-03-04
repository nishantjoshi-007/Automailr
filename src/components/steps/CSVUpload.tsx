import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { parseCSV, downloadSampleCSV, type CSVData } from "@/utils/csvParser";

interface CSVUploadProps {
  csvData: CSVData | null;
  onCSVParsed: (data: CSVData) => void;
}

export function CSVUpload({ csvData, onCSVParsed }: CSVUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setWarning(null);
      const result = await parseCSV(file);
      if (result.success && result.data) {
        onCSVParsed(result.data);
        // Show warning about invalid emails (if any) without blocking
        if (result.error) setWarning(result.error);
      } else {
        setError(result.error || "Failed to parse CSV.");
      }
    },
    [onCSVParsed],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      // Validate file type: only accept CSV files
      const isCSV = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
      if (!isCSV) {
        setError("Please upload a CSV file (.csv).");
        return;
      }
      handleFile(file);
    },
    [handleFile],
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so re-uploading the same file triggers onChange
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Upload Your Contact List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("csv-input")?.click()}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop your CSV file here, or <span className="text-primary font-medium">browse</span>
            </p>
            <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={onFileInput} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {warning && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {warning}
            </div>
          )}

          <Button variant="ghost" onClick={downloadSampleCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Download Sample CSV
          </Button>
        </CardContent>
      </Card>

      {csvData && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Preview & Placeholders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <div className="flex flex-wrap gap-2">
              {csvData.headers.map((h) => (
                <Badge key={h} variant="secondary" className="font-mono text-xs">
                  {`{{${h}}}`}
                </Badge>
              ))}
            </div> */}

            <div className="max-h-64 overflow-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData.headers.map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.rows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      {csvData.headers.map((h) => (
                        <TableCell key={h}>{row[h]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing first {Math.min(5, csvData.rows.length)} of {csvData.rows.length} rows
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
