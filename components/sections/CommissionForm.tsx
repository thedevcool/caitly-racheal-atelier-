"use client";

import Script from "next/script";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { getFormToken, submitEnquiry, type EnquiryState } from "@/app/actions/enquiry";
import { quickCheck, type FieldErrors } from "@/lib/rules";
import { GoldBurst } from "./GoldBurst";

type Props = {
  services: { slug: string; service: string }[];
  buttonLabel: string;
  turnstileSiteKey?: string;
};

/**
 * The commission form. Validates instantly in the browser with the same Zod
 * schema the server uses, then submits to the Server Action. Errors shake the
 * field and are announced; success turns the card to the thank-you side.
 */
export function CommissionForm({ services, buttonLabel, turnstileSiteKey }: Props) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(submitEnquiry, { status: "idle" });
  const [token, setToken] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [attempt, setAttempt] = useState(0); // re-triggers the shake
  const [serverRound, setServerRound] = useState(0); // remounts fields with the server's echoed values
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLDivElement>(null);
  const sent = state.status === "sent";

  useEffect(() => {
    getFormToken()
      .then(setToken)
      .catch(() => {});
  }, []);

  const serverErrors = state.status === "error" ? (state.errors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  const values = state.status === "error" ? (state.values ?? {}) : {};

  useEffect(() => {
    if (state.status === "error") {
      setServerRound((n) => n + 1);
      setAttempt((n) => n + 1);
    }
    if (sent) {
      navigator.vibrate?.(10);
      thanksRef.current?.focus();
    }
  }, [state, sent]);

  // Move focus to the first problem so keyboard and screen reader users land on it
  useEffect(() => {
    const first = Object.keys(errors)[0];
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const found = quickCheck(Object.fromEntries(new FormData(e.currentTarget)));
    if (Object.keys(found).length) {
      e.preventDefault();
      setClientErrors(found);
      setAttempt((n) => n + 1);
      return;
    }
    setClientErrors({});
  }

  const field = (name: keyof FieldErrors) => ({
    name,
    "aria-invalid": !!errors[name] || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    onInput: () => errors[name] && setClientErrors((c) => ({ ...c, [name]: undefined })),
  });
  const err = (name: keyof FieldErrors) =>
    errors[name] ? (
      <p className="error" id={`${name}-error`}>
        {errors[name]}
      </p>
    ) : null;
  const shake = (name: keyof FieldErrors) => (errors[name] ? `field shake-${attempt % 2}` : "field");

  return (
    <div className={sent ? "brief-card is-sent" : "brief-card"}>
      <form
        ref={formRef}
        className="brief brief-front"
        action={action}
        onSubmit={onSubmit}
        noValidate
        aria-label="Commission enquiry"
        aria-hidden={sent || undefined}
        inert={sent || undefined}
        key={`round-${serverRound}`}
      >
        <div className="fields">
          <div className={shake("name")}>
            <input
              id="f-name"
              placeholder=" "
              autoComplete="name"
              required
              defaultValue={values.name}
              {...field("name")}
            />
            <label htmlFor="f-name">Your name</label>
            <span className="underline" aria-hidden="true" />
            {err("name")}
          </div>
          <div className={shake("email")}>
            <input
              id="f-email"
              type="email"
              placeholder=" "
              autoComplete="email"
              inputMode="email"
              required
              defaultValue={values.email}
              {...field("email")}
            />
            <label htmlFor="f-email">Email</label>
            <span className="underline" aria-hidden="true" />
            {err("email")}
          </div>
          <div className={`${shake("room")} is-select`}>
            <select id="f-room" defaultValue={values.room || services[0]?.slug} {...field("room")}>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.service}
                </option>
              ))}
            </select>
            <label htmlFor="f-room">What do you need?</label>
            <span className="underline" aria-hidden="true" />
            {err("room")}
          </div>
          <div className={shake("message")}>
            <textarea
              id="f-message"
              placeholder="What are you making, who is it for, and when do you need it?"
              defaultValue={values.message}
              {...field("message")}
            />
            <label htmlFor="f-message">Tell me about the piece</label>
            <span className="underline" aria-hidden="true" />
            {err("message")}
          </div>

          {/* Honeypot: hidden from people, tempting to bots */}
          <div className="hp" aria-hidden="true">
            <label>
              Leave this empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <input type="hidden" name="t" value={token} />

          {turnstileSiteKey && (
            <>
              <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div className="cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="auto" />
            </>
          )}

          {state.status === "error" && state.message && (
            <p className="form-message" role="alert">
              {state.message}
            </p>
          )}
          <button
            className={pending ? "btn gold is-sending" : "btn gold"}
            type="submit"
            disabled={pending || !token}
          >
            {pending ? "Sending…" : buttonLabel}
          </button>
        </div>
      </form>

      <div className="brief brief-back" role="status" tabIndex={-1} ref={thanksRef} aria-hidden={!sent}>
        <GoldBurst fire={sent} />
        {sent && (
          <>
            <p className="thanks-ko ko" lang="ko">
              감사합니다
            </p>
            <p className="thanks-title serif">Your brief is on its way.</p>
            <p className="thanks-body">I reply within two working days with ideas and next steps.</p>
          </>
        )}
      </div>
    </div>
  );
}
