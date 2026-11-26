"use client";

import { useTransition } from "react";
import type { EnquiryStatus } from "@prisma/client";
import { setEnquiryStatus } from "@/app/admin/actions/enquiries";

export function EnquiryActions({ id, status }: { id: string; status: EnquiryStatus }) {
  const [pending, start] = useTransition();
  const set = (s: EnquiryStatus) => start(() => setEnquiryStatus(id, s));
  return (
    <>
      {status !== "REPLIED" && (
        <button type="button" className="a-btn ghost" disabled={pending} onClick={() => set("REPLIED")}>
          Mark as replied
        </button>
      )}
      {status !== "ARCHIVED" ? (
        <button type="button" className="a-btn ghost" disabled={pending} onClick={() => set("ARCHIVED")}>
          Archive
        </button>
      ) : (
        <button type="button" className="a-btn ghost" disabled={pending} onClick={() => set("READ")}>
          Move back to inbox
        </button>
      )}
    </>
  );
}
