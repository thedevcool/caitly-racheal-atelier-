import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Atelier admin", template: "%s · Atelier admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The admin: same fonts and palette as the site, in a calmer, lighter room. */
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin-root tone-light">{children}</div>;
}
