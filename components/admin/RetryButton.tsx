"use client";

import { useState, useTransition } from "react";
import { retrySend } from "@/app/admin/actions/enquiries";

export function RetryButton({ id, label = "Retry send" }: { id?: string; label?: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="a-inline">
      <button
        type="button"
        className="a-btn ghost small"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await retrySend(id);
            setMsg(
              r.failed
                ? `Still couldn’t send ${r.failed}. Check Settings → Send test email.`
                : `Sent ${r.sent}.`,
            );
          })
        }
      >
        {pending ? "Sending…" : label}
      </button>
      <span role="status" className="a-hint">
        {msg}
      </span>
    </span>
  );
}
