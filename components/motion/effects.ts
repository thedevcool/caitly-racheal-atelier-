/**
 * Page effects (brief §9). Each function sets up one piece of motion inside a
 * gsap.context so it can be reverted on route change. Nothing here runs under
 * prefers-reduced-motion (MotionRoot never calls it), and nothing hides
 * content that is already on screen when the page loads.
 */
import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ST } from "gsap/ScrollTrigger";

type G = typeof GSAP;
type Ctx = { gsap: G; ScrollTrigger: typeof ST; fine: boolean; loops: GSAPTween[] };

const SILK = "silk"; // CustomEase "0.22, 1, 0.36, 1", registered in MotionRoot
const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;
const mobile = () => window.matchMedia("(max-width: 600px)").matches;

/** Wrap each word of an element in a mask + inner span, keeping <em> and spacing. */
function splitWords(el: HTMLElement) {
  if (el.dataset.split) return el.querySelectorAll<HTMLElement>(".rw-i");
  el.dataset.split = "1";
  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of (child.textContent ?? "").split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) frag.append(part);
          else {
            const w = document.createElement("span");
            w.className = "rw";
            const i = document.createElement("span");
            i.className = "rw-i";
            i.textContent = part;
            w.append(i);
            frag.append(w);
          }
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) walk(child);
    }
  };
  walk(el);
  return el.querySelectorAll<HTMLElement>(".rw-i");
}

