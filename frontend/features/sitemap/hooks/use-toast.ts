"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ToastMessage } from "../types";

const TOAST_DURATION_MS = 3500;
const TOAST_EXIT_MS = 180;

export type ActiveToast = ToastMessage & { id: number };

export function useToast() {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const displayTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const nextId = useRef(0);

  const dismissToast = useCallback(() => {
    if (displayTimer.current) {
      window.clearTimeout(displayTimer.current);
      displayTimer.current = null;
    }
    if (closeTimer.current) {
      return;
    }

    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setToast(null);
      setIsClosing(false);
      closeTimer.current = null;
    }, TOAST_EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message: ToastMessage) => {
      if (displayTimer.current) {
        window.clearTimeout(displayTimer.current);
      }
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }

      nextId.current += 1;
      setIsClosing(false);
      setToast({ ...message, id: nextId.current });
      displayTimer.current = window.setTimeout(
        dismissToast,
        TOAST_DURATION_MS,
      );
    },
    [dismissToast],
  );

  useEffect(() => {
    return () => {
      if (displayTimer.current) {
        window.clearTimeout(displayTimer.current);
      }
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  return { toast, isClosing, showToast, dismissToast };
}
