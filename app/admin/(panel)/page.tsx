import Link from "next/link";
import { db } from "@/lib/db";
import { mailConfigured } from "@/lib/mail";
import { RetryButton } from "@/components/admin/RetryButton";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const [newCount, unsent, placeholders, draftPackages, testimonials] = await Promise.all([
    db.enquiry.count({ where: { status: "NEW" } }),
    db.enquiry.count({ where: { emailSent: false, status: { not: "ARCHIVED" } } }),
    db.work.findMany({
      where: { isPlaceholder: true },
      orderBy: [{ room: { order: "asc" } }, { order: "asc" }],
      include: { room: true },
    }),
    db.package.count({ where: { visible: false } }),
    db.testimonial.count({ where: { visible: true } }),
  ]);
  const thumbs = new Map(
    (
      await db.media.findMany({ where: { id: { in: placeholders.map((w) => w.posterId ?? w.mediaId) } } })
    ).map((m) => [m.id, m]),
  );

  const setup = [
    {
      ok: mailConfigured(),
      label: "Enquiry emails (Gmail app password)",
      fix: "Add SMTP_USER and SMTP_APP_PASSWORD on Vercel",
    },
    {
      ok: !!process.env.BLOB_READ_WRITE_TOKEN,
      label: "Image and video storage",
      fix: "Connect Vercel Blob to the project",
    },
    { ok: !!process.env.AUTH_SECRET, label: "Login secret", fix: "Add AUTH_SECRET on Vercel" },
    {
      ok: !!process.env.NEXT_PUBLIC_SITE_URL,
      label: "Site address",
      fix: "Add NEXT_PUBLIC_SITE_URL on Vercel",
    },
  ];

  return (
    <>
      <h1 className="a-title">Good to see you, Caitly.</h1>

      <section className="a-cards" aria-label="At a glance">
        <Link href="/admin/enquiries?status=NEW" className="a-card">
          <span className="a-card-num">{newCount}</span>
          <span>new {newCount === 1 ? "enquiry" : "enquiries"}</span>
        </Link>
        <Link href="/admin/work" className="a-card">
          <span className="a-card-num">{placeholders.length}</span>
          <span>sample {placeholders.length === 1 ? "piece" : "pieces"} left to replace</span>
        </Link>
        <Link href="/admin/packages" className="a-card">
          <span className="a-card-num">{draftPackages}</span>
          <span>{draftPackages === 1 ? "package is" : "packages are"} hidden drafts</span>
        </Link>
        <Link href="/admin/testimonials" className="a-card">
          <span className="a-card-num">{testimonials}</span>
          <span>{testimonials === 1 ? "testimonial" : "testimonials"} showing</span>
        </Link>
      </section>

      {unsent > 0 && (
        <section className="a-alert" role="alert">
          <p>
            <strong>
              {unsent} {unsent === 1 ? "enquiry" : "enquiries"} didn’t reach your inbox.
            </strong>{" "}
            {unsent === 1 ? "It’s" : "They’re"} safe here in <Link href="/admin/enquiries">Enquiries</Link>.
          </p>
          <RetryButton label="Retry sending" />
        </section>
      )}

      <section className="a-panel" aria-labelledby="ph">
        <h2 id="ph">Replace the sample art</h2>
        {placeholders.length === 0 ? (
          <p className="a-empty">Every piece on the site is your own work. Beautiful. 아름다워요.</p>
        ) : (
          <>
            <p className="a-hint">
              These pieces still show studio sample art. Replace each with your own work.
            </p>
            <ul className="a-checklist">
              {placeholders.map((w) => {
                const t = thumbs.get(w.posterId ?? w.mediaId);
                return (
                  <li key={w.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {t && <img src={t.url} alt="" width={56} height={56} />}
                    <span>
                      <b>{w.title}</b>
                      <span className="a-hint">{w.room.name}</span>
                    </span>
                    <Link className="a-btn small" href={`/admin/work/${w.id}#media`}>
                      Replace
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {setup.some((s) => !s.ok) && (
        <section className="a-panel" aria-labelledby="setup">
          <h2 id="setup">Finish setting up</h2>
          <ul className="a-setup">
            {setup.map((s) => (
              <li key={s.label} className={s.ok ? "is-ok" : ""}>
                <span aria-hidden="true">{s.ok ? "✓" : "○"}</span> {s.label}
                {!s.ok && <span className="a-hint"> · {s.fix}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="a-panel" aria-labelledby="quick">
        <h2 id="quick">Quick links</h2>
        <div className="a-quick">
          <Link href="/admin/work/new" className="a-btn">
            Add new work
          </Link>
          <Link href="/admin/content" className="a-btn ghost">
            Edit the words
          </Link>
          <Link href="/admin/packages" className="a-btn ghost">
            Set your prices
          </Link>
          <Link href="/admin/settings" className="a-btn ghost">
            Send a test email
          </Link>
        </div>
      </section>
    </>
  );
}
