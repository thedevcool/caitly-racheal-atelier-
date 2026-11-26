import bcrypt from "bcryptjs";

/**
 * ADMIN_PASSWORD_HASH may be a raw bcrypt hash ("$2b$12$…") or the same hash
 * base64-encoded. `pnpm admin:hash` prints the base64 form, because "$" signs
 * get mangled by .env files and some shells.
 */
export function adminHash(): string | null {
  const v = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!v) return null;
  if (v.startsWith("$2")) return v;
  try {
    const decoded = Buffer.from(v, "base64").toString("utf8");
    return decoded.startsWith("$2") ? decoded : null;
  } catch {
    return null;
  }
}

// A real bcrypt hash of a random string, compared when no admin hash is set
const DUMMY_HASH = "$2b$12$cxlOn4LrDr/0GiiV1erYi.LFF.SO38SglPA9CHaOXvQmlkghGe7SC";

export async function checkAdminPassword(email: string, password: string) {
  const hash = adminHash();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  // Always run a bcrypt compare so timing doesn't reveal whether the email matched
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return !!hash && !!adminEmail && email.trim().toLowerCase() === adminEmail && ok;
}
