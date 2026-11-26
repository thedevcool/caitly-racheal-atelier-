import "server-only";
import { MediaType } from "@prisma/client";
import { db } from "./db";
import { describeImage } from "./image";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./mediaRules";
import { storage } from "./storage";

type Sniffed = { kind: "image" | "video"; mime: string; ext: string };

/**
 * Identify a file by its first bytes, never by the name or the browser's
 * claimed type. Anything else (SVG, HTML, executables…) is rejected.
 */
export function sniff(b: Uint8Array): Sniffed | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { kind: "image", mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return { kind: "image", mime: "image/png", ext: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
    return { kind: "image", mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return { kind: "image", mime: "image/avif", ext: "avif" };
    return { kind: "video", mime: "video/mp4", ext: "mp4" }; // isom, mp41, mp42, M4V…
  }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return { kind: "video", mime: "video/webm", ext: "webm" };
  return null;
}

async function save(kind: "image" | "video", url: string, bytes: number, data?: Buffer) {
  const info =
    kind === "image" && data ? await describeImage(data) : { width: null, height: null, blurData: null };
  return db.media.create({
    data: { url, kind: kind === "image" ? MediaType.IMAGE : MediaType.VIDEO, alt: "", bytes, ...info },
  });
}

/** Local development: the file arrives in the request body. */
export async function createMediaFromBuffer(data: Buffer) {
  const s = sniff(data);
  if (!s) throw new UploadError("That file type isn’t allowed. Use JPG, PNG, WebP, AVIF, MP4 or WebM.");
  if (s.kind === "image" && data.length > MAX_IMAGE_BYTES)
    throw new UploadError("Images can be up to 10 MB.");
  if (s.kind === "video" && data.length > MAX_VIDEO_BYTES)
    throw new UploadError("Videos can be up to 80 MB.");
  const stored = await storage.put(data, s.ext, s.mime);
  return save(s.kind, stored.url, stored.bytes, data);
}

/** Production: the browser uploaded straight to Vercel Blob; verify it, then record it. */
export async function registerBlobMedia(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" || !u.hostname.endsWith(".public.blob.vercel-storage.com")) {
    throw new UploadError("Unexpected upload location.");
  }
  const head = await fetch(url, { headers: { Range: "bytes=0-63" } });
  const first = new Uint8Array(await head.arrayBuffer()).subarray(0, 64);
  const s = sniff(first);
  if (!s) {
    await storage.remove(url).catch(() => {});
    throw new UploadError("That file type isn’t allowed. Use JPG, PNG, WebP, AVIF, MP4 or WebM.");
  }
  if (s.kind === "image") {
    const data = Buffer.from(await (await fetch(url)).arrayBuffer());
    if (data.length > MAX_IMAGE_BYTES) {
      await storage.remove(url).catch(() => {});
      throw new UploadError("Images can be up to 10 MB.");
    }
    return save("image", url, data.length, data);
  }
  const size = Number(head.headers.get("content-range")?.split("/")[1] ?? 0);
  return save("video", url, size);
}

export class UploadError extends Error {}
