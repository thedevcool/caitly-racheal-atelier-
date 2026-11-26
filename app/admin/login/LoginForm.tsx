"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  // Submitted by hand so a wrong password doesn't clear the email field
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
  return (
    <form onSubmit={onSubmit} className="a-login-form">
      <div className="a-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div className="a-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>
      {error && (
        <p className="a-error" id="login-error" role="alert">
          {error}
        </p>
      )}
      <button className="a-btn primary" type="submit" disabled={pending}>
        {pending ? "Opening…" : "Enter the atelier"}
      </button>
    </form>
  );
}
