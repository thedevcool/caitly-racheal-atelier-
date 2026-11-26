"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewWork } from "@/lib/view";
import { useDialog } from "./useDialog";
import { TypedCaption } from "./TypedCaption";

type Props = { works: ViewWork[]; index: number | null; onClose: () => void };

/**
 * TikTok-style fullscreen viewer. Swipe vertically between reels (native
 * scroll-snap), tap to unmute, double-tap for a heart, swipe down from the
 * first reel or press Esc to close. Visible pause and sound controls.
 */
export function ReelViewer({ works, index, onClose }: Props) {
  const { ref, close } = useDialog(index !== null, onClose);
  const track = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [current, setCurrent] = useState(index ?? 0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (index === null || !track.current) return;
    setCurrent(index);
    setPaused(false);
    track.current.scrollTo({
      top: index * track.current.clientHeight,
      behavior: "instant" as ScrollBehavior,
    });
  }, [index]);

  // Only the active reel plays
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      v.muted = muted;
      if (i === current && index !== null && !paused) v.play().catch(() => {});
      else v.pause();
    });
  }, [current, muted, paused, index]);

  const onScroll = () => {
    const t = track.current;
    if (!t) return;
    const i = Math.round(t.scrollTop / t.clientHeight);
    if (i !== current) {
      setCurrent(i);
      setPaused(false);
    }
  };

  const burst = useCallback((x: number, y: number) => {
    const id = Date.now();
    setHearts((h) => [...h, { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((p) => p.id !== id)), 900);
  }, []);

  // Single tap toggles sound; double tap sends a heart. Wait briefly to tell them apart.
  const onTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (now - lastTap.current < 280) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      burst(e.clientX - r.left, e.clientY - r.top);
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => setMuted((m) => !m), 280);
  };

  const go = (i: number) => {
    const t = track.current;
    if (t && i >= 0 && i < works.length) t.scrollTo({ top: i * t.clientHeight, behavior: "smooth" });
  };

  return (
    <dialog
      ref={ref}
      className="viewer reels"
      aria-label="Reel viewer"
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") go(current + 1);
        if (e.key === "ArrowUp") go(current - 1);
        if (e.key === " " || e.key === "k") {
          e.preventDefault();
          setPaused((p) => !p);
        }
        if (e.key === "m") setMuted((m) => !m);
      }}
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchEnd={(e) => {
        // swipe down from the first reel closes the viewer
        if (touchY.current !== null && (track.current?.scrollTop ?? 1) <= 0) {
          if (e.changedTouches[0].clientY - touchY.current > 90) close();
        }
        touchY.current = null;
      }}
    >
      <div ref={track} className="reel-track" onScroll={onScroll}>
        {works.map((w, i) => {
          const still = w.poster ?? (w.mediaType === "IMAGE" ? w.media : null);
          return (
            <section key={w.id} className="reel" aria-label={w.title} aria-hidden={i !== current}>
              <div className="reel-stage" onClick={onTap}>
                {w.mediaType === "VIDEO" && w.media ? (
                  <video
                    ref={(v) => {
                      videos.current[i] = v;
                    }}
                    src={w.media.url}
                    poster={w.poster?.url}
                    loop
                    playsInline
                    muted
                    preload={Math.abs(i - current) <= 1 ? "auto" : "none"}
                    aria-label={w.media.alt}
                  />
                ) : (
                  still && (
                    <Image
                      src={still.url}
                      alt={still.alt}
                      fill
                      sizes="(min-width: 601px) 480px, 100vw"
                      placeholder={still.blurData ? "blur" : "empty"}
                      blurDataURL={still.blurData ?? undefined}
                    />
                  )
                )}
                {hearts.map((h) => (
                  <span key={h.id} className="heart" style={{ left: h.x, top: h.y }} aria-hidden="true">
                    ♥
                  </span>
                ))}
              </div>
              <div className="reel-cap cap">
                {w.hook && <TypedCaption text={w.hook} active={i === current && index !== null} />}
                <small>{[w.title, w.category].filter(Boolean).join(" · ")}</small>
                {w.isPlaceholder && <small className="placeholder-tag">Sample art</small>}
              </div>
            </section>
          );
        })}
      </div>

      <div className="viewer-bar reel-bar">
        <span className="viewer-count">
          {current + 1} / {works.length}
        </span>
        <div className="viewer-actions">
          {works[current]?.mediaType === "VIDEO" && (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Play" : "Pause"}
              >
                {paused ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
                    <rect x="14" y="5" width="3.5" height="14" rx="1" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
                aria-pressed={!muted}
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
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" strokeLinejoin="round" />
                  {muted ? (
                    <path d="M16 9.5l5 5M21 9.5l-5 5" strokeLinecap="round" />
                  ) : (
                    <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </>
          )}
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
      {works[current]?.mediaType === "VIDEO" && muted && (
        <p className="reel-hint" aria-hidden="true">
          Tap for sound
        </p>
      )}
    </dialog>
  );
}
