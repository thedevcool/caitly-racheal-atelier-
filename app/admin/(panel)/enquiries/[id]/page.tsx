import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EnquiryActions } from "@/components/admin/EnquiryActions";
import { RetryButton } from "@/components/admin/RetryButton";

export const metadata = { title: "Enquiry" };

const fmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short" });

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  let e = await db.enquiry.findUnique({ where: { id } });
  if (!e) notFound();
  // Opening an enquiry marks it read
  if (e.status === "NEW") e = await db.enquiry.update({ where: { id }, data: { status: "READ" } });
  const room = await db.room.findUnique({ where: { slug: e.room } });
  const roomName = room?.name ?? e.room;

  const subject = `Re: your ${roomName} enquiry`;
  const body = `Hi ${e.name.split(" ")[0]},\n\nThank you for your brief. \n\n\nCaitly\n\n---\nYou wrote:\n${e.message
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")}`;
  const mailto = `mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <>
      <p className="a-crumbs">
        <Link href="/admin/enquiries">Enquiries</Link> / {e.name}
      </p>
      <h1 className="a-title">{e.name}</h1>
      <p className="a-hint">
        {roomName} · <time dateTime={e.createdAt.toISOString()}>{fmt.format(e.createdAt)}</time>
      </p>

      <dl className="a-dl">
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${e.email}`}>{e.email}</a>
        </dd>
        <dt>Room</dt>
        <dd>{roomName}</dd>
        {e.budget && (
          <>
            <dt>Budget</dt>
            <dd>{e.budget}</dd>
          </>
        )}
        <dt>Brief</dt>
        <dd className="a-brief">{e.message}</dd>
        <dt>Status</dt>
        <dd>{e.status.toLowerCase()}</dd>
      </dl>

      {!e.emailSent && (
        <p className="a-alert">
          The email notification for this enquiry wasn’t sent. <RetryButton id={e.id} />
        </p>
      )}

      <div className="a-quick">
        <a className="a-btn primary" href={mailto}>
          Reply by email
        </a>
        <EnquiryActions id={e.id} status={e.status} />
      </div>
    </>
  );
}
