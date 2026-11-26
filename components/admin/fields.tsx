"use client";

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { useFieldError } from "./AdminForm";

type Base = { label: string; name: string; hint?: ReactNode };

function Wrap({
  label,
  hint,
  error,
  id,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className={error ? "a-field has-error" : "a-field"}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p className="a-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="a-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, hint?: ReactNode, error?: string) =>
  [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

export function TextField({ label, name, hint, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <Wrap label={label} hint={hint} error={error} id={id}>
      <input
        id={id}
        name={name}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
      />
    </Wrap>
  );
}

export function TextArea({
  label,
  name,
  hint,
  maxLength,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  const error = useFieldError(name);
  const [len, setLen] = useState(String(rest.defaultValue ?? "").length);
  return (
    <Wrap
      label={label}
      hint={
        maxLength ? (
          <>
            {hint}{" "}
            <span className="a-count">
              {len} / {maxLength}
            </span>
          </>
        ) : (
          hint
        )
      }
      error={error}
      id={id}
    >
      <textarea
        id={id}
        name={name}
        maxLength={maxLength}
        onInput={(e) => setLen(e.currentTarget.value.length)}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, hint || maxLength, error)}
        {...rest}
      />
    </Wrap>
  );
}

export function Select({
  label,
  name,
  hint,
  options,
  defaultValue,
}: Base & { options: { value: string; label: string }[]; defaultValue?: string }) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <Wrap label={label} hint={hint} error={error} id={id}>
      <select id={id} name={name} defaultValue={defaultValue} aria-describedby={describedBy(id, hint, error)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function Toggle({ label, name, hint, defaultChecked }: Base & { defaultChecked?: boolean }) {
  const id = useId();
  return (
    <div className="a-toggle">
      <input
        type="checkbox"
        id={id}
        name={name}
        defaultChecked={defaultChecked}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <label htmlFor={id}>
        <span className="a-switch" aria-hidden="true" />
        {label}
      </label>
      {hint && (
        <p className="a-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** Group of fields with a heading */
export function Fieldset({
  legend,
  children,
  note,
}: {
  legend: string;
  children: ReactNode;
  note?: ReactNode;
}) {
  return (
    <fieldset className="a-fieldset">
      <legend>{legend}</legend>
      {note && <p className="a-hint">{note}</p>}
      {children}
    </fieldset>
  );
}
