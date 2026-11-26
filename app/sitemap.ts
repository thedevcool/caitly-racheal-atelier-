import type { MetadataRoute } from "next";
import { getCaseStudyParams, getRoomSlugs } from "@/lib/content";

const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [rooms, cases] = await Promise.all([getRoomSlugs(), getCaseStudyParams()]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...rooms.map((r) => ({ url: `${base}/work/${r}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...cases.map((c) => ({
      url: `${base}/work/${c.room}/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
