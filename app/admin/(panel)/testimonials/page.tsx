import { db } from "@/lib/db";
import { reorderTestimonials } from "@/app/admin/actions/testimonials";
import { TestimonialManager } from "@/components/admin/lists";

export const metadata = { title: "Testimonials" };

export default async function Testimonials() {
  const items = await db.testimonial.findMany({ orderBy: { order: "asc" } });
  return (
    <>
      <h1 className="a-title">Testimonials</h1>
      <p className="a-lede">
        Real words from real clients only. The section stays hidden on the site while this list is empty.
      </p>
      <TestimonialManager
        items={items.map((t) => ({
          id: t.id,
          label: t.name,
          quote: t.quote,
          role: t.role,
          visible: t.visible,
        }))}
        onReorder={reorderTestimonials}
      />
    </>
  );
}
