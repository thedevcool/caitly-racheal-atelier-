"use client";

import { useEffect, useRef, type VideoHTMLAttributes } from "react";

/**
 * Muted looping video that plays only while on screen and pauses off screen
 * (brief §9). Never autoplays under prefers-reduced-motion or while paused.
 */
export function InViewVideo(props: VideoHTMLAttributes<HTMLVideoElement> & { active?: boolean }) {
  const { active = true, ...rest } = props;
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        const paused = document.documentElement.dataset.motion === "paused";
        if (e.isIntersecting && active && !reduce && !paused) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [active]);
  return <video ref={ref} muted loop playsInline preload="none" {...rest} />;
}
