"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DIALOG_ANIMATION_MS = 200;

export function useAnimatedDialog(
  onClose: () => void,
  isCloseBlocked: boolean,
) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const isCloseBlockedRef = useRef(isCloseBlocked);

  useEffect(() => {
    onCloseRef.current = onClose;
    isCloseBlockedRef.current = isCloseBlocked;
  }, [isCloseBlocked, onClose]);

  const completeClose = useCallback(() => {
    if (closeTimer.current) {
      return;
    }

    setIsClosing(true);
    closeTimer.current = window.setTimeout(() => {
      onCloseRef.current();
    }, DIALOG_ANIMATION_MS);
  }, []);

  const requestClose = useCallback(() => {
    if (!isCloseBlockedRef.current) {
      completeClose();
    }
  }, [completeClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  return { completeClose, isClosing, requestClose };
}
