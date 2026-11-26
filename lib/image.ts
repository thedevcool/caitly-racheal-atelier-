import sharp from "sharp";

/** Width, height and a tiny blurred base64 preview for next/image's placeholder. */
export async function describeImage(data: Buffer) {
  const img = sharp(data);
  const { width, height } = await img.metadata();
  const tiny = await img.clone().resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return {
    width: width ?? null,
    height: height ?? null,
    blurData: `data:image/webp;base64,${tiny.toString("base64")}`,
  };
}
