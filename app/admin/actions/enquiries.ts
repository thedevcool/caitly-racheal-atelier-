"use server";

import { revalidatePath } from "next/cache";
import { EnquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { sendEnquiryNotification } from "@/lib/mail";

export async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  await requireAdmin();
  if (!Object.values(EnquiryStatus).includes(status)) throw new Error("Bad status");
  await db.enquiry.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

/** Dashboard "Retry send" for notifications that failed. */
export async function retrySend(id?: string) {
  await requireAdmin();
  const list = await db.enquiry.findMany({ where: { emailSent: false, ...(id ? { id } : {}) }, take: 20 });
  let sent = 0;
  for (const e of list) if (await sendEnquiryNotification(e)) sent++;
  revalidatePath("/admin", "layout");
  return { sent, failed: list.length - sent };
}
