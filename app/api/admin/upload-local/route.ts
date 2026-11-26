import { auth } from "@/auth";
import { createMediaFromBuffer, UploadError } from "@/lib/media";
import { MAX_VIDEO_BYTES } from "@/lib/mediaRules";

export const runtime = "nodejs";

/** Development uploads (no BLOB_READ_WRITE_TOKEN): the file comes in the request. */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "Not signed in." }, { status: 401 });
  if (process.env.BLOB_READ_WRITE_TOKEN)
    return Response.json({ error: "Use Blob uploads." }, { status: 400 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_VIDEO_BYTES + 1024 * 1024)
    return Response.json({ error: "That file is too large." }, { status: 413 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  try {
    const m = await createMediaFromBuffer(Buffer.from(await file.arrayBuffer()));
    return Response.json({ id: m.id, url: m.url, kind: m.kind, width: m.width, height: m.height });
  } catch (e) {
    const message = e instanceof UploadError ? e.message : "Upload failed. Please try again.";
    if (!(e instanceof UploadError)) console.error("[atelier] local upload failed", e);
    return Response.json({ error: message }, { status: 400 });
  }
}
