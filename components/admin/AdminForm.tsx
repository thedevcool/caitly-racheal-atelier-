"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import type { ActionResult } from "@/lib/admin";

type Action = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;

const ErrorsContext = createContext<Record<string, string>>({});
export const useFieldError = (name: string) => useContext(ErrorsContext)[name];

type Props = {
  action: Action;
  children: ReactNode;
  submitLabel?: string;
  /** Adds a Preview button that opens the public page with these unsaved changes in a new tab */
  preview?: "content" | "room";
  className?: string;
  /** Called after a successful save (e.g. to close an inline editor) */
  onSaved?: (r: ActionResult) => void;
};

/**
 * Every admin editor: inline validation from the server, a sticky save bar,
 * and an announced result. Changes go live on save.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Save changes",
  preview,
  className,
  onSaved,
}: Props) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) onSaved?.(state);
    else if (state.errors) {
      const first = Object.keys(state.errors)[0];
      ref.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Submit by hand instead of <form action>: React resets a form after its
  // action runs, which would wipe unsaved edits whenever validation fails.
  // The Preview button is left alone: it posts natively to a new tab.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter?.getAttribute("name") === "previewKind") return;
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  return (
    <ErrorsContext.Provider value={state?.errors ?? {}}>
      <form ref={ref} onSubmit={onSubmit} className={className ?? "a-form"} noValidate>
        {children}
        <div className="a-savebar">
          <p
            className={state?.ok === false ? "a-status is-error" : "a-status"}
            role="status"
            aria-live="polite"
          >
            {pending ? "Saving…" : state?.message}
          </p>
          <div className="a-savebar-actions">
            {preview && (
              <button
                type="submit"
                name="previewKind"
                value={preview}
                formAction="/api/admin/preview"
                formMethod="post"
                formTarget="_blank"
                className="a-btn ghost"
              >
                Preview
              </button>
            )}
            <button type="submit" className="a-btn primary" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </ErrorsContext.Provider>
  );
}
