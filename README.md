# Caitly Racheal Atelier

The personal-brand website of **Caitly Racheal**, Creative Director & Visual Storyteller: a gallery-like site in
four "rooms" (video ads, Etsy design, websites, research) that turns visitors into commission enquiries, with an
admin area where Caitly edits everything herself.

- **For Caitly:** [`docs/CAITLY_GUIDE.md`](./docs/CAITLY_GUIDE.md): signing in, replacing the sample art, prices, enquiries, the Gmail app password.
- **Build brief:** [`docs/BRIEF.md`](./docs/BRIEF.md) (read before changing anything).
- **Approved design:** [`design-reference/index.html`](./design-reference/index.html). Match it; don't reinvent it.

## Mobile first (hard rule)

The site and the admin are built for phones first; larger screens are enhancements.

- **CSS:** base styles are the phone layout, with `min-width` queries only (site 601/901px, admin 521/801px). A
  unit test fails if a `max-width` media query is added.
- **Phones get:**
  - a one-row header (name + menu)
  - the theme and motion controls inside the full-screen menu
  - swipe carousels for the reels and prints
  - single-column rooms, and the hero sized with `svh` so the address bar never makes it jump
- **Enforced in CI:** every public and admin page is checked at 320, 360, 390 and 414px (no sideways scroll, 44px
  tap targets, 16px form fields, 12px+ text). The phone test project runs first.

## What's in it

**Public site**

- Home page in the approved design: hero, statement, the four rooms (phones, framed prints, a browser mockup, the
  ink-wash Library), packages, testimonials, the commission form and footer. Every word comes from the database.
- `/work/[room]`: each room's gallery with category filters, a lightbox (swipe, pinch and double-tap zoom) or a
  TikTok-style reel viewer (swipe, tap for sound, double-tap heart), its packages and a "next room" link.
  `/work/[room]/[slug]` case studies, switched on per piece. `/privacy`, and an on-brand 404.
- **Dark and light mode.** Dark is the approved design; light is an ivory gallery-wall version. The Shopfront,
  Studio and Library keep their own palettes in both.
- **The page breathes**: one shared 10-second breath (≈4s in, 6s out) across the artwork and the hero headline,
  with a vignette that opens on the inhale. A pause button sits beside the theme toggle.
- **Motion (brief §9):**
  - smooth scroll (Lenis + GSAP) and a once-per-session intro
  - route fades with a gold progress line
  - headings that rise line by line
  - hero parallax, pointer and tilt shift
  - the statement's scroll-scrubbed words
  - phones that fan in, float and tilt, frames that hang and sway, a Studio browser that scrolls itself
  - Library mist parallax and a seal that stamps in
  - custom cursor, magnetic buttons, film grain, a full-screen phone menu

  All of it is off under `prefers-reduced-motion`.

- **Commission form:**
  - Zod validation (shared rules in the browser, no Zod shipped to the client)
  - honeypot, a signed 3-second minimum fill time, a 5-per-hour rate limit on a hashed IP, optional Turnstile
  - saves first, then emails Caitly's own inbox through her app password, with Reply-To set to the visitor
  - an on-brand HTML and plain-text email

**Admin (`/admin`)**

- **Login:** Auth.js credentials login for one admin, rate-limited. Middleware guards every page, and every action
  checks the session again.
- **Dashboard:** new enquiries, a "Retry sending" for failed notifications, a placeholder checklist with Replace
  buttons, and a setup checklist.
- **Editors:** words, rooms, work, packages, testimonials and settings. Inline validation, Preview of unsaved
  changes (draft mode), drag or arrow-button reordering, and changes go live on save.
- **Uploads:**
  - straight to Vercel Blob in production, up to 80 MB
  - checked server-side by their actual bytes (no SVG, no spoofed types)
  - blur placeholders generated, alt text required, video posters (upload one or grab a frame)
- **Enquiry inbox:** filters, search, prefilled mailto replies, status, CSV export (guarded against
  spreadsheet formulas), and "Send test email".
- **Usable on a phone at 390px.**

