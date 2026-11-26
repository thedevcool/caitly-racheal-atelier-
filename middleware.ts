import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Guards every /admin page and /api/admin route. Each admin Server Action and
// route also checks the session itself (lib/admin.ts), per brief §8.
export default NextAuth(authConfig).auth;

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
