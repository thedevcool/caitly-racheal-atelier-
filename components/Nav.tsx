import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { BreathToggle } from "./BreathToggle";
import { MobileMenu } from "./MobileMenu";

type NavRoom = { slug: string; navLabel: string; name: string; korean: string };

/** Transparent nav over the hero. Room links come from the database. */
export function Nav({ rooms }: { rooms: NavRoom[] }) {
  return (
    <nav className="nav" aria-label="Main">
      <Link className="brand" href="/#top">
        <b>Caitly Racheal</b>
        <span className="ko" lang="ko">
          아틀리에
        </span>
      </Link>
      <div className="nav-right">
        <div className="links">
          {rooms.map((r) => (
            <Link key={r.slug} href={`/#${r.slug}`}>
              {r.navLabel}
            </Link>
          ))}
          <Link href="/#commission">Commission</Link>
        </div>
        <div className="nav-buttons">
          <BreathToggle />
          <ThemeToggle />
          <MobileMenu rooms={rooms} />
        </div>
      </div>
    </nav>
  );
}
