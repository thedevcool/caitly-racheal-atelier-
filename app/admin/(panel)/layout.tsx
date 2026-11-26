import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdminPage } from "@/lib/admin";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const newCount = await db.enquiry.count({ where: { status: "NEW" } });
  return (
    <div className="a-shell">
      <a className="a-skip" href="#a-main">
        Skip to content
      </a>
      <header className="a-top">
        <Link href="/admin" className="a-brand">
          Caitly Racheal{" "}
          <span className="ko" lang="ko">
            아틀리에
          </span>
        </Link>
        <div className="a-top-actions">
          <a href="/" target="_blank" rel="noopener" className="a-link">
            View site ↗
          </a>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="a-link">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <AdminNav newCount={newCount} />
      <main id="a-main" className="a-main">
        {children}
      </main>
    </div>
  );
}
