"use client";

/** A submit button that asks first. */
export function ConfirmSubmit({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <button type="submit" className="a-btn danger" onClick={(e) => !confirm(message) && e.preventDefault()}>
      {children}
    </button>
  );
}