**Polish**

- SEO: metadata from Settings, a generated share image (`/og`: silk + her name), `sitemap.xml`, `robots.txt`, and
  JSON-LD `Person` + `ProfessionalService`.
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy and Permissions-Policy.
- Accessibility: skip link, landmarks, `lang="ko"` on Hangul, visible focus, AA contrast in every tone (unit-tested),
  and axe checks in CI.

## Tech stack

Next.js 15 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS v4 tokens · Prisma 6 +
PostgreSQL · Vercel Blob · Auth.js v5 · Nodemailer 7 · Zod · Motion libraries GSAP + Lenis · next-themes ·
dnd-kit · Vitest · Playwright + axe. Package manager **pnpm**; Node **20.9+** (CI uses 22).

## Run it locally

You need Node, pnpm and Postgres (local, Docker, or a free Neon branch).

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL and DATABASE_URL_UNPOOLED (same URL locally) and AUTH_SECRET
pnpm db:deploy              # create the tables
pnpm db:seed                # load the reference content and artwork
pnpm admin:hash             # make ADMIN_PASSWORD_HASH; also set ADMIN_EMAIL in .env
pnpm dev                    # http://localhost:3000 (admin at /admin)
```

Quick local Postgres with Docker:

```bash
docker run -d --name atelier-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=atelier -p 5432:5432 postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atelier
```

Notes:

- **Uploads without a Blob token** go to `public/uploads/` (git-ignored). `pnpm dev` serves new files straight
  away; `pnpm start` only serves files that existed at build time. Production always uses Vercel Blob. Never seed a
  production database without `BLOB_READ_WRITE_TOKEN`, or image URLs will point at files that don't exist.
- **The seed is safe to re-run:** it does nothing if content exists. `pnpm db:seed -- --reset` wipes and reseeds a
  development database (refused in production). After a reset, delete `.next/cache` so pre-rendered pages don't
  reuse old content.
- **Email locally:** leave the `SMTP_*` values empty and enquiries are saved without sending (the dashboard shows a
  warning). Or point them at a real account to test.

## Environment variables

See [`.env.example`](./.env.example). Never commit real values.

| Variable                                     | Purpose                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`                               | Postgres (the pooled URL on Vercel)                                       |
| `DATABASE_URL_UNPOOLED`                      | Direct connection, used by migrations                                     |
| `AUTH_SECRET`                                | Signs sessions and form tokens. `openssl rand -base64 32`                 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`         | The one admin login. Hash from `pnpm admin:hash` (base64, so `$` is safe) |
| `BLOB_READ_WRITE_TOKEN`                      | Vercel Blob for images and video                                          |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`      | Defaults are Gmail: `smtp.gmail.com`, `465`, `true`                       |
| `SMTP_USER`, `SMTP_APP_PASSWORD`             | Caitly's address and its app password (see the guide)                     |
| `NEXT_PUBLIC_SITE_URL`                       | Canonical URL, e.g. `https://caitlyracheal.com`                           |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile on the contact form (both or neither)       |

## Scripts

