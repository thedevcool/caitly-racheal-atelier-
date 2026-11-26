/**
 * Contact-form rules and messages, shared by the server's Zod schema
 * (lib/validation.ts) and the browser's instant check. Kept free of Zod so the
 * client bundle stays small.
 */
export const RULES = {
  name: { min: 2, max: 80 },
  message: { min: 10, max: 4000 },
  emailMax: 254,
  budgetMax: 80,
} as const;

export const MESSAGES = {
  nameShort: "Please tell me your name.",
  nameLong: "That name is a little long. 80 characters at most, please.",
  email: "That email doesn’t look quite right.",
  room: "Please choose what you need.",
  messageShort: "A sentence or two about the piece, please.",
  messageLong: "That’s a lot to read! 4,000 characters at most, please.",
} as const;

export type Field = "name" | "email" | "room" | "budget" | "message";
export type FieldErrors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Fast browser-side check. The server re-validates everything with Zod. */
export function quickCheck(v: Record<string, unknown>): FieldErrors {
  const s = (k: string) => String(v[k] ?? "").trim();
  const e: FieldErrors = {};
  if (s("name").length < RULES.name.min) e.name = MESSAGES.nameShort;
  else if (s("name").length > RULES.name.max) e.name = MESSAGES.nameLong;
  if (!EMAIL.test(s("email")) || s("email").length > RULES.emailMax) e.email = MESSAGES.email;
  if (!s("room")) e.room = MESSAGES.room;
  if (s("message").length < RULES.message.min) e.message = MESSAGES.messageShort;
  else if (s("message").length > RULES.message.max) e.message = MESSAGES.messageLong;
  return e;
}
