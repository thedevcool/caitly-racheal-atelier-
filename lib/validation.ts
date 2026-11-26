import { z } from "zod";
import { MESSAGES, RULES, type FieldErrors } from "./rules";

export type { FieldErrors } from "./rules";

/** Contact form (brief §7.1). Room is checked against the database separately. */
export const enquirySchema = z.object({
  name: z.string().trim().min(RULES.name.min, MESSAGES.nameShort).max(RULES.name.max, MESSAGES.nameLong),
  email: z.string().trim().max(RULES.emailMax, MESSAGES.email).email(MESSAGES.email),
  room: z.string().trim().min(1, MESSAGES.room),
  budget: z.string().trim().max(RULES.budgetMax).optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(RULES.message.min, MESSAGES.messageShort)
    .max(RULES.message.max, MESSAGES.messageLong),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof FieldErrors;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