/** Headings rise line by line from a mask; body fades after; chips stagger 60ms. */
export function reveals({ gsap }: Ctx) {
  const calm = (el: Element) => !!el.closest(".paper, .tone-paper");

  document.querySelectorAll<HTMLElement>("main h2:not(.sr-only), .room-title").forEach((h) => {
    if (h.closest(".hero, dialog, .statement, .brief-card") || !below(h)) return;
    if (calm(h)) {
      gsap.from(h, {
        opacity: 0,
        duration: 1.6,
        ease: "sine.out",
        scrollTrigger: { trigger: h, start: "top 88%", once: true },
      });
      return;
    }
    const words = [...splitWords(h)];
    // group words into lines by their vertical position, so each line rises together
    const tops = [...new Set(words.map((w) => Math.round((w.parentElement as HTMLElement).offsetTop)))].sort(
      (a, b) => a - b,
    );
    words.forEach((w) => {
      const line = tops.indexOf(Math.round((w.parentElement as HTMLElement).offsetTop));
      gsap.from(w, {
        yPercent: 110,
        duration: 1.15,
        ease: SILK,
        delay: line * 0.12,
        scrollTrigger: { trigger: h, start: "top 88%", once: true },
      });
    });
  });

  const fades =
    ".roomtag, .lede, .room-ctas, .tag, .crumbs, .room-headline, .next-room, .filters, .label, .packages .package, .quotes blockquote, .case-media";
  document.querySelectorAll<HTMLElement>(fades).forEach((el) => {
    if (el.closest(".hero, dialog, .brief-card") || !below(el)) return;
    const slow = calm(el);
    gsap.from(el, {
      opacity: 0,
      y: slow ? 0 : 18,
      duration: slow ? 1.6 : 1,
      delay: slow ? 0 : 0.25,
      ease: slow ? "sine.out" : SILK,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  document.querySelectorAll<HTMLElement>(".chips").forEach((list) => {
    if (!below(list)) return;
    gsap.from(list.children, {
      opacity: 0,
      y: 10,
      duration: 0.8,
      ease: SILK,
      stagger: 0.06,
      delay: 0.35,
      scrollTrigger: { trigger: list, start: "top 92%", once: true },
    });
  });

  document.querySelectorAll<HTMLElement>(".gallery").forEach((g) => {
    gsap.utils.toArray<HTMLElement>(g.children).forEach((li, i) => {
      if (!below(li)) return;
      gsap.from(li, {
        opacity: 0,
        y: 30,
        duration: 1,
        ease: SILK,
        delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: li, start: "top 94%", once: true },
      });
    });
  });
}

/** Hero: parallax at 0.6× scroll, pointer shift (12px max), tilt on phones after a gesture. */
export function hero({ gsap, fine }: Ctx) {
  const hero = document.querySelector<HTMLElement>(".hero");
  const layer = document.querySelector<HTMLElement>("[data-hero-parallax]");
  const shift = document.querySelector<HTMLElement>("[data-hero-shift]");
  if (!hero || !layer || !shift) return;

  // Image moves down 40% of the scroll distance, i.e. at 0.6× scroll speed
  gsap.to(layer, {
    y: () => hero.offsetHeight * 0.4,
    ease: "none",
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  const toX = gsap.quickTo(shift, "x", { duration: 1.4, ease: "power3.out" });
  const toY = gsap.quickTo(shift, "y", { duration: 1.4, ease: "power3.out" });
  const clamp = gsap.utils.clamp(-12, 12);

  if (fine) {
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      toX(clamp((e.clientX / r.width - 0.5) * -24));
      toY(clamp(((e.clientY - r.top) / r.height - 0.5) * -24));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }

  // Phones: device tilt, only after a user gesture, and only if permission is granted
  let listening = false;
  const orient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return;
    toX(clamp(-e.gamma / 2.5));
    toY(clamp(-(e.beta - 45) / 3));
  };
  const ask = async () => {
    window.removeEventListener("touchend", ask);
    const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (typeof D.requestPermission === "function" && (await D.requestPermission()) !== "granted") return;
      window.addEventListener("deviceorientation", orient, { passive: true });
      listening = true;
    } catch {
      /* permission refused or unavailable: skip quietly */
    }
  };
  window.addEventListener("touchend", ask, { once: true, passive: true });
  return () => {
    window.removeEventListener("touchend", ask);
    if (listening) window.removeEventListener("deviceorientation", orient);
  };
}

/** Statement: words go from 20% to 100% as it scrolls past; gold words turn gold in turn. */
export function statement({ gsap }: Ctx) {
  const section = document.querySelector<HTMLElement>("[data-statement]");
  if (!section) return;
  const words = [...section.querySelectorAll<HTMLElement>(".sw")];
  const tl = gsap.timeline({
    scrollTrigger: { trigger: section, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
  });
  words.forEach((w, i) => {
    tl.fromTo(w, { opacity: 0.2 }, { opacity: 1, duration: 1, ease: "none" }, i * 0.55);
    const gold = w.querySelector(".sw-gold");
    if (gold) tl.fromTo(gold, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "none" }, i * 0.55 + 0.5);
  });
}

/** Screening Room: phones fan in from below, settle, float out of sync; 3D tilt with sheen. */
export function phones({ gsap, fine, loops }: Ctx) {
  const wrap = document.querySelector<HTMLElement>(".phones");
  if (!wrap) return;
  const hits = [...wrap.querySelectorAll<HTMLElement>(".phone-hit")];
  const small = mobile();
  const float = () =>
    hits.forEach((h, i) => {
      loops.push(
        gsap.to(h, {
          y: -7,
          duration: 3.1 + i * 0.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.4,
        }),
      );
    });

  if (below(wrap)) {
    gsap.from(hits, {
      y: small ? 40 : 170,
      rotation: small ? 0 : (i: number) => [-9, 0, 9][i] ?? 0,
      opacity: 0,
      duration: 1.5,
      ease: SILK,
      stagger: 0.12,
      scrollTrigger: { trigger: wrap, start: "top 82%", once: true },
      onComplete: float,
    });
  } else float();

  if (!fine || small) return;
  const cleanups = hits.map((h) => {
    gsap.set(h, { transformPerspective: 900 });
    const rx = gsap.quickTo(h, "rotationX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(h, "rotationY", { duration: 0.8, ease: "power3.out" });
    const sheen = h.querySelector<HTMLElement>(".sheen");
    const move = (e: PointerEvent) => {
      const r = h.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 16); // max 8°
      rx(-py * 16);
      if (sheen) {
        sheen.style.opacity = "1";
        sheen.style.setProperty("--sheen-x", `${(px + 0.5) * 100}%`);
      }
    };
    const leave = () => {
      rx(0);
      ry(0);
      if (sheen) sheen.style.opacity = "0";
    };
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerleave", leave);
    return () => {
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerleave", leave);
    };
  });
  return () => cleanups.forEach((c) => c());
}

/** Shopfront: frames hang in and settle; they sway with the pointer, shadows shift opposite. */
export function frames({ gsap, fine }: Ctx) {
  const wall = document.querySelector<HTMLElement>(".frames");
  if (!wall) return;
  const list = [...wall.querySelectorAll<HTMLElement>(".frame")];
  if (below(wall)) {
    list.forEach((f, i) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: wall, start: "top 82%", once: true },
        delay: i * 0.16,
      });
      tl.from(f, {
        y: -80,
        opacity: 0,
        rotation: [-3, 2.5, -2][i] ?? 0,
        duration: 1.1,
        ease: SILK,
        transformOrigin: "50% 0",
      })
        .to(f, { rotation: [1, -0.8, 0.6][i] ?? 0, duration: 0.9, ease: "sine.inOut" })
        .to(f, { rotation: 0, duration: 1.2, ease: "sine.inOut" });
    });
  }
  if (!fine || mobile()) return;
  const section = wall.closest("section") ?? wall;
  const rot = list.map((f) => gsap.quickTo(f, "rotation", { duration: 1.4, ease: "power2.out" }));
  const sx = list.map((f) => gsap.quickTo(f, "--sx", { duration: 1.4, ease: "power2.out" }));
  const move = (e: PointerEvent) => {
    list.forEach((f, i) => {
      const r = f.getBoundingClientRect();
      const d = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2));
      rot[i](d * 1.6); // a little sway, like a frame on a nail
      sx[i](-d * 14); // light from above: the shadow moves the other way
    });
  };
  const leave = () => list.forEach((_, i) => (rot[i](0), sx[i](0)));
  section.addEventListener("pointermove", move as EventListener);
  section.addEventListener("pointerleave", leave);
  return () => {
    section.removeEventListener("pointermove", move as EventListener);
    section.removeEventListener("pointerleave", leave);
  };
}

