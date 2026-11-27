import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCaseStudyParams, getSettings, getWorkPage } from "@/lib/content";
import { absoluteUrl } from "@/lib/view";
import { PageHead } from "@/components/PageHead";
import { Footer } from "@/components/sections/Footer";
import { PieceWords, piece, wordCount } from "@/components/Pieces";

type Params = { params: Promise<{ room: string; slug: string }> };

export async function generateStaticParams() {
  return getCaseStudyParams();
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { room, slug } = await params;
  const data = await getWorkPage(room, slug);
  if (!data) return {};
  return { title: data.work.title, description: data.work.description ?? data.work.hook ?? undefined };
}

/** Optional case study for one piece (the admin turns it on per item). */
export default async function CaseStudy({ params }: Params) {
  const { room, slug } = await params;
  const [data, settings] = await Promise.all([getWorkPage(room, slug), getSettings()]);
  if (!data || !settings) notFound();
  const { work, navRooms } = data;
  const still = work.poster ?? work.media;

  return (
    <>
      <PageHead rooms={navRooms} />
      <main id="main" className="band case">
        <article className="wrap">
          <p className="crumbs piece" style={piece(3).style}>
            <Link href="/">Atelier</Link> <span aria-hidden="true">/</span>{" "}
            <Link href={`/work/${work.room.slug}`}>{work.room.navLabel}</Link>
          </p>
          <h1 className="room-title">
            <PieceWords text={work.title} start={4} />
          </h1>
          <p className="viewer-meta piece" style={piece(4 + wordCount(work.title)).style}>
            {[work.category, work.client].filter(Boolean).join(" · ")}
          </p>
          <div className="case-media piece" style={piece(5 + wordCount(work.title)).style}>
            {work.mediaType === "VIDEO" && work.media ? (
              <video
                src={work.media.url}
                poster={work.poster?.url}
                controls
                playsInline
                preload="none"
                aria-label={work.media.alt}
              />
            ) : (
              still && (
                <Image
                  src={still.url}
                  alt={still.alt}
                  width={still.width ?? 1600}
                  height={still.height ?? 1000}
                  sizes="(min-width: 1241px) 1240px, 100vw"
                  placeholder={still.blurData ? "blur" : "empty"}
                  blurDataURL={still.blurData ?? undefined}
                  priority
                />
              )
            )}
          </div>
          {work.hook && <p className="room-headline serif">{work.hook}</p>}
          {work.description && <p className="lede case-body">{work.description}</p>}
          <div className="room-ctas">
            <Link className="btn gold" href="/#commission">
              Commission something like this
            </Link>
            {work.externalUrl && (
              <a
                className="enter"
                href={absoluteUrl(work.externalUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View it live ↗
              </a>
            )}
          </div>
        </article>
      </main>
      <Footer settings={settings} />
    </>
  );
}
