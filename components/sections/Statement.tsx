import { emphasis } from "@/lib/emphasis";

export function Statement({ text }: { text: string }) {
  return (
    <section className="band statement" aria-label="Statement">
      <p>{emphasis(text)}</p>
    </section>
  );
}
