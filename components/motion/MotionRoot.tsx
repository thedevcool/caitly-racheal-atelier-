"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type Lenis from "lenis";
import { ALL, type Ctx } from "./effects";

/**
 * One place for site motion: Lenis smooth scrolling synced to GSAP's ticker,
 * and the page effects, re-run on every route change. GSAP and Lenis are
 * loaded dynamically, so they never block first paint. Off entirely under
 * prefers-reduced-motion and in the admin.
 */
export function MotionRoot() {
  const path = usePathname();
  const lenis = useRef<Lenis | null>(null);
  const libs = useRef<Promise<{ gsap: Ctx["gsap"]; ScrollTrigger: Ctx["ScrollTrigger"] }> | null>(null);
  const admin = path.startsWith("/admin");

  // Load once, set up Lenis once
  useEffect(() => {
    if (admin || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    libs.current ??= (async () => {
      const [{ gsap }, { ScrollTrigger }, { CustomEase }, { default: LenisClass }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("gsap/CustomEase"),
        import("lenis"),
      ]);
      gsap.registerPlugin(ScrollTrigger, CustomEase);
      CustomEase.create("silk", "0.22, 1, 0.36, 1");
      // Smooths wheel/trackpad only; touch keeps native scrolling, so nothing fights the thumb
      const l = new LenisClass({ lerp: 0.085, anchors: true });
      l.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => l.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      lenis.current = l;
      // Dialogs (lightbox, reels, menu) set data-lock: stop smooth scroll underneath
      new MutationObserver(() => (document.documentElement.dataset.lock ? l.stop() : l.start())).observe(
        document.documentElement,
        { attributes: true, attributeFilter: ["data-lock"] },
      );
      return { gsap, ScrollTrigger };
    })();
  }, [admin]);

  // Page effects, per route
  useEffect(() => {
    if (admin || matchMedia("(prefers-reduced-motion: reduce)").matches || !libs.current) return;
    let cancelled = false;
    let revert = () => {};
    libs.current.then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      const loops: GSAPTween[] = [];
      const ctx: Ctx = { gsap, ScrollTrigger, fine: matchMedia("(pointer: fine)").matches, loops };
      const cleanups: (() => void)[] = [];
      const g = gsap.context(() => {
        for (const fx of ALL) {
          const off = fx(ctx);
          if (typeof off === "function") cleanups.push(off);
        }
      });
      // The pause button also pauses the floating loops
      const syncPause = () => {
        const paused = document.documentElement.dataset.motion === "paused";
        loops.forEach((t) => (paused ? t.pause() : t.resume()));
      };
      const mo = new MutationObserver(syncPause);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
      syncPause();
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        lenis.current?.resize();
      });
      revert = () => {
        mo.disconnect();
        cleanups.forEach((c) => c());
        g.revert();
      };
    });
    return () => {
      cancelled = true;
      revert();
    };
  }, [path, admin]);

  return null;
}
