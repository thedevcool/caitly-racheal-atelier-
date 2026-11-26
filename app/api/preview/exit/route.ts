import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { DRAFT_COOKIE } from "@/lib/draft";

/** Leaves preview and returns to the live page. */
export async function GET(request: Request) {
  (await draftMode()).disable();
  (await cookies()).delete(DRAFT_COOKIE);
  const to = new URL(request.url).searchParams.get("to") ?? "/";
  redirect(to.startsWith("/") && !to.startsWith("//") ? to : "/");
}
