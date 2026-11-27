import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoomPage, getRoomSlugs, getSettings } from "@/lib/content";
import { emphasis } from "@/lib/emphasis";
import { toViewWork } from "@/lib/view";
import { PageHead } from "@/components/PageHead";
import { Gallery } from "@/components/work/Gallery";
import { Footer } from "@/components/sections/Footer";
import { PieceWords, piece, wordCount } from "@/components/Pieces";

type Params = { params: Promise<{ room: string }> };

export async function generateStaticParams() {
  return (await getRoomSlugs()).map((room) => ({ room }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await getRoomPage((await params).room);
  if (!data) return {};
  const { room } = data;
  return {
    title: `${room.name} · ${room.navLabel}`,
    description: room.body,
    alternates: { canonical: `/work/${room.slug}` },
  };
}

/** A room's full gallery: big title with its Korean name, filters, gallery, packages, next room. */
export default async function RoomPage({ params }: Params) {
  const data = await getRoomPage((await params).room);
  const settings = await getSettings();
  if (!data || !settings) notFound();
  const { room, next, navRooms } = data;
  // The room's own palette for its header; "dark" rooms follow the site theme
  const tone = room.theme === "dark" ? undefined : room.theme;

  return (
    // The whole page takes the room's palette; every band reads the same tokens
    <div className={tone ? `tone-${tone} room-page` : "room-page"}>
      <PageHead rooms={navRooms} />
      <main id="main">
        <section
          className={tone ? `band tone-${tone} room-hero` : "band room-hero"}
          aria-labelledby="room-title"
        >
          <div className="wrap">
            {/* First visit: the nav lands first (pieces 0–2), then these, top to bottom */}
            <p className="crumbs piece" style={piece(3).style}>
              <Link href="/">Atelier</Link> <span aria-hidden="true">/</span> {room.navLabel}
            </p>
            <h1 id="room-title" className="room-title">
              <span className="ko piece" lang="ko" style={piece(4).style}>
                {room.korean}
              </span>
              <PieceWords text={room.name} start={5} />
            </h1>
            <p className="room-headline serif piece" style={piece(5 + wordCount(room.name)).style}>
              {emphasis(room.headline)}
            </p>
            <p className="lede piece" style={piece(6 + wordCount(room.name)).style}>
              {room.body}
            </p>
          </div>
        </section>

        <section className="band room-gallery" aria-label={`${room.name} gallery`}>
          <div className="wrap">
            <Gallery
              works={room.works.map(toViewWork)}
              roomSlug={room.slug}
              reels={room.slug === "screening"}
            />
          </div>
        </section>

        {room.packages.length > 0 && (
          <section className="band" aria-labelledby="room-packages">
            <div className="wrap">
              <p className="label">Packages</p>
              <h2 id="room-packages">Ways to begin.</h2>
              <div className="packages">
                {room.packages.map((p) => (
                  <article className="package" key={p.id}>
                    {p.korean && (
                      <span className="ko" lang="ko" style={{ color: "var(--accent)", fontSize: 15 }}>
                        {p.korean}
                      </span>
                    )}
                    <h3>{p.name}</h3>
                    <span className="price">{p.priceFrom}</span>
                    {p.items.length > 0 && (
                      <ul>
                        {p.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="band room-end" aria-label="Next steps">
          <div className="wrap room-end-in">
            <Link className="btn gold" href="/#commission">
              {room.ctaLabel}
            </Link>
            {next && (
              <Link className="next-room" href={`/work/${next.slug}`} data-cursor="Enter">
                <span className="label">Next room</span>
                <span className="next-name serif">
                  <span className="ko" lang="ko">
                    {next.korean}
                  </span>{" "}
                  {next.name} <span aria-hidden="true">→</span>
                </span>
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
