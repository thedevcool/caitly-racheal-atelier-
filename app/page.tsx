import { getHomeContent } from "@/lib/content";
import { applyDraft, getDraft } from "@/lib/draft";
import { PreviewBar } from "@/components/PreviewBar";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
import { RoomSection } from "@/components/sections/RoomSection";
import { Packages } from "@/components/sections/Packages";
import { Testimonials } from "@/components/sections/Testimonials";
import { Commission } from "@/components/sections/Commission";
import { Footer } from "@/components/sections/Footer";

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
      <main>
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
    </>
  );
}