/** Studio: the browser's inner page scrolls as the visitor scrolls; touch can take over. */
export function studio({ ScrollTrigger }: Ctx) {
  const vp = document.querySelector<HTMLElement>("[data-studio-viewport]");
  if (!vp) return;
  let userUntil = 0;
  const mark = () => (userUntil = Date.now() + 2500);
  vp.addEventListener("pointerdown", mark, { passive: true });
  vp.addEventListener("wheel", mark, { passive: true });
  vp.addEventListener("touchstart", mark, { passive: true });
  ScrollTrigger.create({
    trigger: vp,
    start: "top 75%",
    end: "bottom 25%",
    onUpdate: (self) => {
      if (Date.now() < userUntil) return;
      vp.scrollTop = self.progress * (vp.scrollHeight - vp.clientHeight);
    },
  });
  return () => {
    vp.removeEventListener("pointerdown", mark);
    vp.removeEventListener("wheel", mark);
    vp.removeEventListener("touchstart", mark);
  };
}

/** Library: layered mist parallax, and the seal stamps in with an ink bloom. */
export function library({ gsap }: Ctx) {
  const stage = document.querySelector<HTMLElement>("[data-ink]");
  if (!stage) return;
  const st = { trigger: stage, start: "top bottom", end: "bottom top", scrub: true };
  gsap.fromTo("[data-ink-far]", { yPercent: -1.5 }, { yPercent: 1.5, ease: "none", scrollTrigger: st });
  gsap.fromTo("[data-ink-near]", { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: st });
  gsap.fromTo(
    "[data-ink-mist]",
    { xPercent: -5, yPercent: 2 },
    { xPercent: 5, yPercent: -2, ease: "none", scrollTrigger: st },
  );

  const seal = stage.querySelector<HTMLElement>("[data-seal]");
  if (!seal) return;
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      seal.classList.remove("is-waiting");
      seal.classList.add("is-stamped");
      io.disconnect();
    },
    { threshold: 0.6 },
  );
  io.observe(seal);
  return () => io.disconnect();
}

/** Primary CTAs pull gently toward the pointer (max 8px). */
export function magnetic({ gsap, fine }: Ctx) {
  if (!fine) return;
  const offs = [...document.querySelectorAll<HTMLElement>(".btn.gold, .btn.solid, [data-magnetic]")].map(
    (b) => {
      const x = gsap.quickTo(b, "x", { duration: 0.7, ease: "power3.out" });
      const y = gsap.quickTo(b, "y", { duration: 0.7, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = b.getBoundingClientRect();
        x(((e.clientX - r.left) / r.width - 0.5) * 16);
        y(((e.clientY - r.top) / r.height - 0.5) * 16);
      };
      const leave = () => (x(0), y(0));
      b.addEventListener("pointermove", move);
      b.addEventListener("pointerleave", leave);
      return () => {
        b.removeEventListener("pointermove", move);
        b.removeEventListener("pointerleave", leave);
      };
    },
  );
  return () => offs.forEach((o) => o());
}

export const ALL = [reveals, hero, statement, phones, frames, studio, library, magnetic];
export type { Ctx };
