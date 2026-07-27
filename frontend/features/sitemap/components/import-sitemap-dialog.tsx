"use client";

import {
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";

import { useAnimatedDialog } from "../hooks/use-animated-dialog";
import { useDialogKeyboard } from "../hooks/use-dialog-keyboard";
import type { SitemapImportResult } from "../types";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type ImportSitemapDialogProps = {
  existingCount: number;
  onClose: () => void;
  onImport: (file: File) => Promise<SitemapImportResult>;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportSitemapDialog({
  existingCount,
  onClose,
  onImport,
}: ImportSitemapDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { completeClose, isClosing, requestClose } = useAnimatedDialog(
    onClose,
    isImporting,
  );

  useDialogKeyboard(dialogRef, requestClose);

  function selectFile(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setSelectedFile(null);
      setError("Only .xlsx Excel files are supported.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setSelectedFile(null);
      setError("The Excel file must be 10 MB or smaller.");
      return;
    }

    setSelectedFile(file);
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Choose an Excel workbook before importing.");
      return;
    }

    setIsImporting(true);
    setError("");
    try {
      await onImport(selectedFile);
      completeClose();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Unable to import this workbook.",
      );
      setIsImporting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-80 grid place-items-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px] ${
        isClosing
          ? "animate-dialog-backdrop-out"
          : "animate-dialog-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isImporting) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-sitemap-title"
        className={`my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
          isClosing ? "animate-dialog-out" : "animate-dialog-in"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2
                id="import-sitemap-title"
                className="text-lg font-bold text-slate-950"
              >
                Import Excel workbook
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Load sitemap screens from normalized detail worksheets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={isImporting}
            className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleImport}>
          <div className="space-y-4 px-5 py-6 sm:px-6">
            <div
              className={`rounded-xl border px-4 py-3 ${
                existingCount > 0
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p className="text-sm leading-5">
                  Importing will replace{" "}
                  <strong className="font-semibold">
                    {existingCount} existing{" "}
                    {existingCount === 1 ? "record" : "records"}
                  </strong>
                  . The table changes only after the entire workbook passes
                  validation.
                </p>
              </div>
            </div>

            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50/70 hover:border-blue-400 hover:bg-blue-50/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept={`.xlsx,${EXCEL_MIME_TYPE}`}
                onChange={(event) => selectFile(event.target.files?.[0])}
                className="sr-only"
              />
              <div className="mx-auto grid size-12 place-items-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                <Upload className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Drop your Excel file here
              </p>
              <p className="mt-1 text-xs text-slate-500">
                .xlsx only, up to 10 MB
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isImporting}
                className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Choose file
              </button>
            </div>

            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <FileSpreadsheet className="size-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (inputRef.current) {
                      inputRef.current.value = "";
                    }
                  }}
                  disabled={isImporting}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-50"
                  aria-label="Remove selected file"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={requestClose}
              disabled={isImporting}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isImporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isImporting ? "Importing..." : "Import and replace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
