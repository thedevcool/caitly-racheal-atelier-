# Caitly Racheal Atelier

Personal-brand site and admin for Caitly Racheal, Creative Director & Visual Storyteller.
The build brief is [`docs/BRIEF.md`](./docs/BRIEF.md); the approved design is in [`design-reference/`](./design-reference/index.html).

> Status: **Phase 1 (Foundation)** complete. A full guide for Caitly (logging in, replacing placeholders, setting the Gmail app password) arrives in phase 6.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL · Vercel Blob · next-themes (dark/light) · Zod. Motion, GSAP, Lenis, Auth.js and Nodemailer join in later phases.

## Run it locally

```bash
pnpm install
cp .env.example .env          # set DATABASE_URL to a Postgres database
pnpm db:push                  # create the tables
pnpm db:seed                  # load the reference content and artwork
pnpm dev                      # http://localhost:3000
```

Without `BLOB_READ_WRITE_TOKEN`, uploads (including the seed images) are written to `public/uploads/` for local development. On Vercel, set the token so they go to Vercel Blob.

The seed never overwrites existing content. `pnpm db:seed -- --reset` wipes and reseeds (refused in production).

## Scripts

| Script                                    | What it does            |
| ----------------------------------------- | ----------------------- |
| `pnpm dev` / `build` / `start`            | Next.js                 |
| `pnpm db:push` / `db:migrate` / `db:seed` | Prisma                  |
| `pnpm lint` / `typecheck` / `format`      | ESLint, `tsc`, Prettier |

## Where things live

- `app/globals.css`: design tokens and the dark/light/room tone classes
- `components/sections/`: one component per home-page section
- `lib/content.ts`: cached content queries (tag `content`; admin saves revalidate it)
- `lib/storage.ts`: storage interface (Vercel Blob, or local folder in development)
- `prisma/schema.prisma`, `prisma/seed.ts`: data model and reference content
