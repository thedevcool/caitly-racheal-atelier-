"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { ViewWork } from "@/lib/view";
import { Lightbox } from "@/components/viewers/Lightbox";

/** The Shopfront's framed prints. Tapping one opens the lightbox with product details. */
export function FrameWall({ works, roomSlug }: { works: ViewWork[]; roomSlug: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  return (
    <>
      <div className="frames">
        {works.map((w, i) => (
          <figure className="frame" key={w.id}>
            <button type="button" className="frame-hit" onClick={() => setOpen(i)} data-cursor="View">
              <span className="sr-only">View {w.title}: </span>
              {w.media && (
                <Image
                  src={w.media.url}
                  alt={w.media.alt}
                  width={w.media.width ?? 900}
                  height={w.media.height ?? 1125}
                  sizes="(max-width: 600px) 70vw, 270px"
                  placeholder={w.media.blurData ? "blur" : "empty"}
                  blurDataURL={w.media.blurData ?? undefined}
                />
              )}
            </button>
          </figure>
        ))}
      </div>
      <Lightbox works={works} index={open} roomSlug={roomSlug} onClose={close} />
    </>
  );
}
