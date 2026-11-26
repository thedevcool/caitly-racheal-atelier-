import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { EnquiryStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const metadata = { title: "Enquiries" };

const TABS: { key: EnquiryStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "READ", label: "Read" },
  { key: "REPLIED", label: "Replied" },
  { key: "ARCHIVED", label: "Archived" },
];

const fmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function Enquiries({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = (Object.values(EnquiryStatus) as string[]).includes(sp.status ?? "")
    ? (sp.status as EnquiryStatus)
    : undefined;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const where: Prisma.EnquiryWhereInput = {
    ...(status ? { status } : { status: { not: "ARCHIVED" } }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [list, rooms, counts] = await Promise.all([
    db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    db.room.findMany({ select: { slug: true, name: true } }),
    db.enquiry.groupBy({ by: ["status"], _count: true }),
  ]);
  const roomName = new Map(rooms.map((r) => [r.slug, r.name]));
  const count = (k: string) => (k === "ALL" ? undefined : (counts.find((c) => c.status === k)?._count ?? 0));
  const qs = (s: string) => {
    const p = new URLSearchParams();
    if (s !== "ALL") p.set("status", s);
    if (q) p.set("q", q);
    return p.size ? `?${p}` : "";
  };

  return (
    <>
      <div className="a-head">
        <h1 className="a-title">Enquiries</h1>
        <a className="a-btn ghost" href={`/admin/enquiries/export${qs(status ?? "ALL")}`}>
          Download CSV
        </a>
      </div>
      <nav className="a-tabs" aria-label="Filter by status">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/enquiries${qs(t.key)}`}
            aria-current={(status ?? "ALL") === t.key ? "page" : undefined}
          >
            {t.label}
            {count(t.key) !== undefined && <span className="a-hint"> {count(t.key)}</span>}
          </Link>
        ))}
      </nav>
      <form className="a-search" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="q" className="sr-only">
          Search enquiries
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Search names, emails and briefs" />
        <button className="a-btn ghost" type="submit">
          Search
        </button>
      </form>

      {list.length === 0 ? (
        <p className="a-empty">
          {q
            ? "Nothing matches that search."
            : "No enquiries here yet. They’ll arrive as soon as someone commissions a piece."}
        </p>
      ) : (
        <ul className="a-inbox">
          {list.map((e) => (
            <li key={e.id} className={e.status === "NEW" ? "is-new" : ""}>
              <Link href={`/admin/enquiries/${e.id}`}>
                <span className="a-inbox-top">
                  <b>{e.name}</b>
                  <time dateTime={e.createdAt.toISOString()}>{fmt.format(e.createdAt)}</time>
                </span>
                <span className="a-hint">
                  {roomName.get(e.room) ?? e.room} · {e.email}
                </span>
                <span className="a-inbox-msg">{e.message.slice(0, 160)}</span>
                <span className="a-pills">
                  <span className={`a-pill ${e.status === "NEW" ? "gold" : "muted"}`}>
                    {e.status.toLowerCase()}
                  </span>
                  {!e.emailSent && <span className="a-pill warn">email not sent</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
