import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export const metadata = { title: "This room is empty" };

/** On-brand 404: a small ink-wash image, a bilingual line and a way home. */
export default async function NotFound() {
  const ink = await db.work
    .findFirst({ where: { room: { slug: "library" }, visible: true }, orderBy: { order: "asc" } })
    .then((w) => (w ? db.media.findUnique({ where: { id: w.mediaId } }) : null))
    .catch(() => null);
  return (
    <main
      className="band"
      style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}
    >
      <div style={{ maxWidth: 520 }}>
        {ink && (
          <Image
            src={ink.url}
            alt=""
            width={480}
            height={240}
            style={{ margin: "0 auto 36px", borderRadius: 4, width: "100%", height: "auto" }}
          />
        )}
        <h1
          className="serif"
          style={{ fontWeight: 500, fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1, margin: "0 0 14px" }}
        >
          This room is empty.
        </h1>
        <p className="ko" lang="ko" style={{ color: "var(--accent)", fontSize: 20, margin: "0 0 32px" }}>
          이 방은 비어 있어요.
        </p>
        <Link className="btn solid" href="/">
          Return to the atelier
        </Link>
      </div>
    </main>
  );
}
