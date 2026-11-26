"use server";

import { requireAdmin } from "@/lib/admin";
import { registerBlobMedia, UploadError } from "@/lib/media";

/** After a direct-to-Blob upload: verify the file and create its Media row. */
export async function registerUpload(url: string) {
  await requireAdmin();
  try {
    const m = await registerBlobMedia(url);
    return { ok: true as const, id: m.id, url: m.url, kind: m.kind, width: m.width, height: m.height };
  } catch (e) {
    if (!(e instanceof UploadError)) console.error("[atelier] register upload failed", e);
    return {
      ok: false as const,
      error: e instanceof UploadError ? e.message : "Upload failed. Please try again.",
    };
  }
}
