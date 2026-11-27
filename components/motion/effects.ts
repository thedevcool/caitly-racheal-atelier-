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
const mobile = () => !window.matchMedia("(min-width: 601px)").matches; // phones are the base case

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

/**
 * Build on scroll: as the visitor scrolls, each part of the page below the
 * first screen arrives scattered (flung in from far off, spinning, at odd
 * sizes) and flies into place with a thin gold "selection" outline, like a
 * designer laying it out live. Pieces build ONE AT A TIME, in page order, from
 * a single queue: a heading word by word, then its text, then its chips, then
 * the next block. If the visitor scrolls fast and a backlog builds up, the
 * queue speeds up so nothing stays missing for long. The first screen is built
 * by the CSS assembly instead (see "Assemble" in globals.css).
 *
 * Performance: every position is read in one pass, then every style is
 * written in one pass (no layout thrashing), and headings are only split into
 * words when they are about to enter the screen. Only transform and opacity
 * animate, and the transform is cleared once a piece lands, so other effects
 * keep working. With motion paused, pieces simply appear.
 */
export function reveals({ gsap, ScrollTrigger }: Ctx) {
  const skip = (el: Element) => !!el.closest(".hero, dialog, .statement, .brief-card");
  const calm = (el: Element) => !!el.closest(".paper, .tone-paper");
  const q = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)].filter((el) => !skip(el));

  const headings = q("main h2:not(.sr-only), .room-title");
  const fades = q(
    ".roomtag, .lede, .room-ctas, .tag, .crumbs, .room-headline, .next-room, .filters, .label, .packages .package, .quotes blockquote, .case-media, .gallery > li",
  );
  const chipLists = q(".chips");

  // READ: one layout pass for everything
  const fold = window.innerHeight * 0.92;
  const all = [...headings, ...fades, ...chipLists].filter((el) => el.getBoundingClientRect().top > fold);
  // page order, so blocks build top to bottom
  all.sort((x, y) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const kind = new Map<HTMLElement, "heading" | "chips" | "block">();
  for (const el of all)
    kind.set(el, headings.includes(el) ? "heading" : chipLists.includes(el) ? "chips" : "block");

  // WRITE: hide what's below the fold (content on screen at load is never hidden)
  for (const el of all) gsap.set(kind.get(el) === "chips" ? el.children : el, { opacity: 0 });

  const build = builder(gsap);
  // Elements entering in the same frame are flushed together, in page order
  let pending: HTMLElement[] = [];
  let flushing = false;
  const flush = () => {
    flushing = false;
    const batch = pending.sort((x, y) => all.indexOf(x) - all.indexOf(y));
    pending = [];
    for (const el of batch) {
      const k = kind.get(el);
      if (k === "heading") {
        const words = [...splitWords(el)];
        el.dataset.build = "1"; // lets words fly outside their masks
        gsap.set(words, { opacity: 0 });
        gsap.set(el, { opacity: 1 });
        build(words, calm(el) ? 0.2 : 0.14);
      } else if (k === "chips") build([...el.children] as HTMLElement[], 0.16);
      else build([el], 0.3);
    }
  };

  for (const el of all)
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => {
        pending.push(el);
        if (!flushing) {
          flushing = true;
          requestAnimationFrame(flush);
        }
      },
    });
}

/**
 * The build queue: each call adds pieces to the end of one shared timeline,
 * `gap` seconds apart, with a short breath between blocks. Scatter offsets
 * spiral out along the golden angle (as in lib/scatter.ts) so no two pieces
 * come from the same place.
 */
function builder(gsap: G) {
  let next = 0; // ticker time when the next piece may start
  let n = 0;
  let off = false; // tests turn building off, as they do the assembly
  try {
    off = JSON.parse(sessionStorage.getItem("atelier-seen") || "[]") === "*";
  } catch {}
  return (pieces: HTMLElement[], gap: number) => {
    const now = gsap.ticker.time;
    next = Math.max(next, now);
    const vw = window.innerWidth / 100;
    const vh = window.innerHeight / 100;
    for (const p of pieces) {
      if (off || document.documentElement.dataset.motion === "paused") {
        gsap.set(p, { opacity: 1 });
        continue;
      }
      const backlog = next - now;
      const i = n++;
      const angle = i * 2.39996;
      const r = 40 + ((i * 37) % 61);
      gsap.fromTo(
        p,
        {
          x: Math.cos(angle) * r * vw,
          y: Math.sin(angle) * r * 0.6 * vh,
          rotation: ((i * 137) % 361) - 180,
          scale: 0.35 + ((i * 53) % 155) / 100,
          opacity: 0,
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          opacity: 1,
          duration: backlog > 3 ? 1 : 1.6,
          ease: SILK,
          delay: next - now,
          onStart: () => p.classList.add("is-building"),
          onComplete: () => {
            p.classList.remove("is-building");
            gsap.set(p, { clearProps: "transform" });
          },
        },
      );
      next += backlog > 3 ? gap / 3 : gap;
    }
    next += 0.3; // a breath between blocks
  };
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
