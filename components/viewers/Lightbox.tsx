"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { absoluteUrl, type ViewWork } from "@/lib/view";
import { useDialog } from "./useDialog";
import { ZoomableImage, type ZoomHandle } from "./ZoomableImage";

type Props = {
  works: ViewWork[];
  index: number | null; // null = closed
  roomSlug: string;
  onClose: () => void;
};

/**
 * Fullscreen image viewer: swipe (native scroll-snap), arrow keys, pinch and
 * double-tap zoom, and the piece's details beside or below the image.
 */
export function Lightbox({ works, index, roomSlug, onClose }: Props) {
  const { ref, close } = useDialog(index !== null, onClose);
  const track = useRef<HTMLDivElement>(null);
  const zooms = useRef<(ZoomHandle | null)[]>([]);
  const [current, setCurrent] = useState(index ?? 0);
  const [zoomed, setZoomed] = useState(false);

  // Jump to the opened image without animating
  useEffect(() => {
    if (index === null || !track.current) return;
    setCurrent(index);
    track.current.scrollTo({
      left: index * track.current.clientWidth,
      behavior: "instant" as ScrollBehavior,
    });
  }, [index]);

  const go = useCallback(
    (i: number) => {
      const t = track.current;
      if (!t) return;
      const next = (i + works.length) % works.length;
      zooms.current[current]?.reset();
      t.scrollTo({ left: next * t.clientWidth, behavior: "smooth" });
    },
    [current, works.length],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(current + 1);
    if (e.key === "ArrowLeft") go(current - 1);
  };

  const onScroll = () => {
    const t = track.current;
    if (!t) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    if (i !== current) {
      zooms.current[current]?.reset();
      setCurrent(i);
    }
  };

  const w = works[current];
  return (
    <dialog ref={ref} className="viewer lightbox" aria-label="Image viewer" onKeyDown={onKey}>
      <div className="viewer-bar">
        <span className="viewer-count" aria-live="polite">
          {current + 1} / {works.length}
        </span>
        <div className="viewer-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => zooms.current[current]?.toggle()}
            aria-label="Zoom"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5M11 8v6M8 11h6" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close" autoFocus>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={track}
        className="lightbox-track"
        onScroll={onScroll}
        style={{ overflowX: zoomed ? "hidden" : "auto" }}
      >
        {works.map((work, i) => (
          <figure key={work.id} className="lightbox-slide" aria-hidden={i !== current}>
            {work.media && (
              <ZoomableImage
                ref={(h) => {
                  zooms.current[i] = h;
                }}
                media={work.poster ?? work.media}
                onZoomChange={i === current ? setZoomed : undefined}
              />
            )}
          </figure>
        ))}
      </div>

      {works.length > 1 && (
        <>
          <button
            type="button"
            className="icon-btn viewer-prev"
            onClick={() => go(current - 1)}
            aria-label="Previous"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn viewer-next"
            onClick={() => go(current + 1)}
            aria-label="Next"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {w && (
        <div className="lightbox-details">
          <h2 className="serif">{w.title}</h2>
          <p className="viewer-meta">
            {[w.category, w.client].filter(Boolean).join(" · ")}
            {w.isPlaceholder && <span className="placeholder-tag">Sample art</span>}
          </p>
          {w.description && <p>{w.description}</p>}
          <div className="viewer-links">
            {w.externalUrl && (
              <a
                href={absoluteUrl(w.externalUrl)}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="Open"
              >
                View it live ↗
              </a>
            )}
            {w.showCaseStudy && (
              <Link href={`/work/${roomSlug}/${w.slug}`} data-cursor="View">
                Read the case study →
              </Link>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
