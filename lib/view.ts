import type { Media } from "@prisma/client";
import type { WorkWithMedia } from "./content";

/** The slice of a Media row the browser needs. */
export type ViewMedia = Pick<Media, "url" | "width" | "height" | "alt" | "blurData">;

/** A portfolio piece as passed to client components (no server-only fields). */
export type ViewWork = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  hook: string | null;
  client: string | null;
  description: string | null;
  externalUrl: string | null;
  mediaType: "IMAGE" | "VIDEO";
  media: ViewMedia | null;
  poster: ViewMedia | null;
  showCaseStudy: boolean;
  isPlaceholder: boolean;
};

const pickMedia = (m: Media | null): ViewMedia | null =>
  m ? { url: m.url, width: m.width, height: m.height, alt: m.alt, blurData: m.blurData } : null;

export function toViewWork(w: WorkWithMedia): ViewWork {
  return {
    id: w.id,
    slug: w.slug,
    title: w.title,
    category: w.category,
    hook: w.hook,
    client: w.client,
    description: w.description,
    externalUrl: w.externalUrl,
    mediaType: w.mediaType,
    media: pickMedia(w.media),
    poster: pickMedia(w.poster),
    showCaseStudy: w.showCaseStudy,
    isPlaceholder: w.isPlaceholder,
  };
}

/** Make an external link absolute ("islandescapes.travel" → "https://islandescapes.travel"). */
export const absoluteUrl = (u: string) => (/^https?:\/\//.test(u) ? u : `https://${u}`);
