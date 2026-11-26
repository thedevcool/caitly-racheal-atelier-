import { EnquiryStatus } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** CSV export of enquiries (brief §8). Cells are guarded against spreadsheet formula injection. */
export async function GET(request: Request) {
  if (!(await auth())?.user) return new Response("Not signed in", { status: 401 });
  const status = new URL(request.url).searchParams.get("status");
  const where = (Object.values(EnquiryStatus) as string[]).includes(status ?? "")
    ? { status: status as EnquiryStatus }
    : {};
  const rows = await db.enquiry.findMany({ where, orderBy: { createdAt: "desc" } });
  const cell = (v: unknown) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop Excel/Sheets running it as a formula
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["Date", "Name", "Email", "Room", "Budget", "Message", "Status", "Email sent"];
  const csv = [
    header.map(cell).join(","),
    ...rows.map((r) =>
      [
        r.createdAt.toISOString(),
        r.name,
        r.email,
        r.room,
        r.budget,
        r.message,
        r.status,
        r.emailSent ? "yes" : "no",
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
