import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server secret for signing form tokens and hashing IPs. Uses AUTH_SECRET
 * (required for the admin anyway). If it is missing, falls back to a hash of
 * DATABASE_URL so enquiries keep working, and logs a warning.
 */
let warned = false;
export function serverSecret() {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production" && !warned) {
    console.warn("[atelier] AUTH_SECRET is not set; using a fallback secret. Set it in Vercel.");
    warned = true;
  }
  return createHash("sha256")
    .update(`atelier:${process.env.DATABASE_URL ?? "dev"}`)
    .digest("hex");
}

export const hmac = (value: string) => createHmac("sha256", serverSecret()).update(value).digest("base64url");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Hash of the visitor's IP: enough to rate-limit, never the raw address (brief §7). */
export const hashIp = (ip: string) => hmac(`ip:${ip}`).slice(0, 32);
