"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Drives a native <dialog> as a modal: top layer, focus trap, Esc and an inert
 * page come free. Locks page scroll (and tells Lenis to stop via data-lock)
 * and returns focus to whatever opened it.
 */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      document.documentElement.dataset.lock = "true";
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      delete document.documentElement.dataset.lock;
      opener.current?.focus?.();
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [onClose]);

  // Never leave the page locked if the component unmounts while open
  useEffect(() => () => void delete document.documentElement.dataset.lock, []);

  const close = useCallback(() => ref.current?.close(), []);
  return { ref, close };
}
