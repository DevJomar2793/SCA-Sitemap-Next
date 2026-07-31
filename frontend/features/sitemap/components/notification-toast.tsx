"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

import type { ActiveToast } from "../hooks/use-toast";

type NotificationToastProps = {
  toast: ActiveToast;
  isClosing: boolean;
  onDismiss: () => void;
};

export function NotificationToast({
  toast,
  isClosing,
  onDismiss,
}: NotificationToastProps) {
  const isSuccess = toast.type === "success";

  return (
    <div
      key={toast.id}
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={`fixed left-4 right-4 top-4 z-100 overflow-hidden rounded-2xl border bg-white shadow-[0_18px_48px_-16px_rgba(15,23,42,0.35)] sm:left-auto sm:right-6 sm:top-6 sm:w-95 ${
        isClosing ? "animate-toast-out" : "animate-toast-in"
      } ${isSuccess ? "border-emerald-200/90" : "border-red-200/90"}`}
    >
      <div className="flex items-start gap-3.5 p-4">
        <div
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
            isSuccess
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <AlertCircle className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold text-slate-950">
            {isSuccess ? "Success" : "Something went wrong"}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {toast.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="h-1 bg-slate-100">
        <div
          className={`h-full animate-toast-progress ${
            isSuccess ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
      </div>
    </div>
  );
}