| Script                                                | What it does                                                         |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm dev` / `build` / `start`                        | Next.js                                                              |
| `pnpm vercel-build`                                   | What Vercel runs: generate, migrate, seed (no-op once seeded), build |
| `pnpm db:deploy` / `db:migrate` / `db:seed`           | Apply migrations / create one / seed                                 |
| `pnpm admin:hash`                                     | Make `ADMIN_PASSWORD_HASH`                                           |
| `pnpm lint` / `typecheck` / `format` / `format:check` | Quality checks                                                       |
| `pnpm test`                                           | Unit tests (Vitest)                                                  |
| `pnpm test:e2e`                                       | Browser tests (Playwright) against a production build                |

## Tests and CI

- **Unit (`tests/unit`, 63 tests):**
  - the `*italic*` parser, including that admin-entered HTML never renders
  - WCAG AA contrast for every token in all five tones
  - browser/server validation parity
  - the signed fill-time token
  - email escaping and subject format
- **Browser (`tests/e2e`, phone first, then desktop, 88 tests):**
  - every page and room renders with no console errors
  - lightbox, reel viewer, the phone menu, dark/light, the breath and its pause button, reduced motion, the intro
  - the contact form end to end (including the 3-second rule)
  - the admin: lockout, login, a failed save keeps edits, Preview, uploads checked by bytes, an enquiry reaching
    the inbox, CSV
  - the mobile-first audit at four phone widths, on every public and admin page
  - axe on every page type in both themes
  - SEO files and security headers

  Admin tests need `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` and `E2E_ADMIN_PASSWORD`.

[GitHub Actions](./.github/workflows/ci.yml) runs both on every PR and push to `main`. The E2E job uses a fresh
Postgres and the same migrate → seed → build steps as Vercel, with a throwaway CI-only admin login.

## Deploying to Vercel

1. Import the GitHub repo in Vercel (Next.js and pnpm are detected).
2. **Storage → Neon Postgres**, connected to all environments (sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`).
3. **Storage → Blob**, connected (sets `BLOB_READ_WRITE_TOKEN`). Do this before the first deploy.
4. **Settings → Environment Variables:** `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SMTP_USER`,
   `SMTP_APP_PASSWORD`, `NEXT_PUBLIC_SITE_URL` (and optionally the Turnstile keys).
5. Deploy. `pnpm vercel-build` migrates, seeds the first time (uploading the artwork to Blob) and builds.
6. **Analytics → Enable** for privacy-friendly visit counts (no cookie banner needed).
7. Sign in at `/admin`, then **Settings → Send test email**.

Schema changes: `pnpm db:migrate` locally, commit the new `prisma/migrations/` folder; the next deploy applies it.

## Performance

Measured on a production build with mobile Lighthouse (Moto G-class device, slow 4G):

- **Home, with DevTools throttling:** Performance 90, Accessibility 97, Best Practices 96, SEO 100. LCP 1.9s, CLS 0.
- **Home, Lighthouse's default simulated throttling (what PageSpeed Insights uses):** Performance about 83.
- **Room pages:** Performance 84–86; Accessibility 100; SEO 100.
- **What keeps the score up:**
  - GSAP and Lenis load only after the page is idle
  - effects set up in small tasks with batched layout reads
  - the hero is preloaded with `fetchpriority="high"`
  - the intro overlay is 96% opaque so the hero paints beneath it
  - variable fonts are self-hosted
- **The remaining lever:** the Korean font (about 135 kB of glyph files) loads with the page. Deferring it scored
  about 85–89 but made the Korean labels swap fonts visibly, so it's left as a design decision.
  Re-check on PageSpeed Insights after deploying, since Vercel's CDN changes the network side.

Not built: the optional WebGL silk shader (brief §9, "optional, build last, behind a flag").

## Where things live

```
app/
  page.tsx, work/, privacy/   public pages        admin/          the admin (actions/, (panel)/, login/)
  globals.css                 tokens, tones, breath, motion       api/            uploads, preview, auth
  og/                         generated share image               sitemap.ts, robots.ts
components/
  sections/   home sections   work/  gallery, phones, frames      viewers/  lightbox, reels
  motion/     Lenis + GSAP effects, cursor, progress              admin/    editor building blocks
lib/          content queries, mail, storage, media checks, validation, drafts, auth helpers
prisma/       schema, migrations, seed (+ seed-assets/)           tests/    unit + e2e
docs/         CAITLY_GUIDE.md
```

## Rules for contributors

- The reference design is approved: don't change layout, palette or type without asking Caitly.
- Never invent testimonials, client names, results or statistics. Use the `isPlaceholder` flag.
- Colours come from tokens in `app/globals.css`; the contrast test fails if a token drops below AA.
- Animate only `transform`, `opacity` and `filter`. Keep a CSS animation and a GSAP transform off the same element
  (the hero and frames use nested wrappers for this). Respect `prefers-reduced-motion`.
- Avoid Prettier plugins that rewrite class strings: one once broke the room layout by stripping a space.
