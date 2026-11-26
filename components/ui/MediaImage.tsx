import Image, { type ImageProps } from "next/image";
import type { Media } from "@prisma/client";

type Props = Omit<ImageProps, "src" | "alt" | "width" | "height" | "placeholder" | "blurDataURL"> & {
  media: Media | null;
  /** Override the stored alt, e.g. "" for decorative backgrounds. */
  alt?: string;
};

/** next/image fed from a Media row: real dimensions, alt text and blur placeholder. */
export function MediaImage({ media, alt, fill, ...rest }: Props) {
  if (!media) return null;
  const sizing = fill ? { fill: true as const } : { width: media.width ?? 1200, height: media.height ?? 800 };
  return (
    <Image
      src={media.url}
      alt={alt ?? media.alt}
      {...sizing}
      placeholder={media.blurData ? "blur" : "empty"}
      blurDataURL={media.blurData ?? undefined}
      {...rest}
    />
  );
}
