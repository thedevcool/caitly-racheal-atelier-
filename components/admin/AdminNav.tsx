"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/work", label: "Work" },
  { href: "/admin/content", label: "Words" },
  { href: "/admin/rooms", label: "Rooms" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/settings", label: "Settings" },
];

/** Side rail on desktop, a swipeable row on phones. */
export function AdminNav({ newCount }: { newCount: number }) {
  const path = usePathname();
  return (
    <nav className="a-nav" aria-label="Admin">
      <ul>
        {items.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? "page" : undefined}>
                {i.label}
                {i.href === "/admin/enquiries" && newCount > 0 && (
                  <span className="a-badge" aria-label={`${newCount} new`}>
                    {newCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
