import { useCallback, useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, Upload, X, FileIcon, ImageIcon, FileText } from "lucide-react";

interface AttachmentsProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-primary" />;
  if (type.includes("pdf")) return <FileText className="h-5 w-5 text-destructive" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
}

export function Attachments({ files, onFilesChange }: AttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Revoke the previous object URL whenever a new one is created, and on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25 MB Gmail limit

  const addFiles = useCallback(
    (newFiles: FileList) => {
      const incoming = Array.from(newFiles);
      const all = [...files, ...incoming];
      const totalSize = all.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        setSizeWarning(
          `Total attachment size (${formatSize(totalSize)}) exceeds Gmail's 25 MB limit. Remove some files before sending.`,
        );
      } else {
        setSizeWarning(null);
      }
      onFilesChange(all);
    },
    [files, onFilesChange],
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = files.filter((_, i) => i !== index);
      const totalSize = updated.reduce((sum, f) => sum + f.size, 0);
      if (totalSize <= MAX_TOTAL_SIZE) setSizeWarning(null);
      onFilesChange(updated);
    },
    [files, onFilesChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            Attach Files
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
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("attach-input")?.click()}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop files, or <span className="text-primary font-medium">browse</span>
            </p>
            <input
              id="attach-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => {
                      if (file.type.startsWith("image/")) {
                        // Revoke old URL before creating a new one
                        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
                        const url = URL.createObjectURL(file);
                        prevUrlRef.current = url;
                        setPreviewUrl(url);
                      }
                    }}
                  >
                    {getFileIcon(file.type)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {sizeWarning && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {sizeWarning}
            </div>
          )}

          {files.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No files attached yet. This step is optional.</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!previewUrl}
        onOpenChange={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && <img src={previewUrl} alt="preview" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
