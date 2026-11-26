# Caitly Racheal Atelier

The personal-brand website of **Caitly Racheal**, Creative Director & Visual Storyteller: a gallery-like site in
four "rooms" (video ads, Etsy design, websites, research) that turns visitors into commission enquiries, with an
admin area where Caitly edits everything herself.

- **Build brief:** [`docs/BRIEF.md`](./docs/BRIEF.md) (read this before changing anything)
- **Approved design:** [`design-reference/index.html`](./design-reference/index.html). Match it; don't reinvent it.

## Status

| Phase                                                                   | State   |
| ----------------------------------------------------------------------- | ------- |
| 1. Foundation: tokens, fonts, data model, seed, home page               | Done    |
| Dark/light mode and the "breathing" page                                | Done    |
| CI: lint, types, formatting, unit and browser tests                     | Done    |
| 2. `/work/[room]` galleries, lightbox, reel viewer                      | Next    |
| 3. Contact form: Server Action, spam protection, email via app password | Planned |
| 4. Admin: login, editors, uploads, enquiry inbox, settings              | Planned |
| 5. Motion and touch (Lenis, GSAP, cursor, tilt, carousels)              | Planned |
| 6. Polish: performance, SEO, accessibility audit, Caitly's how-to guide | Planned |

Until phase 3 the contact form validates and shows the thank-you state but **does not send anything**.

## Features so far

- **Every word is in the database.** All copy, rooms, work, packages and settings come from Postgres (Prisma), seeded
  with the approved reference content. Sample artwork is flagged `isPlaceholder` so the admin can list what's left
  to replace.
- **Dark and light mode.** Dark is the approved design; light is an ivory gallery-wall version. The Shopfront (wall),
  Studio (dusk) and Library (paper) rooms keep their own palettes in both modes. Visitors toggle with the sun/moon
  button; the first-visit default is the `defaultTheme` setting (`dark`, `light` or `system`).
- **The page breathes.** One shared 10-second breath (about 4s in, 6s out): the artwork and hero headline swell and
  settle together and a soft vignette over the whole page opens on the inhale. A pause button sits beside the theme
  toggle and is remembered; `prefers-reduced-motion` turns it off entirely.
- **Accessible by construction.** WCAG AA contrast for every colour pair in every tone (checked by a unit test),
  `lang="ko"` on Korean text, labelled form errors, visible focus rings, 44px+ tap targets.
- **Safe text rendering.** `*italic*` in headlines becomes `<em>` via React elements, never HTML strings.

## Tech stack

Next.js 15 (App Router, Server Components) · TypeScript (strict) · Tailwind CSS v4 · Prisma 6 + PostgreSQL ·
Vercel Blob · next-themes · Zod · Vitest · Playwright. Motion, GSAP + ScrollTrigger, Lenis, Auth.js v5 and
Nodemailer arrive in later phases. Package manager: **pnpm**. Node **20.9+** (CI uses 22).

## Run it locally

You need Node, pnpm and a Postgres database (a local install, Docker, or a free Neon branch).

```bash
pnpm install
cp .env.example .env     # then set DATABASE_URL and DATABASE_URL_UNPOOLED (same URL locally)
pnpm db:deploy           # create the tables from prisma/migrations
pnpm db:seed             # load the reference content and artwork
pnpm dev                 # http://localhost:3000
```

Quick local Postgres with Docker:

```bash
docker run -d --name atelier-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=atelier -p 5432:5432 postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/atelier
```

**Images:** without `BLOB_READ_WRITE_TOKEN`, uploads (including the seed artwork) are saved to `public/uploads/`.
That folder is git-ignored and only works locally. Never seed a production database without the Blob token set,
or the image URLs will point at files that don't exist on Vercel.

**Seeding is safe:** if the site already has content the seed does nothing, so it can never overwrite Caitly's
edits. `pnpm db:seed -- --reset` wipes and reseeds a development database (refused when `NODE_ENV=production`).

## Environment variables

See [`.env.example`](./.env.example). Never commit real values.

| Variable                 | Needed from | Purpose                                                      |
| ------------------------ | ----------- | ------------------------------------------------------------ |
| `DATABASE_URL`           | now         | Postgres connection (the pooled URL on Vercel)               |
| `DATABASE_URL_UNPOOLED`  | now         | Direct connection, used by migrations                        |
| `NEXT_PUBLIC_SITE_URL`   | now         | Canonical URL for metadata, e.g. `https://caitlyracheal.com` |
| `BLOB_READ_WRITE_TOKEN`  | production  | Vercel Blob storage for images and video                     |
| `SMTP_*`                 | phase 3     | Caitly's email account and app password for enquiry emails   |
| `AUTH_SECRET`, `ADMIN_*` | phase 4     | Admin login                                                  |
| `TURNSTILE_*`            | optional    | Cloudflare Turnstile spam check on the contact form          |

