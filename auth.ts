import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { db } from "./lib/db";
import { checkAdminPassword } from "./lib/password";
import { hashIp } from "./lib/secret";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

const LIMIT = 8; // failed attempts per IP per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1).max(200) })
          .safeParse(raw);
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const ipHash = hashIp(ip);
        const since = new Date(Date.now() - WINDOW_MS);
        if ((await db.loginAttempt.count({ where: { ipHash, createdAt: { gt: since } } })) >= LIMIT) {
          throw new RateLimited();
        }
        if (parsed.success && (await checkAdminPassword(parsed.data.email, parsed.data.password))) {
          await db.loginAttempt.deleteMany({ where: { ipHash } });
          return { id: "admin", email: process.env.ADMIN_EMAIL, name: "Caitly" };
        }
        await db.loginAttempt.create({ data: { ipHash } });
        // prune old rows now and then
        if (Math.random() < 0.05) await db.loginAttempt.deleteMany({ where: { createdAt: { lt: since } } });
        return null;
      },
    }),
  ],
});
