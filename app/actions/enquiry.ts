"use server";

import { db } from "@/lib/db";
import { checkFormToken, issueFormToken } from "@/lib/formToken";
import { sendEnquiryNotification } from "@/lib/mail";
import { clientIp } from "@/lib/request";
import { hashIp } from "@/lib/secret";
import { verifyTurnstile } from "@/lib/turnstile";
import { enquirySchema, fieldErrors, type FieldErrors } from "@/lib/validation";

export type EnquiryState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message?: string; errors?: FieldErrors; values?: Record<string, string> };

const RATE_LIMIT = 5; // per IP per hour (brief §7.2)

/** Hands the form a fresh signed timestamp when it mounts. */
export async function getFormToken() {
  return issueFormToken();
}

export async function submitEnquiry(_prev: EnquiryState, form: FormData): Promise<EnquiryState> {
  const raw = Object.fromEntries(
    ["name", "email", "room", "budget", "message"].map((k) => [k, String(form.get(k) ?? "")]),
  );
  const keep = (extra: Omit<Extract<EnquiryState, { status: "error" }>, "status" | "values">) => ({
    status: "error" as const,
    values: raw,
    ...extra,
  });

  // 1. Honeypot: bots fill the hidden field. Pretend it worked; save nothing.
  if (String(form.get("website") ?? "") !== "") return { status: "sent" };

  // 2. Minimum fill time, via the signed token
  const token = checkFormToken(form.get("t"));
  if (token === "too-fast")
    return keep({ message: "That was quick! Please take a moment, then send again." });
  if (token !== "ok")
    return keep({ message: "This form timed out. Please refresh the page and send again." });

  // 3. Validate
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) return keep({ errors: fieldErrors(parsed.error) });
  const data = parsed.data;
  const room = await db.room.findFirst({ where: { slug: data.room, visible: true }, select: { slug: true } });
  if (!room) return keep({ errors: { room: "Please choose what you need." } });

  // 4. Optional Turnstile, then the rate limit on a hash of the IP
  const ip = await clientIp();
  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), ip))) {
    return keep({ message: "Please complete the quick check below the form, then send again." });
  }
  const ipHash = hashIp(ip);
  const recent = await db.enquiry.count({
    where: { ipHash, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= RATE_LIMIT) {
    return keep({ message: "You’ve sent several briefs in the last hour. Please try again a little later." });
  }

  // 5. Save first, so nothing is lost if email fails
  const enquiry = await db.enquiry.create({
    data: {
      name: data.name,
      email: data.email,
      room: room.slug,
      budget: data.budget || null,
      message: data.message,
      ipHash,
    },
  });

  // 6. Email her inbox. Failures are logged and shown in the admin, never to the visitor.
  await sendEnquiryNotification(enquiry);
  return { status: "sent" };
}
