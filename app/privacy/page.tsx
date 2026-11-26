import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/content";
import { PageHead } from "@/components/PageHead";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" } };

/** Short, plain privacy note about the contact form (brief §3). */
export default async function Privacy() {
  const [settings, rooms] = await Promise.all([
    getSettings(),
    db.room.findMany({
      where: { visible: true },
      orderBy: { order: "asc" },
      select: { slug: true, navLabel: true, name: true, korean: true },
    }),
  ]);
  if (!settings) return null;
  const contact = settings.displayEmail;
  return (
    <>
      <PageHead rooms={rooms} />
      <main id="main" className="band prose">
        <div className="wrap">
          <h1 className="room-title">Privacy</h1>
          <p className="lede">A short, plain note about what happens when you send a brief.</p>
          <h2>What the form collects</h2>
          <p>
            Your name, your email address, which room your project belongs to, and the message you write.
            Nothing else is asked for.
          </p>
          <h2>What happens to it</h2>
          <p>
            Your brief is saved securely so it can’t be lost, and a copy is emailed to Caitly so she can
            reply. It is used only to answer you and discuss your project. It is never sold or shared for
            marketing.
          </p>
          <h2>Spam protection</h2>
          <p>
            To stop spam, the site keeps a one-way scrambled code made from your internet address (never the
            address itself), only to limit how many messages can be sent in an hour.
          </p>
          <h2>Cookies and analytics</h2>
          <p>
            The site doesn’t use advertising or tracking cookies. Visits are counted with privacy-friendly
            analytics that don’t identify you. Your choice of light or dark mode, and whether the page’s
            motion is paused, are remembered in your own browser only.
          </p>
          <h2>Your choices</h2>
          <p>
            You can ask to see, correct or delete anything you’ve sent at any time
            {contact ? (
              <>
                {" "}
                by writing to <a href={`mailto:${contact}`}>{contact}</a>
              </>
            ) : (
              <> by replying to any email from Caitly</>
            )}
            .
          </p>
          <p>
            <Link href="/#commission" className="enter">
              Back to the commission form <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </main>
      <Footer settings={settings} />
    </>
  );
}
