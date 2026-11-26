"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Small ivory dot with a trailing ring (brief §9). Over links it grows and
 * shows the word from data-cursor ("View", "Play", "Enter", "Open").
 * Fine pointers only, never under reduced motion, never in the admin, and
 * switchable in Settings.
 */
export function Cursor({ enabled }: { enabled: boolean }) {
  const path = usePathname();
  const [on, setOn] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const admin = path.startsWith("/admin");

  useEffect(() => {
    const ok =
      enabled &&
      !admin &&
      matchMedia("(pointer: fine)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    setOn(ok);
    document.documentElement.classList.toggle("has-cursor", ok);
    return () => document.documentElement.classList.remove("has-cursor");
  }, [enabled, admin]);

  useEffect(() => {
    if (!on) return;
    const pos = { x: -100, y: -100 };
    const lag = { x: -100, y: -100 };
    let raf = 0;
    const tick = () => {
      // the ring trails the dot
      lag.x += (pos.x - lag.x) * 0.18;
      lag.y += (pos.y - lag.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      root.current?.classList.remove("is-hidden");
    };
    const over = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const target = t?.closest?.("[data-cursor], a, button, select, label, [role='button']");
      const word = target?.getAttribute("data-cursor") ?? "";
      setLabel(word);
      root.current?.classList.toggle("is-hover", !!target);
      root.current?.classList.toggle("has-label", !!word);
    };
    const leave = () => root.current?.classList.add("is-hidden");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [on]);

  if (!on) return null;
  return (
    <div ref={root} className="cursor is-hidden" aria-hidden="true">
      <div ref={ring} className="cursor-ring">
        <span className="cursor-label">{label}</span>
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
