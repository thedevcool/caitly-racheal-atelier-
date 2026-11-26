import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { startDraft } from "@/lib/draft";
import { str } from "@/lib/formdata";
import { contentDraft, roomDraft } from "@/lib/previewFields";

/**
 * "Preview" button target: a plain form POST (so it can open a new tab).
 * Stores the unsaved values as a draft and opens the public page in draft mode.
 * Only signed-in admins; the session cookie is SameSite=Lax, so other sites can't post here.
 */
export async function POST(request: Request) {
  if (!(await auth())?.user) return new Response("Not signed in", { status: 401 });
  const form = await request.formData();
  const kind = str(form, "previewKind");
  if (kind === "content") {
    await startDraft({ settings: contentDraft(form) });
    redirect("/");
  }
  if (kind === "room") {
    const slug = str(form, "slug");
    await startDraft({ rooms: { [slug]: roomDraft(form) } });
    redirect(`/#${slug}`);
  }
  return new Response("Unknown preview", { status: 400 });
}
