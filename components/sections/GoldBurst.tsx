"use client";

import { useEffect, useRef } from "react";

/**
 * A soft burst of champagne particles (brief §9: lightweight canvas, 1.2s).
 * Skipped entirely under prefers-reduced-motion.
 */
export function GoldBurst({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!fire || !canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    const cx = width / 2;
    const cy = height * 0.42;
    const colours = ["#D4B47A", "#E8D3A6", "#F3E6C8", "#B8975C"];
    const ps = Array.from({ length: 70 }, () => {
      const a = Math.random() * Math.PI * 2;
      const v = 1.5 + Math.random() * 4.5;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 1.5,
        r: 1 + Math.random() * 2.4,
        c: colours[(Math.random() * colours.length) | 0],
      };
    });
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1200; // 0 → 1 over 1.2s
      ctx.clearRect(0, 0, width, height);
      for (const p of ps) {
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 + 0.06; // gentle drag and gravity
        p.x += p.vx;
        p.y += p.vy;
        ctx.globalAlpha = Math.max(0, 1 - t) ** 1.5;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t < 1) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} className="burst" aria-hidden="true" />;
}
