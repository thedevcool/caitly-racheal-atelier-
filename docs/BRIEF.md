# Build brief: Caitly Racheal Atelier website

> The approved design is in `design-reference/index.html`, with its artwork in `design-reference/img/`.
> Open it in a browser before writing any code. **The design is approved. Match it; don't reinvent it.**

---

## 1. What we're building

A premium personal-brand website for **Caitly Racheal**, a creative director and visual storyteller. It has two parts:

1. **The public site:** a gallery-like, art-led site that shows her work and turns visitors into enquiries.
2. **An admin area (`/admin`):** where Caitly edits all text, replaces placeholder artwork with her real work, manages packages and reads enquiries. She must never need a developer for content changes.

**Brand:** Caitly Racheal Atelier (아틀리에)
**Title:** Creative Director & Visual Storyteller
**Hero line:** "I breathe _life_ into brands." (Korean line above it: 숨을 불어넣다 · to breathe life into)
**Positioning:** One studio with four "rooms". Video ads lead the offer.

| Room               | Korean | Service                                              | Role                            |
| ------------------ | ------ | ---------------------------------------------------- | ------------------------------- |
| The Screening Room | 상영관 | UGC & AI video ads                                   | **Lead offer.** Most prominent. |
| The Shopfront      | 가게   | Etsy product design & listings                       | Grow                            |
| The Studio         | 작업실 | Squarespace & travel/tour websites                   | Premium                         |
| The Library        | 서재   | Research & academic support (Google Scholar, Scopus) | Quiet wing, calmer styling      |

**The feeling:** luxury atelier, gallery opening, Korean editorial. Black, ivory and champagne gold. Art and beauty first. Every screen should feel considered, alive and touchable.

---

## 2. Tech stack (use exactly this unless something blocks you)

- **Next.js 15** (App Router, React Server Components, Server Actions), **TypeScript** (strict)
- **Tailwind CSS v4**, with design tokens as CSS variables (section 4)
- **Motion** (`motion/react`, formerly Framer Motion) for component animation and gestures
- **GSAP + ScrollTrigger** for scroll-driven sequences (hero, parallax, pinned sections)
- **Lenis** for smooth scrolling, synced with GSAP's ticker
- **Prisma** + **PostgreSQL** (Neon or Vercel Postgres). Not SQLite: the site deploys to Vercel, where the filesystem doesn't persist.
- **Vercel Blob** for image and video uploads (Cloudinary is an acceptable alternative; keep it behind a `lib/storage.ts` interface)
- **Auth.js v5** (Credentials provider) for the single admin login
- **Nodemailer** over SMTP for contact emails (section 7)
- **Zod** for validating every form and Server Action
- **next/font** for fonts. Self-host them; no runtime Google Fonts requests.
- Deploy target: **Vercel**

Package manager: pnpm. Lint with ESLint and format with Prettier.

---

## 3. Information architecture

### Public routes

- `/`: the one-page home, following the reference section by section (section 5)
- `/work/[room]`: a full gallery for each room (`screening`, `shopfront`, `studio`, `library`), with filters and a lightbox
- `/work/[room]/[slug]`: optional case-study page for a single piece (build it if time allows; the admin toggles it per item)
- `/privacy`: a short privacy note about the contact form
- `not-found`: an on-brand 404 page (small ink-wash image with "This room is empty. 이 방은 비어 있어요." and a link home)

### Admin routes (all protected)

- `/admin/login`
- `/admin`: dashboard with new-enquiry count, a "placeholders left to replace" checklist, and quick links
- `/admin/content`: hero, statement, contact section and footer text
- `/admin/rooms`: edit each room's copy, chips, CTA label, order and visibility
- `/admin/work`: portfolio items (upload, replace, reorder, feature, hide)
- `/admin/packages`: pricing packages per room
- `/admin/testimonials`: real testimonials only. The section stays hidden while this list is empty.
- `/admin/enquiries`: inbox (list, detail, status, reply-by-email link)
- `/admin/settings`: social links, contact display email, SEO title/description, OG image, notification email, site-wide on/off switch for the custom cursor

