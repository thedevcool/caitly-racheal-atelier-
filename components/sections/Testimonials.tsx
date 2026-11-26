import type { Testimonial } from "@prisma/client";

/** Real testimonials only. Hidden while the list is empty; never seeded. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="band" aria-labelledby="kind-words">
      <div className="wrap">
        <p className="label">Kind words</p>
        <h2 id="kind-words" className="sr-only">
          Testimonials
        </h2>
        <div className="quotes">
          {items.map((t) => (
            <blockquote key={t.id}>
              <p>“{t.quote}”</p>
              <cite>
                {t.name}
                {t.role ? ` · ${t.role}` : ""}
              </cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
