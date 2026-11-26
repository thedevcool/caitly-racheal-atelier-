import "server-only";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { CONTENT_TAG } from "./content";

/** For admin pages: redirect to the login if there is no session. */
export async function requireAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

/** For admin Server Actions and routes: throw if there is no session. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  return session;
}

/** Changes go live on save (brief §8). */
export function publish() {
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

export type ActionResult = { ok: boolean; message?: string; errors?: Record<string, string>; id?: string };
