import "server-only";
import { db } from "./db";
import { str } from "./formdata";

/**
 * Reads a MediaField's hidden inputs (`${name}Id`, `${name}Alt`) and saves the
 * alt text onto the Media row. Returns the id, or an error if alt is missing.
 */
export async function mediaFromForm(
  form: FormData,
  name: string,
  opts: { required?: boolean; label: string },
) {
  const id = str(form, `${name}Id`) || null;
  const alt = str(form, `${name}Alt`);
  if (!id) return opts.required ? { error: { [`${name}Id`]: `Please add ${opts.label}.` } } : { id: null };
  const exists = await db.media.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return { error: { [`${name}Id`]: "That upload couldn’t be found. Please upload it again." } };
  if (!alt)
    return { error: { [`${name}Alt`]: "Alt text is required: a short description of what it shows." } };
  if (alt.length > 300) return { error: { [`${name}Alt`]: "Please keep alt text under 300 characters." } };
  await db.media.update({ where: { id }, data: { alt } });
  return { id };
}

export const storageMode = (): "blob" | "local" => (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local");
