"use client";

import { useState, type FormEvent } from "react";

type Props = { services: { slug: string; service: string }[]; buttonLabel: string };

/**
 * Phase 1: validates in the browser and shows the thank-you state, like the
 * approved preview. Phase 3 swaps the submit handler for the Server Action
 * (Zod, honeypot, fill-time, rate limit, save, email).
 */
export function CommissionForm({ services, buttonLabel }: Props) {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (name.length < 2) next.name = "Please tell me your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "That email doesn’t look quite right.";
    if (message.length < 10) next.message = "A sentence or two about the piece, please.";
    setErrors(next);
    if (Object.keys(next).length) {
      const first = e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`);
      first?.focus();
      return;
    }
    setSent(true);
  }

  const err = (k: string) =>
    errors[k] ? (
      <p className="error" id={`${k}-error`}>
        {errors[k]}
      </p>
    ) : null;

  return (
    <form className="brief" onSubmit={onSubmit} noValidate aria-label="Commission enquiry">
      {sent ? (
        <div role="status" style={{ padding: "28px 0" }}>
          <p className="serif" style={{ fontSize: 36, lineHeight: 1.1, margin: "0 0 10px" }}>
            <span lang="ko">감사합니다.</span> Your brief is ready.
          </p>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            This preview doesn’t send messages yet. On the live site this form will go straight to Caitly’s
            inbox.
          </p>
        </div>
      ) : (
        <div className="fields">
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {err("name")}
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {err("email")}
          </label>
          <label>
            What do you need?
            <select name="room" defaultValue={services[0]?.slug}>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.service}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tell me about the piece
            <textarea
              name="message"
              placeholder="What are you making, who is it for, and when do you need it?"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {err("message")}
          </label>
          {/* Honeypot: hidden from people, tempting to bots. Checked server-side in phase 3. */}
          <div className="hp" aria-hidden="true">
            <label>
              Leave this empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <button className="btn gold" type="submit">
            {buttonLabel}
          </button>
        </div>
      )}
    </form>
  );
}
