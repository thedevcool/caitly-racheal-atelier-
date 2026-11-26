import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { saveRoom } from "@/app/admin/actions/rooms";
import { AdminForm } from "@/components/admin/AdminForm";
import { Fieldset, Select, TextArea, TextField, Toggle } from "@/components/admin/fields";

export const metadata = { title: "Edit room" };

export default async function RoomEditor({ params }: { params: Promise<{ id: string }> }) {
  const r = await db.room.findUnique({ where: { id: (await params).id } });
  if (!r) notFound();
  return (
    <>
      <p className="a-crumbs">
        <Link href="/admin/rooms">Rooms</Link> / {r.name}
      </p>
      <h1 className="a-title">
        <span className="ko" lang="ko">
          {r.korean}
        </span>{" "}
        {r.name}
      </h1>
      <AdminForm action={saveRoom} preview="room">
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="slug" value={r.slug} />
        <Fieldset legend="Names">
          <div className="a-grid2">
            <TextField label="Room name" name="name" defaultValue={r.name} />
            <TextField label="Korean name" name="korean" defaultValue={r.korean} lang="ko" />
            <TextField
              label="Menu label"
              name="navLabel"
              defaultValue={r.navLabel}
              hint="Short, for the top menu."
            />
            <TextField label="Contact form option" name="service" defaultValue={r.service} />
          </div>
        </Fieldset>
        <Fieldset legend="Words">
          <TextField
            label="Headline"
            name="headline"
            defaultValue={r.headline}
            hint="Put *stars* around a word to make it italic."
          />
          <TextArea label="Description" name="body" defaultValue={r.body} rows={4} maxLength={600} />
          <TextField
            label="Chips"
            name="chips"
            defaultValue={r.chips.join(", ")}
            hint="Separate with commas, e.g. Beauty, Fashion, Travel"
          />
          <TextField label="Button" name="ctaLabel" defaultValue={r.ctaLabel} />
          {r.slug === "shopfront" && (
            <div className="a-grid2">
              <TextField label="Collection label" name="galleryTitle" defaultValue={r.galleryTitle ?? ""} />
              <TextField
                label="Collection caption"
                name="galleryCaption"
                defaultValue={r.galleryCaption ?? ""}
              />
            </div>
          )}
        </Fieldset>
        <Fieldset legend="Look">
          <Select
            label="Palette"
            name="theme"
            defaultValue={r.theme}
            options={[
              { value: "dark", label: "Follows the site (black or ivory)" },
              { value: "wall", label: "Ivory wall" },
              { value: "dusk", label: "Dusk blue" },
              { value: "paper", label: "Library paper" },
            ]}
          />
          <Toggle label="Show this room on the site" name="visible" defaultChecked={r.visible} />
        </Fieldset>
      </AdminForm>
    </>
  );
}
