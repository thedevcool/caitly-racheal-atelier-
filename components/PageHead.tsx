import { Nav } from "./Nav";

/** Header band for inner pages: the same nav, sitting on the page's tone instead of over the hero. */
export function PageHead({ rooms, tone }: { rooms: { slug: string; navLabel: string }[]; tone?: string }) {
  return (
    <header className={tone ? `page-head band tone-${tone}` : "page-head band"}>
      <Nav rooms={rooms} />
    </header>
  );
}
