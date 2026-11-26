import "server-only";

/** Optional Cloudflare Turnstile (brief §7.2). Only active when both keys are set. */
export const turnstileEnabled = () => !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token: unknown, ip: string) {
  if (!turnstileEnabled()) return true;
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch (e) {
    console.error("[atelier] Turnstile check failed", e);
    return false;
  }
}
