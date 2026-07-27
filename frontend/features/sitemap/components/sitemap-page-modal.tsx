"use client";

import { Loader2, Pencil, Plus, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { useAnimatedDialog } from "../hooks/use-animated-dialog";
import { useDialogKeyboard } from "../hooks/use-dialog-keyboard";
import {
  EMPTY_SITEMAP_PAGE,
  SITEMAP_PAGE_FIELDS,
  type SitemapFormMode,
  type SitemapPage,
  type SitemapPageInput,
} from "../types";

type SitemapPageModalProps = {
  mode: SitemapFormMode;
  page?: SitemapPage;
  onClose: () => void;
  onSubmit: (values: SitemapPageInput) => Promise<void>;
};

const modeCopy: Record<
  SitemapFormMode,
  { title: string; description: string }
> = {
  create: {
    title: "Add sitemap page",
    description: "Add a screen to the SCA sitemap.",
  },
  view: {
    title: "Page details",
    description: "Review the complete sitemap record.",
  },
  edit: {
    title: "Edit sitemap page",
    description: "Update the selected sitemap record.",
  },
};

function getInitialValues(page?: SitemapPage): SitemapPageInput {
  if (!page) {
    return EMPTY_SITEMAP_PAGE;
  }

  return {
    alpha: page.alpha,
    screen_number: page.screen_number,
    screen_type: page.screen_type,
    screen_description: page.screen_description,
    file_label: page.file_label,
    screen_label: page.screen_label,
    notes: page.notes,
    page_location: page.page_location,
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SitemapPageModal({
  mode,
  page,
  onClose,
  onSubmit,
}: SitemapPageModalProps) {
  const [values, setValues] = useState<SitemapPageInput>(() =>
    getInitialValues(page),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof SitemapPageInput, string>>
  >({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isReadOnly = mode === "view";
  const { completeClose, isClosing, requestClose } = useAnimatedDialog(
    onClose,
    isSubmitting,
  );

  useDialogKeyboard(dialogRef, requestClose);

  function updateField(name: keyof SitemapPageInput, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    ) as SitemapPageInput;
    const nextErrors: Partial<Record<keyof SitemapPageInput, string>> = {};

    SITEMAP_PAGE_FIELDS.forEach((field) => {
      if (!normalized[field.name]) {
        nextErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await onSubmit(normalized);
      completeClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save this page.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-70 grid place-items-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[2px] ${
        isClosing
          ? "animate-dialog-backdrop-out"
          : "animate-dialog-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isSubmitting) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sitemap-page-modal-title"
        className={`my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
          isClosing ? "animate-dialog-out" : "animate-dialog-in"
        }`}
      >
        <ModalHeader
          mode={mode}
          onClose={requestClose}
          isSubmitting={isSubmitting}
        />

        {isReadOnly && page ? (
          <PageDetails page={page} />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid max-h-[68vh] gap-x-5 gap-y-4 overflow-y-auto px-5 py-6 sm:grid-cols-2 sm:px-7">
              {SITEMAP_PAGE_FIELDS.map((field) => {
                const commonClasses = `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 ${
                  errors[field.name] ? "border-red-400" : "border-slate-300"
                }`;

                return (
                  <label
                    key={field.name}
                    className={`block ${
                      field.multiline ? "sm:col-span-2" : ""
                    }`}
                  >
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                      {field.label}
                      <span className="ml-1 text-red-500">*</span>
                    </span>
                    {field.multiline ? (
                      <textarea
                        value={values[field.name]}
                        onChange={(event) =>
                          updateField(field.name, event.target.value)
                        }
                        placeholder={field.placeholder}
                        rows={3}
                        className={`${commonClasses} resize-none`}
                      />
                    ) : (
                      <input
                        value={values[field.name]}
                        onChange={(event) =>
                          updateField(field.name, event.target.value)
                        }
                        placeholder={field.placeholder}
                        className={commonClasses}
                      />
                    )}
                    {errors[field.name] ? (
                      <span className="mt-1 block text-xs font-medium text-red-600">
                        {errors[field.name]}
                      </span>
                    ) : null}
                  </label>
                );
              })}

              {submitError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2"
                >
                  {submitError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={requestClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : mode === "create" ? (
                  <Plus className="size-4" />
                ) : (
                  <Pencil className="size-4" />
                )}
                {isSubmitting
                  ? "Saving..."
                  : mode === "create"
                    ? "Add page"
                    : "Save changes"}
              </button>
            </div>
          </form>
        )}

        {isReadOnly ? (
          <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={requestClose}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModalHeader({
  mode,
  onClose,
  isSubmitting,
}: {
  mode: SitemapFormMode;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5">
      <div className="flex gap-3">
        <div className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          {mode === "create" ? (
            <Plus className="size-5" />
          ) : (
            <Pencil className="size-5" />
          )}
        </div>
        <div>
          <h2
            id="sitemap-page-modal-title"
            className="text-lg font-bold tracking-[-0.01em] text-slate-950"
          >
            {modeCopy[mode].title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {modeCopy[mode].description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
        aria-label="Close dialog"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function PageDetails({ page }: { page: SitemapPage }) {
  return (
    <div className="grid max-h-[68vh] gap-x-8 gap-y-6 overflow-y-auto px-5 py-6 sm:grid-cols-2 sm:px-7">
      {SITEMAP_PAGE_FIELDS.map((field) => (
        <div
          key={field.name}
          className={field.multiline ? "sm:col-span-2" : ""}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            {field.label}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm font-medium text-slate-800">
            {page[field.name]}
          </p>
        </div>
      ))}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          Created
        </p>
        <p className="mt-1.5 text-sm font-medium text-slate-800">
          {formatDate(page.created_at)}
        </p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          Last updated
        </p>
        <p className="mt-1.5 text-sm font-medium text-slate-800">
          {formatDate(page.updated_at)}
        </p>
      </div>
    </div>
  );
}