---

## 4. Design system (from the approved reference)

### Colour tokens

```css
--bg: #0b0b0c; /* ink black, main ground */
--ink: #ede6da; /* ivory text on dark */
--muted: #b3aa9c; /* secondary text on dark */
--gold: #d4b47a; /* champagne accent, CTAs, Korean labels */
--line: rgba(237, 230, 218, 0.14);
--wall: #e7dfd1; /* Shopfront ivory wall */
--wall-ink: #1a1715;
--paper: #efe8db; /* Library paper */
--seal: #8c2e26; /* Library accent, Korean seal red */
--dusk: #14162a; /* Studio band */
```

Every text/background pair must pass WCAG AA (4.5:1 for body text).

### Type

- Display: **Cormorant Garamond** (400/500/600 plus italics). Hero up to `clamp(64px, 11.5vw, 176px)`, line-height .86, letter-spacing -0.035em.
- Body: **Inter** (300/400/500/600), 16–18px.
- Korean: **Nanum Myeongjo** (400/700) for all Hangul labels.
- Section titles: `clamp(40px, 5.4vw, 76px)`, line-height 1, `text-wrap: balance`.

### Layout

- Content max width 1240px. Bands run full width.
- Section padding `clamp(64px, 9vw, 140px)` vertical, `max(5vw, 20px)` horizontal.
- Rooms are 2-column grids (5/7 split) that alternate sides and stack below 900px.
- Pill buttons, at least 52px tall.

### Korean editorial details (keep them)

