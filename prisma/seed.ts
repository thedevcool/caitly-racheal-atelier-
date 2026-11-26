/**
 * Seeds the site with the approved reference content (brief section 6).
 *  - Uploads every image in design-reference/img/ to storage.
 *  - Creates the four rooms, sample work (all isPlaceholder: true) and draft packages.
 *  - Seeds NO testimonials.
 *
 * Safe by default: if the site already has content it does nothing, so a re-run
 * can never overwrite Caitly's edits. `pnpm db:seed -- --reset` wipes and reseeds
 * (development only).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, MediaType } from "@prisma/client";
import { storage } from "../lib/storage";
import { describeImage } from "../lib/image";

const db = new PrismaClient();
const IMG = path.join(process.cwd(), "design-reference", "img");

async function upload(file: string, alt: string) {
  return uploadFrom(path.join(IMG, file), alt);
}

async function uploadFrom(file: string, alt: string) {
  const data = await readFile(file);
  const stored = await storage.put(data, "jpg", "image/jpeg");
  const info = await describeImage(data);
  return db.media.create({
    data: { url: stored.url, kind: MediaType.IMAGE, alt, bytes: stored.bytes, ...info },
  });
}

async function main() {
  const reset = process.argv.includes("--reset");
  if (reset) {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production.");
    await db.$transaction([
      db.work.deleteMany(),
      db.package.deleteMany(),
      db.room.deleteMany(),
      db.media.deleteMany(),
      db.siteSettings.deleteMany(),
    ]);
  } else if (await db.siteSettings.findUnique({ where: { id: 1 } })) {
    console.log("Site already has content; nothing seeded. Use --reset to start over (dev only).");
    return;
  }

  const hero = await upload("silk-champagne.jpg", "Champagne silk folding in soft studio light");
  const wide = await upload("silk-wide.jpg", "Wide champagne silk drifting in soft light");

  await db.siteSettings.create({
    data: {
      id: 1,
      heroKorean: "숨을 불어넣다 · to breathe life into",
      heroHeadline: "I breathe *life* into brands.",
      heroIntro:
        "Creative director and visual storyteller. Video ads that stop the scroll, products that sell themselves, and websites that feel like walking into a gallery.",
      heroImageId: hero.id,
      statement: "Your business already has a story. I give it a *face*, a *voice* and a *shopfront*.",
      contactHeadline: "Let’s make you *unforgettable*.",
      contactIntro:
        "Tell me what you’re making and which room it belongs to. I reply within two working days with ideas and next steps.",
      contactImageId: wide.id,
      footerNote:
        "Artwork on this preview is studio-rendered sample art. Caitly’s own client work replaces it on the live site.",
      notifyEmail: "", // empty = send to SMTP_USER (her own inbox); editable in Settings
      seoTitle: "Caitly Racheal Atelier · Creative Director & Visual Storyteller",
      seoDescription:
        "Video ads that stop the scroll, Etsy products that sell themselves, and websites that feel like walking into a gallery. Commission Caitly Racheal.",
      // ogImageId left empty: the generated default (silk + her name) is used until she picks one
    },
  });

  // ---- Rooms ---------------------------------------------------------------
  const screening = await db.room.create({
    data: {
      slug: "screening",
      name: "The Screening Room",
      korean: "상영관",
      navLabel: "Video ads",
      service: "Video ads (UGC / AI)",
      headline: "Ads people *actually* watch.",
      body: "UGC and AI-assisted video ads for TikTok, Reels and Shorts. Each one opens with a hook, carries a feeling and ends with a reason to tap. Monthly packs keep fresh creative coming.",
      chips: ["Beauty", "Fashion", "Travel", "Product", "AI commercials"],
      ctaLabel: "Book a creative pack",
      theme: "dark",
      order: 1,
    },
  });
  const shopfront = await db.room.create({
    data: {
      slug: "shopfront",
      name: "The Shopfront",
      korean: "가게",
      navLabel: "Etsy design",
      service: "Etsy product design & listings",
      headline: "Products that sell themselves.",
      body: "Original digital and print-on-demand designs for Etsy, with mockups, titles and tags researched so shoppers stop, look and add to cart.",
      chips: ["Printables", "Wall art", "Apparel", "Mugs & totes", "Listing SEO"],
      ctaLabel: "Design my shop",
      galleryTitle: "The Marbled Collection",
      galleryCaption: "Printable wall art · three colourways",
      theme: "wall",
      order: 2,
    },
  });
  const studio = await db.room.create({
    data: {
      slug: "studio",
      name: "The Studio",
      korean: "작업실",
      navLabel: "Websites",
      service: "Website (Squarespace / travel)",
      headline: "Websites that feel like *arriving*.",
      body: "Squarespace websites for brands, with a specialty in travel, tour and hospitality businesses. Beautiful enough to stay on, clear enough to book from.",
      chips: ["Squarespace", "Tour listings", "Booking flows", "Mobile-first"],
      ctaLabel: "Plan my website",
      theme: "dusk",
      order: 3,
    },
  });
  const library = await db.room.create({
    data: {
      slug: "library",
      name: "The Library",
      korean: "서재",
      navLabel: "Research",
      service: "Research support",
      headline: "And for scholars: rigour, quietly.",
      body: "Research, sources, citations, editing and journal guidance for Google Scholar and Scopus work. Your authorship stays yours, and nothing is ever fabricated or guaranteed.",
      chips: [],
      ctaLabel: "Request a consultation",
      theme: "paper",
      order: 4,
    },
  });

  // ---- Sample work (every item is a placeholder) ---------------------------
  const reels = [
    ["reel-rose.jpg", "Rose silk sample reel", "Glow serum", "UGC", "“I stopped using foundation.”"],
    ["reel-gold.jpg", "Gold silk sample reel", "Fragrance", "AI commercial", "“Smell like late summer.”"],
    [
      "reel-midnight.jpg",
      "Midnight blue silk sample reel",
      "Winter edit",
      "Fashion",
      "“Cold never looked this soft.”",
    ],
  ] as const;
  for (const [i, [file, alt, title, category, hook]] of reels.entries()) {
    const m = await upload(file, alt);
    await db.work.create({
      data: {
        roomId: screening.id,
        title,
        slug: `sample-reel-${i + 1}`,
        category,
        hook,
        mediaType: MediaType.IMAGE, // poster only until her real reels are uploaded
        mediaId: m.id,
        featured: true,
        isPlaceholder: true,
        order: i,
      },
    });
  }

  const prints = [
    ["print-marble-1.jpg", "Marbled art print in ivory, ink and rose", "Marble · Ink & Rose"],
    ["print-marble-2.jpg", "Marbled art print in ivory, navy, gold and sage", "Marble · Navy & Gold"],
    ["print-marble-3.jpg", "Marbled art print in blush and champagne", "Marble · Blush"],
  ] as const;
  for (const [i, [file, alt, title]] of prints.entries()) {
    const m = await upload(file, alt);
    await db.work.create({
      data: {
        roomId: shopfront.id,
        title,
        slug: `sample-print-${i + 1}`,
        category: "Printable",
        mediaType: MediaType.IMAGE,
        mediaId: m.id,
        featured: true,
        isPlaceholder: true,
        order: i,
      },
    });
  }

  const travel = await upload("travel-dusk.jpg", "Coastal town at dusk on a sample travel website");
  await db.work.create({
    data: {
      roomId: studio.id,
      title: "Island Escapes",
      slug: "sample-island-escapes",
      category: "Travel",
      hook: "Where the evening\nslows down.",
      description: "Small-group coastal tours, curated with care.",
      externalUrl: "islandescapes.travel",
      mediaType: MediaType.IMAGE,
      mediaId: travel.id,
      meta: {
        nav: "Tours · Stays · Journal · Book",
        tours: [
          { name: "Sunset Coast", detail: "6 hours · small group" },
          { name: "Ridge at Dawn", detail: "Full day · guided hike" },
          { name: "Lantern Harbour", detail: "Evening · food walk" },
        ],
      },
      featured: true,
      isPlaceholder: true,
      order: 0,
    },
  });

  // The red seal is stamped on by the site (see Library), so the placeholder painting is seal-free.
  const ink = await uploadFrom(
    path.join(process.cwd(), "prisma", "seed-assets", "inkwash-unsealed.jpg"),
    "Korean ink-wash painting of misty mountain ridges",
  );
  await db.work.create({
    data: {
      roomId: library.id,
      title: "Ink-wash ridges",
      slug: "sample-inkwash",
      mediaType: MediaType.IMAGE,
      mediaId: ink.id,
      featured: true,
      isPlaceholder: true,
      order: 0,
    },
  });

  // ---- Packages: drafts (hidden) until Caitly sets real prices --------------
  const pkgs: [string, string, string[]][] = [
    [
      screening.id,
      "Single ad",
      ["One vertical video ad", "Hook, script and edit", "Sized for TikTok, Reels and Shorts"],
    ],
    [
      screening.id,
      "Monthly creative pack",
      ["A set of fresh ads each month", "Hook variations for testing", "UGC or AI-assisted"],
    ],
    [shopfront.id, "Shop launch", ["Original designs", "Mockups", "Titles and tags researched"]],
    [studio.id, "Squarespace website", ["Design and build", "Tour or booking pages", "Mobile-first"]],
    [library.id, "Research consultation", ["Sources and citations", "Editing", "Journal guidance"]],
  ];
  for (const [i, [roomId, name, items]] of pkgs.entries()) {
    await db.package.create({
      data: { roomId, name, priceFrom: "From [your price]", items, featured: true, visible: false, order: i },
    });
  }

  console.log("Seeded the atelier with reference content.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
