import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Storage interface (brief section 2). Vercel Blob in production; a local
 * public/uploads folder when BLOB_READ_WRITE_TOKEN is unset (development only,
 * because Vercel's filesystem does not persist).
 * To switch to Cloudinary, add a driver here; callers only use put/remove.
 */
export interface StoredFile {
  url: string;
  bytes: number;
}

export interface StorageDriver {
  put(data: Buffer, ext: string, contentType: string): Promise<StoredFile>;
  remove(url: string): Promise<void>;
}

/** Randomised filename so uploads never collide or reveal the original name. */
function randomName(ext: string) {
  return `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
}

const blobDriver: StorageDriver = {
  async put(data, ext, contentType) {
    const { put } = await import("@vercel/blob");
    const res = await put(`atelier/${randomName(ext)}`, data, {
      access: "public",
      contentType,
    });
    return { url: res.url, bytes: data.length };
  },
  async remove(url) {
    const { del } = await import("@vercel/blob");
    await del(url);
  },
};

const localDriver: StorageDriver = {
  async put(data, ext) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = randomName(ext);
    await writeFile(path.join(dir, name), data);
    return { url: `/uploads/${name}`, bytes: data.length };
  },
  async remove(url) {
    if (!url.startsWith("/uploads/")) return;
    await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
  },
};

export const storage: StorageDriver = process.env.BLOB_READ_WRITE_TOKEN ? blobDriver : localDriver;
