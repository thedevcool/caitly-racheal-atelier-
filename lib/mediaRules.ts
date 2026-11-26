/** Upload rules shared by the browser and server (brief §8, §11). SVG is never allowed. */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export type UploadKind = "image" | "video";

export function kindOf(type: string): UploadKind | null {
  if ((IMAGE_TYPES as readonly string[]).includes(type)) return "image";
  if ((VIDEO_TYPES as readonly string[]).includes(type)) return "video";
  return null;
}

export function checkFile(file: { type: string; size: number }, allowVideo: boolean): string | null {
  const kind = kindOf(file.type);
  if (!kind || (kind === "video" && !allowVideo)) {
    return allowVideo
      ? "Please choose a JPG, PNG, WebP, AVIF, MP4 or WebM file."
      : "Please choose a JPG, PNG, WebP or AVIF image.";
  }
  if (kind === "image" && file.size > MAX_IMAGE_BYTES) return "Images can be up to 10 MB.";
  if (kind === "video" && file.size > MAX_VIDEO_BYTES) return "Videos can be up to 80 MB.";
  return null;
}

export const extFor: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
