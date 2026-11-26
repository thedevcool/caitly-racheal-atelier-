"use client";

import Image from "next/image";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type { ViewMedia } from "@/lib/view";

export type ZoomHandle = { toggle: () => void; reset: () => void };

const MAX = 4;

/**
 * Pinch to zoom, drag to pan, double-tap to toggle 2.5×. Uses pointer events
 * and writes the transform straight to the DOM (no React re-render per frame).
 * At 1× the element allows horizontal panning so the lightbox track can swipe.
 */
export const ZoomableImage = forwardRef<
  ZoomHandle,
  { media: ViewMedia; onZoomChange?: (z: boolean) => void }
>(function ZoomableImage({ media, onZoomChange }, handle) {
  const box = useRef<HTMLDivElement>(null);
  const s = useRef({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef(0);

  const apply = () => {
    const el = box.current?.firstElementChild as HTMLElement | null;
    const { scale, x, y } = s.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    if (box.current) box.current.style.touchAction = scale > 1 ? "none" : "pan-x";
    onZoomChange?.(scale > 1);
  };
  const set = (scale: number, x = 0, y = 0) => {
    const r = box.current?.getBoundingClientRect();
    // keep the image covering the frame while panning
    const mx = r ? (r.width * (scale - 1)) / 2 : 0;
    const my = r ? (r.height * (scale - 1)) / 2 : 0;
    s.current = { scale, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
    apply();
  };

  useImperativeHandle(handle, () => ({
    toggle: () => set(s.current.scale > 1 ? 1 : 2.5),
    reset: () => set(1),
  }));

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  return (
    <div
      ref={box}
      className="zoom"
      style={{ touchAction: "pan-x" }}
      onPointerDown={(e) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) pinch.current = { dist: dist(), scale: s.current.scale };
        if (e.pointerType !== "mouse" && pointers.current.size === 1) {
          const now = Date.now();
          if (now - lastTap.current < 280) {
            // double-tap: zoom toward the tapped point
            const r = box.current!.getBoundingClientRect();
            if (s.current.scale > 1) set(1);
            else set(2.5, (r.left + r.width / 2 - e.clientX) * 1.5, (r.top + r.height / 2 - e.clientY) * 1.5);
            lastTap.current = 0;
          } else lastTap.current = now;
        }
        if (s.current.scale > 1) (e.target as Element).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const prev = pointers.current.get(e.pointerId);
        if (!prev) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2 && pinch.current) {
          set(
            Math.max(1, Math.min(MAX, (pinch.current.scale * dist()) / pinch.current.dist)),
            s.current.x,
            s.current.y,
          );
        } else if (pointers.current.size === 1 && s.current.scale > 1) {
          set(s.current.scale, s.current.x + e.clientX - prev.x, s.current.y + e.clientY - prev.y);
        }
      }}
      onPointerUp={(e) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) pinch.current = null;
        if (s.current.scale < 1.05) set(1);
      }}
      onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
      onDoubleClick={(e) => {
        // mouse double-click
        const r = box.current!.getBoundingClientRect();
        if (s.current.scale > 1) set(1);
        else set(2.5, (r.left + r.width / 2 - e.clientX) * 1.5, (r.top + r.height / 2 - e.clientY) * 1.5);
      }}
    >
      <Image
        src={media.url}
        alt={media.alt}
        width={media.width ?? 1200}
        height={media.height ?? 1500}
        sizes="100vw"
        placeholder={media.blurData ? "blur" : "empty"}
        blurDataURL={media.blurData ?? undefined}
        draggable={false}
      />
    </div>
  );
});
