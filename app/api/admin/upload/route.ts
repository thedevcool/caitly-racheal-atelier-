import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, VIDEO_TYPES } from "@/lib/mediaRules";

/**
 * Issues short-lived Vercel Blob upload tokens to the signed-in admin, so the
 * browser can upload large files directly (Vercel functions cap bodies at 4.5 MB).
 * Blob enforces the allowed types and sizes; lib/media.ts re-checks the bytes.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user) throw new Error("Not signed in");
        const video = clientPayload === "video";
        return {
          allowedContentTypes: [...(video ? VIDEO_TYPES : IMAGE_TYPES)],
          maximumSizeInBytes: video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Recorded by the registerUpload action instead (this webhook can't reach localhost).
      },
    });
    return Response.json(json);
  } catch {
    return Response.json({ error: "Upload not allowed." }, { status: 400 });
  }
}
