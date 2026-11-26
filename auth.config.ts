import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe part of the auth config, shared by middleware. No database or
 * bcrypt here; the Credentials provider lives in auth.ts (Node runtime).
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin/login")) return true;
      if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