## Scripts

| Script                         | What it does                                                       |
| ------------------------------ | ------------------------------------------------------------------ |
| `pnpm dev`                     | Development server                                                 |
| `pnpm build` / `start`         | Production build and server                                        |
| `pnpm vercel-build`            | What Vercel runs: generate, migrate, seed (no-op if seeded), build |
| `pnpm db:deploy`               | Apply migrations (`prisma migrate deploy`)                         |
| `pnpm db:migrate`              | Create a new migration after editing the schema (development)      |
| `pnpm db:seed`                 | Seed reference content (safe to re-run)                            |
| `pnpm lint` / `typecheck`      | ESLint and `tsc --noEmit`                                          |
| `pnpm format` / `format:check` | Prettier write / check                                             |
| `pnpm test`                    | Unit tests (Vitest)                                                |
| `pnpm test:e2e`                | Browser tests (Playwright) against a production build              |

## Tests and CI

- **Unit (`tests/unit`):** the `*italic*` parser (including that admin-entered HTML is never rendered) and WCAG AA
  contrast for every colour token in the dark, light, wall, dusk and paper tones, read straight from
  `app/globals.css`.
- **Browser (`tests/e2e`), desktop and phone:** the home page renders every section from the database with no
  console errors; images have alt text; draft packages and testimonials stay hidden; the theme toggle switches and
  persists; the page breathes and the pause button works and persists; reduced motion stops it; the contact form
  explains errors and shows the thank-you state; the 404 page works.

To run the browser tests locally: `pnpm build && pnpm test:e2e` (the first time, `pnpm exec playwright install chromium`).

[GitHub Actions](./.github/workflows/ci.yml) runs on every pull request and every push to `main`:

1. **Checks:** lint, typecheck, Prettier, unit tests.
2. **E2E:** a fresh Postgres 16, then the same migrate → seed → build steps Vercel uses, then the Playwright suite.
   On failure, the HTML report is uploaded as an artifact.

## Deploying to Vercel

1. Import the GitHub repository in Vercel (framework: Next.js; it detects pnpm from the lockfile).
2. Add a Postgres database: **Storage → Create → Neon**, connected to all environments. This sets `DATABASE_URL`
   and `DATABASE_URL_UNPOOLED` for you.
3. Add **Storage → Create → Blob** and connect it. This sets `BLOB_READ_WRITE_TOKEN`.
4. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
5. Deploy. Vercel runs `pnpm vercel-build`: it applies migrations, seeds the first time (uploading the artwork to
   Blob), then builds. Later deploys skip the seed because content already exists.

Schema changes: run `pnpm db:migrate` locally, commit the new folder in `prisma/migrations/`, and the next deploy
applies it.

## Where things live

```
app/
  globals.css            design tokens; dark/light and room tone classes; the breath animation
  layout.tsx             fonts (self-hosted via next/font), theme provider, metadata from settings
  page.tsx               home page: composes the sections
  not-found.tsx          on-brand 404
components/
  sections/              one component per home section (Hero, Statement, rooms, Packages, …)
  ThemeToggle.tsx        sun/moon switch
  BreathToggle.tsx       pause/resume the breathing
lib/
  content.ts             cached content queries (tag "content"; admin saves revalidate it)
  storage.ts             storage interface: Vercel Blob, or public/uploads locally
  emphasis.tsx           *italic* → <em>, safely
prisma/
  schema.prisma          data model
  migrations/            SQL migrations applied on deploy
  seed.ts                reference content and artwork
design-reference/        the approved design and its artwork
tests/                   unit (Vitest) and e2e (Playwright)
```

## Rules for contributors

- The reference design is approved: don't change layout, palette or type without asking Caitly.
- Never invent testimonials, client names, results or statistics. Use the `isPlaceholder` flag.
- Colours come from tokens in `app/globals.css`; never hard-code them in components. The contrast test will catch a
  token that fails AA.
- Keep new animation in step with the breath (`--breath-dur`), animate only `transform`, `opacity` and `filter`, and
  respect `prefers-reduced-motion`.