- A Korean name next to every room title, set in Nanum Myeongjo, in gold.
- A vertical Korean name (`writing-mode: vertical-rl`) beside her portrait on the About section.
- Korean micro-copy: 함께 만들어요 (let's make something), 감사합니다 (thank you), 아름다움은 팔린다 (beauty sells).
- The red seal stamp (美) on the Library ink-wash image.

---

## 5. Home page, section by section

Build each section as its own component in `components/sections/`. All copy comes from the database (section 6), seeded with the reference copy.

1. **Hero**: full-bleed silk image with a dark gradient on the left. Korean line, huge headline, short intro, two CTAs ("Commission a piece", "See the work"). Transparent nav over the image.
2. **Statement**: centred serif line: "Your business already has a story. I give it a _face_, a _voice_ and a _shopfront_." The italic words are gold.
3. **Screening Room**: copy, chips and CTA on the left. On the right, three phone mockups (outer two tilted) playing her reels.
4. **Shopfront**: ivory wall section. Three framed prints hung like a gallery wall, a collection label under them, copy on the other side.
5. **Studio**: dusk-blue band. A browser mockup showing a sample travel site (hero image, nav, headline, three tour cards), with copy beside it.
6. **Library**: paper section in calm, text-led styling, ending in the full-width ink-wash painting.
7. **Packages strip**: featured packages pulled from the database, linked to their rooms. Hidden if none are published.
8. **Testimonials**: hidden while empty. Never seed fake testimonials.
9. **Commission (contact)**: "Let's make you _unforgettable_." over the wide silk image, with a frosted-glass form card.
10. **Footer**: copyright, social links, Korean tagline.

The `/work/[room]` pages reuse the same tokens. Each room page has a large title with its Korean name, a filter row, a responsive gallery, a lightbox, its packages and a "next room" link.

---

## 6. Data model (Prisma)

```prisma
model SiteSettings {
  id               Int      @id @default(1)
  heroKorean       String
  heroHeadline     String   // supports *italic* markdown for the gold-italic word
  heroIntro        String
  heroImageId      String?
  statement        String
  contactHeadline  String
  contactIntro     String
  contactImageId   String?
  displayEmail     String?
  notifyEmail      String   // where enquiry notifications go (her own inbox)
  instagram        String?
  tiktok           String?
  etsy             String?
  seoTitle         String
  seoDescription   String
  ogImageId        String?
  cursorEnabled    Boolean  @default(true)
  updatedAt        DateTime @updatedAt
}

model Room {
  id         String   @id @default(cuid())
  slug       String   @unique  // screening | shopfront | studio | library
  name       String
  korean     String
  headline   String
  body       String
  chips      String[]
  ctaLabel   String
  theme      String   // dark | wall | dusk | paper
  order      Int
  visible    Boolean  @default(true)
  works      Work[]
  packages   Package[]
}

model Work {
  id            String   @id @default(cuid())
  roomId        String
  room          Room     @relation(fields: [roomId], references: [id])
  title         String
  slug          String   @unique
  category      String?  // Beauty, Fashion, Travel, Product, Printable…
  hook          String?  // ad hook line shown as a caption on reels
  client        String?
  description   String?
  mediaType     MediaType
  mediaId       String
  posterId      String?  // still image for videos
  externalUrl   String?
  featured      Boolean  @default(false)
  isPlaceholder Boolean  @default(false)
  showCaseStudy Boolean  @default(false)
  order         Int
  visible       Boolean  @default(true)
  createdAt     DateTime @default(now())
}

enum MediaType { IMAGE VIDEO }

model Media {
  id        String   @id @default(cuid())
  url       String
  kind      MediaType
  width     Int?
  height    Int?
  blurData  String?  // tiny base64 placeholder for next/image
  alt       String
  bytes     Int
  createdAt DateTime @default(now())
}

model Package {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id])
  name      String
  korean    String?
  priceFrom String   // free text, e.g. "From $250"
  items     String[]
  featured  Boolean  @default(false)
  order     Int
  visible   Boolean  @default(true)
}

model Testimonial {
  id       String  @id @default(cuid())
  quote    String
  name     String
  role     String?
  order    Int
  visible  Boolean @default(true)
}

model Enquiry {
  id        String        @id @default(cuid())
  name      String
  email     String
  room      String
  budget    String?
  message   String
  status    EnquiryStatus @default(NEW)
  emailSent Boolean       @default(false)
  ipHash    String?
  createdAt DateTime      @default(now())
}

enum EnquiryStatus { NEW READ REPLIED ARCHIVED }
```

**Seed script (`prisma/seed.ts`):** upload every image in `design-reference/img/` to storage. Create the four rooms, the sample work items and the packages from the reference, with every sample item set to `isPlaceholder: true`. Package prices start as "From [your price]". Seed no testimonials.

---

## 7. Contact form and email (personal email with an app password)

Caitly uses her **personal email account** with an **app password**, not a transactional email service. When someone submits the form, the site **emails her own inbox** with the enquiry. She replies from her normal mail app.

### Flow

1. The visitor submits the form. A Server Action validates it with Zod (name 2–80 characters, valid email, room from the enum, message 10–4000 characters).
2. Spam checks:
   - a **honeypot** field (hidden, must be empty)
   - a **minimum fill time** (reject anything submitted under 3 seconds after render)
   - a **rate limit** of 5 per IP per hour; store a hash of the IP, never the raw IP
   - optional Cloudflare Turnstile behind an env flag
3. **Save the enquiry to the database first**, so nothing is lost if email fails.
4. Send the notification email with Nodemailer:
   - **from:** her own address (SMTP_USER). Personal mail providers reject other "from" addresses.
   - **to:** `SiteSettings.notifyEmail` (default: SMTP_USER)
   - **replyTo:** the visitor's email, so pressing Reply in her inbox answers the client directly
   - **subject:** `New commission enquiry · {Room} · {Name}`
   - **body:** an on-brand HTML email (black/ivory/gold, inline styles) plus a plain-text version, with all fields and a button to open the enquiry in `/admin/enquiries/[id]`
5. Set `emailSent = true` on success. On failure, log the error, keep the enquiry, and still show the visitor success (the enquiry is safe in the admin inbox). The admin dashboard shows a warning badge for unsent notifications, with a "Retry send" button.
6. The visitor sees the animated thank-you state: 감사합니다, and a promise to reply within two working days.
7. Optional, off by default, toggled in Settings: a short confirmation email to the visitor.

### SMTP config (`lib/mail.ts`)

```ts
nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com for Gmail
  port: Number(process.env.SMTP_PORT), // 465
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_APP_PASSWORD },
});
```

Keep it provider-agnostic: only env values change if she uses a different email provider.

**Gmail app password (put these steps in the README for Caitly):** turn on 2-Step Verification on her Google account → Google Account → Security → App passwords → create one named "Website" → paste the 16-character password into `SMTP_APP_PASSWORD` on Vercel. Never commit it. Personal accounts have daily sending limits, which is fine for enquiry notifications.

**Mail rules:**

- Mail sending runs only on the server, in the Node.js runtime (not Edge).
- Escape all visitor input before it goes into the HTML email.
- Never echo SMTP errors to the browser.

---

## 8. Admin area

**Auth:**

- Auth.js Credentials provider with one admin account.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` (bcrypt) live in env.
- Rate-limit login attempts, use secure httpOnly session cookies, and protect every `/admin` route and admin Server Action in middleware **and** inside each action.
- Include `pnpm admin:hash` to generate the password hash.

**Admin UX:** the admin should feel like part of her atelier, not a generic dashboard. Use the same fonts and colours in a calmer, lighter layout.

- **Placeholder checklist** on the dashboard lists every `isPlaceholder` item, each with a thumbnail and a **"Replace"** button. Uploading new media clears the flag.
- **Media upload:**
  - drag-and-drop or tap-to-upload (works on phone; she will often update from her phone)
  - accepts images (jpg, png, webp, avif, max 10 MB) and video (mp4, webm, max 80 MB)
  - images get width/height and a blur placeholder generated on upload
  - videos need a poster image (upload one, or pick a frame)
  - alt text is required
- **Reorder** work, packages and testimonials by dragging (dnd-kit), with up/down buttons for touch and keyboard.
- **Live preview:** each editor has a "Preview" button that opens the public page with draft changes, or a side-by-side preview on desktop.
- **Inline validation** and friendly empty states.
- **Changes go live on save:** call `revalidatePath`/`revalidateTag` for the affected public pages.
- **Enquiry inbox:**
  - filters (New / Read / Replied / Archived) and search
  - opening an enquiry marks it Read
  - "Reply" opens `mailto:` with subject and body pre-filled; she can also mark it Replied
  - CSV export
- **Settings** includes a "Send test email" button that checks her app password is working.
- **Mobile:** the admin must be fully usable at 390px wide.

---

## 9. Animation and touch (essential; this is what sells her)

Every motion should feel **slow, silky and expensive**. Use eased curves (`cubic-bezier(0.22, 1, 0.36, 1)`), 600–1200 ms reveals, no bouncy springs on large elements, and nothing that feels like a template. Animate only `transform`, `opacity` and `filter`, and keep everything at 60fps on a mid-range Android phone.

### Global

- **Lenis smooth scroll**, synced with GSAP ScrollTrigger. Turn it off when `prefers-reduced-motion` is set.
- **Page load:** a 1.2 s intro. Ivory "Caitly Racheal" with 아틀리에 fades in on black, then a champagne line wipes and reveals the hero. Show it once per session (sessionStorage).
- **Route transitions:** a soft fade with a slight upward drift, plus a thin gold progress line at the top.
- **Section reveals:** headings rise line by line from a mask (split text into lines), body text fades after them, chips stagger in at 60 ms each.
- **Custom cursor (desktop and fine pointers only):**
  - a small ivory dot with a trailing ring
  - over links it grows and shows a word: "View", "Play", "Enter" or "Open", taken from a `data-cursor` attribute
  - mix-blend-mode difference over images
  - turned off on touch devices and toggleable in Settings
- **Magnetic buttons:** primary CTAs pull gently toward the pointer (max 8px), and press down to scale 0.97 on tap.
- **Film grain:** a very subtle animated grain overlay on dark sections (CSS, at most 4% opacity).

### Hero

- The silk image drifts in a slow Ken Burns move, plus parallax on scroll (image moves at 0.6× scroll speed).
- On pointer devices, the silk shifts slightly with the mouse (max 12px). On phones, use device orientation for the same effect, but only after a user gesture, and skip it if permission isn't granted.
- The headline reveals word by word on load. "life" shimmers once with a champagne gradient sweep.
- Optional upgrade (build it last, behind a flag): a WebGL silk shader with a pointer ripple, falling back to the image.

### Statement

- Scroll-scrubbed: words go from 20% to 100% opacity as the section scrolls past. "face", "voice" and "shopfront" turn gold in turn.

### Screening Room

- The three phones enter fanned from the bottom, settle into their tilt, then float slightly out of sync.
- **3D tilt** on hover/pointer (max 8°) with a moving specular sheen. On touch, a tap gives a gentle press.
- Reels **autoplay muted and loop** only while in view (IntersectionObserver), and pause off-screen.
  - Tapping a phone opens a **fullscreen reel viewer**: vertical swipe between reels (TikTok-style), with tap to unmute, double-tap for a heart burst, swipe down or Esc to close.
- On mobile, the phones become a **horizontal snap carousel** with swipe, dot indicators and the active phone scaled up.
- Ad captions type on when the reel becomes active.

### Shopfront

- The frames **hang in**: they drop from slightly above with a gentle settle, staggered.
- On hover or pointer movement, each frame sways a little and its shadow shifts the opposite way, as if lit from above.
- Tap or click opens a **lightbox** with pinch-zoom, swipe between images and the product details.
- On mobile, the frames become a swipeable row with peeking edges.

### Studio

- The browser mockup **scrolls its inner website** as you scroll the page, as if someone were browsing it, revealing the hero and then the tour cards.
- On hover, the tour cards lift slightly.
- On touch, the mockup can be swiped to scroll its inner page.

### Library

- Calmer motion here, on purpose. The text fades in slowly with no stagger theatrics.
- The ink-wash painting gets **layered mist parallax**: split it into 2–3 layers (export PNG layers, or use CSS masks) that move at different speeds.
- The red seal **stamps in** with a scale-down "press" and a faint ink bloom when it enters the viewport.

### Commission form

- The form card is frosted glass over silk, and the silk drifts behind it.
- Each field label floats up on focus, and a gold underline draws in.
- Submit button: a loading shimmer while sending, then the card turns to show the 감사합니다 thank-you with a soft gold particle burst (lightweight canvas, 1.2 s, skipped under reduced motion).
- Errors gently shake the field (4px, twice) and show a message under it. Never only a colour change.

### Touch and mobile

- Every tap target is at least 44×44px, and every pressed element has a visible press state.
- No information is hover-only. Everything a hover reveals must also show on tap or by default on touch.
- Swipe works on every carousel, the lightbox and the reel viewer, using native scroll-snap where possible.
- Make the mobile nav a full-screen overlay menu: room names stagger in large serif type with their Korean names beside them, and close it on Esc or swipe up.
- Don't use scroll-jacking that fights the thumb. Avoid pinned sections on mobile if they feel stuck.
- Optional: `navigator.vibrate(10)` on successful form submit, where supported.

### Accessibility in motion

- Respect `prefers-reduced-motion`: turn off smooth scroll, parallax, tilt, the intro, the cursor and auto-playing video, and replace reveals with simple fades.
- Every animation must be skippable and must never hide content from screen readers or keyboard users.
- Videos need visible controls in the fullscreen viewer and a pause control.

---

## 10. Performance, SEO, accessibility

- **Performance:** LCP under 2.5 s on 4G. Hero image via `next/image` with `priority`, AVIF/WebP and a blur placeholder. Lazy-load everything below the fold. Videos use `preload="none"` with a poster. Dynamic-import GSAP and the heavy animation modules. Lighthouse 90+ on mobile for Performance, Accessibility and SEO.
- **SEO:** metadata from SiteSettings, an OG image (default: the silk hero with her name), `sitemap.xml`, `robots.txt`, and JSON-LD `Person` + `ProfessionalService`.
- **Accessibility:**
  - semantic landmarks, logical heading order and visible focus rings
  - alt text required on uploads
  - form labels and errors linked with `aria-describedby`
  - AA contrast on every theme band
  - `lang="ko"` on Korean spans
- **Analytics:** Vercel Analytics, privacy-friendly with no cookie banner needed.

---

## 11. Security

- Validate every Server Action with Zod and check the admin session server-side inside each admin action.
- Upload checks: verify MIME type and size on the server, randomise filenames, and reject SVG uploads (XSS risk).
- Render visitor and admin text as text, never `dangerouslySetInnerHTML`. The `*italic*` headline syntax is parsed into React elements, not HTML.
- Set security headers in `next.config` (CSP, X-Frame-Options, Referrer-Policy).
- Secrets live only in env. Commit a complete `.env.example` with placeholder values and no real secrets.

### `.env.example`

```
DATABASE_URL=
AUTH_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
BLOB_READ_WRITE_TOKEN=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=her.address@gmail.com
SMTP_APP_PASSWORD=
NEXT_PUBLIC_SITE_URL=
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

---

## 12. Build order (phase by phase; check in after each phase)

1. **Foundation:** Next.js app, Tailwind tokens, fonts, Prisma schema, seed with the reference content and images, static home page matching the reference pixel-for-pixel (no animation yet).
2. **Content from the database:** wire every section to Prisma data. Build the `/work/[room]` pages, lightbox and reel viewer.
3. **Contact and email:** Server Action, spam protection, save to the database, Nodemailer with the app password, branded email template, thank-you state, test-email button.
4. **Admin:** auth, dashboard, placeholder checklist, editors, media upload, reorder, enquiry inbox, settings.
5. **Motion and touch:** everything in section 9, done carefully, tested on a real phone.
6. **Polish:** performance, SEO, accessibility audit, 404, README for Caitly (how to log in, replace placeholders, set her app password).

**Definition of done:**

- Caitly can log in on her phone, replace every placeholder, change any text and price, and see it live.
- A test enquiry lands in her inbox with Reply going to the client, and also appears in the admin inbox.
- The site matches the reference design, feels smooth on a mid-range Android phone, and scores 90+ in mobile Lighthouse.

---

## 13. Rules for contributors

- **MOBILE FIRST IS A HARD RULE.** Design and build for a phone first; larger screens are an enhancement.
  - CSS: base styles are the phone layout. Use only `min-width` media queries (breakpoints 601px and 901px for
    the site, 521px and 801px for the admin). Never add a `max-width` layout query; `tests/unit/mobile-first.test.ts`
    fails the build if one appears.
  - Every page must pass `tests/e2e/mobile.spec.ts` at 320, 360, 390 and 414px: no sideways scroll, 44×44px tap
    targets, 16px+ form fields, 12px+ text. The phone Playwright project runs first.
  - New features start with the phone interaction (thumb reach, swipe, tap), then add hover/pointer extras for
    desktop. Nothing may depend on hover alone.
  - Check performance on mobile Lighthouse, not desktop.

- The reference design is approved. Don't change the layout, palette or type without asking.
- Never invent testimonials, client names, results or statistics. Use clearly marked placeholders and the `isPlaceholder` flag.
- Ask before adding any paid service beyond those listed.
- Keep components small and typed, and comment any non-obvious animation code.
- After each phase, summarise what was built, what is left and anything Caitly needs to do (accounts, env values).

---

## 14. Additions agreed after the brief

- **Dark and light mode.** The approved reference is the dark theme. Light mode is an ivory gallery-wall version (`--bg #F6F1E8`, ink `#1A1715`, deep champagne `#7A5A2C` for accents so they pass AA on ivory). The gold CTA fill stays `#D4B47A` in both. Themed rooms keep their own palette in both modes: Shopfront (wall), Studio (dusk) and Library (paper). The hero and contact bands switch their scrim from ink to ivory. Visitors toggle with the sun/moon button in the nav; the first-visit default is `SiteSettings.defaultTheme` (dark | light | system). Tokens live in `app/globals.css` as tone classes (`.tone-dark`, `.tone-light`, `.tone-wall`, `.tone-dusk`, `.tone-paper`); components never hard-code colour.
- **Schema additions** (all marked `added:` in `prisma/schema.prisma`): editable hero CTA labels, contact Korean line and button, footer tagline and note, `Room.navLabel`, `Room.service`, `Room.galleryTitle`/`galleryCaption`, `Work.meta` (mockup details such as the Studio tour cards), `SiteSettings.defaultTheme`, `SiteSettings.confirmVisitor`.
- **Fidelity notes:** the reference's middle frame `margin-top:-24px` is overridden by its inline `margin:0`, so the approved render has all three frames top-aligned; we match the render. On phones (≤600px) the hero scrim is taller so the intro passes AA over the bright silk.
- **Seeded packages are drafts** (`visible: false`, price "From [your price]"), so the Packages strip stays hidden until Caitly sets real prices.
- **The page breathes** (requested by the client after phase 1). One shared 10s rhythm (≈4s inhale, 6s exhale) makes the artwork and hero headline swell and settle together, and a fixed vignette over the whole viewport (`.breath-veil`) opens on the inhale. Only transform and opacity animate. A pause button sits beside the theme toggle (WCAG 2.2.2) and is remembered; `prefers-reduced-motion` turns it all off. In phase 5, keep every new animation in step with `--breath-dur` and don't fight it: the Ken Burns drift and parallax sit on the image inside `.hero-media`, which itself breathes.
- **Pages assemble themselves (requested by the client).** Every time a visitor opens a page, it arrives in
  pieces flung all over (and off) the screen, spinning and at odd sizes, over faint gold gridlines, and slowly flies into place (on the home page the silk
  first drops in as a small framed portrait on a gold wire, swings, hangs, then widens into the full background), with thin gold "selection" frames, while a
  caption narrates it: `SiteSettings.assembleWorking` ("숨을 불어넣는 중 · Rebranding this page, live") then
  `assembleDone` ("완성 · Now imagine it's your brand."), both editable under Words. It's proof that the studio can
  rebrand a business. The first page of the session also gets the name intro. The early script in
  `app/layout.tsx` handles the first page before paint; `app/template.tsx` handles in-site navigation (tests turn it off
  with sessionStorage `atelier-seen` = `"*"`). Pure CSS with `backwards` fill (never `forwards`, so GSAP effects keep working);
  offsets from `lib/scatter.ts`; mark new first-screen elements with `piece()` / `<PieceWords>` from
  `components/Pieces.tsx`. A tap or key skips it; off under reduced motion or when motion is paused.
- **The page keeps building as you scroll (requested by the client).** Below the first screen, each heading
  (word by word), text block, chip and button arrives scattered and flies into place with a gold selection
  outline as it scrolls into view, one piece at a time from a single queue in page order (it speeds up if a
  backlog builds). `reveals()` in `components/motion/effects.ts`; tests turn it off with the same
  `atelier-seen = "*"` flag; with motion paused, pieces simply appear.
- **Phases 2–6 notes:** schema additions `LoginAttempt` (hashed-IP login rate limit) and `Draft` (Preview of
  unsaved edits via draft mode). Admin forms submit manually (no `<form action>`), because React resets a form
  after its action runs and that would wipe unsaved edits on a failed save. Uploads go browser → Vercel Blob,
  then the server checks magic bytes before creating the Media row. GSAP/Lenis load after the page is idle;
  effects batch their layout reads. The optional WebGL silk shader was not built.
