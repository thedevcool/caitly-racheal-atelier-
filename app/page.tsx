import { getHomeContent, type HomeContent } from "@/lib/content";
import { applyDraft, getDraft } from "@/lib/draft";
import { PreviewBar } from "@/components/PreviewBar";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { RoomSection } from "@/components/sections/RoomSection";
import { Packages } from "@/components/sections/Packages";
import { Testimonials } from "@/components/sections/Testimonials";
import { Commission } from "@/components/sections/Commission";
import { Footer } from "@/components/sections/Footer";

const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Structured data: Person + ProfessionalService (brief §10). */
function jsonLd(settings: HomeContent["settings"], rooms: HomeContent["rooms"]) {
  const sameAs = [settings.instagram, settings.tiktok, settings.etsy].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${site}/#caitly`,
        name: "Caitly Racheal",
        jobTitle: "Creative Director & Visual Storyteller",
        url: site,
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "ProfessionalService",
        "@id": `${site}/#atelier`,
        name: "Caitly Racheal Atelier",
        url: site,
        description: settings.seoDescription,
        founder: { "@id": `${site}/#caitly` },
        ...(settings.displayEmail ? { email: settings.displayEmail } : {}),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Commissions",
          itemListElement: rooms.map((r) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: r.service, url: `${site}/work/${r.slug}` },
          })),
        },
      },
    ],
  };
}

export default async function Home() {
  // In preview (draft mode) unsaved admin edits are laid over the saved content
  const draft = await getDraft();
  const { settings, heroImage, contactImage, rooms, testimonials } = applyDraft(
    await getHomeContent(),
    draft,
  );
  return (
    <>
      <Hero settings={settings} image={heroImage} rooms={rooms} />
      <main id="main">
        <Statement text={settings.statement} />
        {rooms.map((room, i) => (
          <RoomSection key={room.id} room={room} index={i} />
        ))}
        <Packages rooms={rooms} />
        <Testimonials items={testimonials} />
        <Commission settings={settings} image={contactImage} services={rooms} />
      </main>
      <Footer settings={settings} />
      {draft && <PreviewBar />}
      <script
        type="application/ld+json"
        // JSON.stringify escapes quotes; "<" is escaped too so no text can close the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(settings, rooms)).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
