import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { BreathToggle } from "./BreathToggle";
import { MobileMenu } from "./MobileMenu";
import { scatter } from "@/lib/scatter";

type NavRoom = { slug: string; navLabel: string; name: string; korean: string };

/**
 * Transparent nav over the hero. Room links come from the database.
 * `assemble` (hero only) makes the nav's three parts join the first-load
 * assembly, continuing the hero's piece numbering from `from`.
 */
export function Nav({ rooms, assemble }: { rooms: NavRoom[]; assemble?: { from: number } }) {
  const piece = (k: number) => (assemble ? { className: "piece", style: scatter(assemble.from + k) } : {});
  const brand = piece(0);
  const links = piece(1);
  const buttons = piece(2);
  return (
    <nav className="nav" aria-label="Main">
      <Link className={["brand", brand.className].filter(Boolean).join(" ")} style={brand.style} href="/#top">
        <b>Caitly Racheal</b>
        <span className="ko" lang="ko">
          아틀리에
        </span>
      </Link>
      <div className="nav-right">
        <div className={["links", links.className].filter(Boolean).join(" ")} style={links.style}>
          {rooms.map((r) => (
            <Link key={r.slug} href={`/#${r.slug}`}>
              {r.navLabel}
            </Link>
          ))}
          <Link href="/#commission">Commission</Link>
        </div>
        <div className={["nav-buttons", buttons.className].filter(Boolean).join(" ")} style={buttons.style}>
          <BreathToggle />
          <ThemeToggle />
          <MobileMenu rooms={rooms} />
        </div>
      </div>
    </nav>
  );
}
