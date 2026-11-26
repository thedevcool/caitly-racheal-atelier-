"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { ViewWork } from "@/lib/view";
import { ReelViewer } from "@/components/viewers/ReelViewer";
import { InViewVideo } from "@/components/viewers/InViewVideo";

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#EDE6DA" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

/** The Screening Room's three phones. Tapping one opens the fullscreen reel viewer. */
export function ReelPhones({ works }: { works: ViewWork[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  if (!works.length) return null;
  return (
    <>
      <div className="phones" role="group" aria-label={`${works.length} sample vertical video ads`}>
        {works.map((w, i) => {
          const still = w.poster ?? w.media;
          return (
            <figure className="phone" key={w.id}>
              <button
                type="button"
                className="phone-hit"
                onClick={() => setOpen(i)}
                data-cursor="Play"
                aria-label={`Play ${w.title}${w.hook ? `: ${w.hook}` : ""}`}
              >
                <span className="notch" />
                <span className="screen">
                  {w.mediaType === "VIDEO" && w.media ? (
                    <InViewVideo src={w.media.url} poster={w.poster?.url} aria-hidden="true" />
                  ) : (
                    still && (
                      <Image
                        src={still.url}
                        alt={still.alt}
                        width={still.width ?? 720}
                        height={still.height ?? 1280}
                        sizes="(max-width: 600px) 60vw, 260px"
                        placeholder={still.blurData ? "blur" : "empty"}
                        blurDataURL={still.blurData ?? undefined}
                      />
                    )
                  )}
                  <span className="play">
                    <PlayIcon />
                  </span>
                  <span className="sheen" aria-hidden="true" />
                  <span className="cap">
                    {w.hook && <b>{w.hook}</b>}
                    <small>{[w.title, w.category].filter(Boolean).join(" · ")}</small>
                  </span>
                </span>
              </button>
            </figure>
          );
        })}
      </div>
      <ReelViewer works={works} index={open} onClose={close} />
    </>
  );
}
