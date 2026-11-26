"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function login(_: string | null, form: FormData): Promise<string | null> {
  try {
    await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirectTo: "/admin",
    });
    return null;
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      if (code === "rate_limited") return "Too many attempts. Please wait 15 minutes and try again.";
      return "That email and password don’t match.";
    }
    throw e; // the successful redirect
  }
}
