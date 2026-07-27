"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

import { useAnimatedDialog } from "../hooks/use-animated-dialog";
import { useDialogKeyboard } from "../hooks/use-dialog-keyboard";
import type { SitemapPage } from "../types";

type DeleteSitemapDialogProps = {
  page: SitemapPage;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteSitemapDialog({
  page,
  onClose,
  onConfirm,
}: DeleteSitemapDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const { completeClose, isClosing, requestClose } = useAnimatedDialog(
    onClose,
    isDeleting,
  );

  useDialogKeyboard(dialogRef, requestClose);

  async function confirmDelete() {
    setIsDeleting(true);
    setError("");

    try {
      await onConfirm();
      completeClose();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this page.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-80 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px] ${
        isClosing
          ? "animate-dialog-backdrop-out"
          : "animate-dialog-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isDeleting) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl ${
          isClosing ? "animate-dialog-out" : "animate-dialog-in"
        }`}
      >
        <div className="grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="size-6" />
        </div>
        <h2
          id="delete-dialog-title"
          className="mt-4 text-lg font-bold text-slate-950"
        >
          Delete sitemap page?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          You are about to delete{" "}
          <strong className="font-semibold text-slate-900">
            {page.screen_label}
          </strong>
          . This action cannot be undone.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={requestClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
            {isDeleting ? "Deleting..." : "Delete page"}
          </button>
        </div>
      </div>
    </div>
  );
}
