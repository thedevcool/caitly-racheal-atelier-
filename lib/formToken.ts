import "server-only";
import { hmac, safeEqual } from "./secret";

/**
 * Signed timestamp handed to the contact form when it mounts. On submit we
 * check the signature and that at least MIN_MS passed (bots fill instantly).
 * Visitors without JavaScript never get a token, which also stops naive bots.
 */
export const MIN_FILL_MS = 3000;
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export function issueFormToken(now = Date.now()) {
  const ts = String(now);
  return `${ts}.${hmac(`form:${ts}`)}`;
}

export type TokenCheck = "ok" | "invalid" | "too-fast" | "expired";

export function checkFormToken(token: unknown, now = Date.now()): TokenCheck {
  if (typeof token !== "string") return "invalid";
  const [ts, sig] = token.split(".");
  if (!ts || !sig || !/^\d+$/.test(ts) || !safeEqual(sig, hmac(`form:${ts}`))) return "invalid";
  const age = now - Number(ts);
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}
