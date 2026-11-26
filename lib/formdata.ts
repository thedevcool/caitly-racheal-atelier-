import { z } from "zod";

/** Small helpers for reading admin FormData. */
export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const opt = (f: FormData, k: string) => str(f, k) || null;
export const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
/** One item per line (or comma-separated for chips) */
export const lines = (f: FormData, k: string) =>
  str(f, k)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
export const commaList = (f: FormData, k: string) =>
  str(f, k)
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export function zodErrors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "piece";

/** "*italic*" must be balanced or the headline would show stray asterisks */
export const balancedStars = (s: string) => (s.match(/\*/g)?.length ?? 0) % 2 === 0;

export const req = (label: string, max = 300) =>
  z
    .string()
    .trim()
    .min(1, `${label} can’t be empty.`)
    .max(max, `${label} is too long (${max} characters at most).`);
export const optional = (max = 300) => z.string().trim().max(max, `Too long (${max} characters at most).`);
export const url = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => !v || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v),
    "Please enter a full link starting with https://",
  );
