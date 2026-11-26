"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { TypedCaption } from "@/components/viewers/TypedCaption";
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
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(1); // the middle phone leads
  const [seen, setSeen] = useState<boolean[]>([]);

  // Which phones are on screen (captions type on) and, in the phone carousel, which is centred
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const phones = [...el.querySelectorAll<HTMLElement>(".phone")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = phones.indexOf(e.target as HTMLElement);
          if (e.isIntersecting) setSeen((s) => Object.assign([...s], { [i]: true }));
          if (e.intersectionRatio > 0.75 && !matchMedia("(min-width: 601px)").matches) setActive(i);
        }
      },
      { root: !matchMedia("(min-width: 601px)").matches ? el : null, threshold: [0.4, 0.8] },
    );
    phones.forEach((p) => io.observe(p));
    // start the carousel on the middle phone
    if (!matchMedia("(min-width: 601px)").matches && phones[1])
      el.scrollLeft = phones[1].offsetLeft - (el.clientWidth - phones[1].offsetWidth) / 2;
    return () => io.disconnect();
  }, []);

  if (!works.length) return null;
  return (
    <>
      <div ref={row} className="phones" role="group" aria-label={`${works.length} sample vertical video ads`}>
        {works.map((w, i) => {
          const still = w.poster ?? w.media;
          return (
            <figure className={i === active ? "phone is-active" : "phone"} key={w.id}>
              <button type="button" className="phone-hit" onClick={() => setOpen(i)} data-cursor="Play">
                {/* Name comes from the visible caption (WCAG 2.5.3), with "Play" for context */}
                <span className="sr-only">Play </span>
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
                        sizes="(min-width: 601px) 260px, 62vw"
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
                    {w.hook && <TypedCaption text={w.hook} active={!!seen[i]} />}
                    <small>{[w.title, w.category].filter(Boolean).join(" · ")}</small>
                  </span>
                </span>
              </button>
            </figure>
          );
        })}
      </div>
      <div className="phone-dots" role="group" aria-label="Choose a reel">
        {works.map((w, i) => (
          <button
            key={w.id}
            type="button"
            aria-label={`Show ${w.title}`}
            aria-current={i === active}
            onClick={() => {
              const p = row.current?.querySelectorAll<HTMLElement>(".phone")[i];
              if (p && row.current)
                row.current.scrollTo({
                  left: p.offsetLeft - (row.current.clientWidth - p.offsetWidth) / 2,
                  behavior: "smooth",
                });
            }}
          />
        ))}
      </div>
      <ReelViewer works={works} index={open} onClose={close} />
    </>
  );
}
