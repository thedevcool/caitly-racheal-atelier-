import type { Media, Work } from "@prisma/client";
import { saveWork } from "@/app/admin/actions/work";
import { AdminForm } from "./AdminForm";
import { Fieldset, Select, TextArea, TextField, Toggle } from "./fields";
import { MediaField, type MediaValue } from "./MediaField";

type Props = {
  work?: Work;
  media?: Media | null;
  poster?: Media | null;
  rooms: { value: string; label: string; slug: string }[];
  categories: string[];
  storage: "blob" | "local";
  defaultRoomId?: string;
};

const mv = (m?: Media | null): MediaValue => (m ? { id: m.id, url: m.url, kind: m.kind, alt: m.alt } : null);

/** Shared by "Add new work" and "Edit". */
export function WorkEditor({ work, media, poster, rooms, categories, storage, defaultRoomId }: Props) {
  const meta = (work?.meta ?? {}) as { nav?: string; tours?: { name: string; detail: string }[] };
  return (
    <AdminForm action={saveWork} submitLabel={work ? "Save changes" : "Add to the site"}>
      {work && <input type="hidden" name="id" value={work.id} />}
      <div id="media">
        <Fieldset
          legend="The piece"
          note={work?.isPlaceholder ? "This is sample art. Upload your own work to replace it." : undefined}
        >
          <MediaField
            label="Image or video"
            name="media"
            value={mv(media)}
            poster={mv(poster)}
            allowVideo
            storage={storage}
          />
        </Fieldset>
      </div>
      <Fieldset legend="Details">
        <Select
          label="Room"
          name="roomId"
          defaultValue={work?.roomId ?? defaultRoomId ?? rooms[0]?.value}
          options={rooms}
        />
        <TextField label="Title" name="title" defaultValue={work?.title} />
        <div className="a-grid2">
          <TextField
            label="Category"
            name="category"
            defaultValue={work?.category ?? ""}
            list="categories"
            hint="Used for the filters, e.g. Beauty, Travel, Printable."
          />
          <TextField
            label="Client (optional)"
            name="client"
            defaultValue={work?.client ?? ""}
            hint="Only with their permission."
          />
        </div>
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <TextField
          label="Hook or headline"
          name="hook"
          defaultValue={work?.hook ?? ""}
          hint="For reels, the caption line, e.g. “I stopped using foundation.”"
        />
        <TextArea
          label="Description (optional)"
          name="description"
          defaultValue={work?.description ?? ""}
          rows={4}
          maxLength={2000}
        />
        <TextField
          label="Link (optional)"
          name="externalUrl"
          type="url"
          defaultValue={
            work?.externalUrl
              ? /^https?:/.test(work.externalUrl)
                ? work.externalUrl
                : `https://${work.externalUrl}`
              : ""
          }
          placeholder="https://"
          hint="The Etsy listing, the live website, the published paper…"
        />
      </Fieldset>
      <Fieldset legend="Where it shows">
        <Toggle label="Show on the site" name="visible" defaultChecked={work?.visible ?? true} />
        <Toggle
          label="Show on the home page"
          name="featured"
          defaultChecked={work?.featured ?? false}
          hint="The first three in each room appear in the phones, frames or browser."
        />
        <Toggle
          label="Give it a case-study page"
          name="showCaseStudy"
          defaultChecked={work?.showCaseStudy ?? false}
        />
      </Fieldset>
      <details className="a-details">
        <summary>Studio browser mockup (websites only)</summary>
        <p className="a-hint">
          On the home page, Studio pieces appear inside a browser window with a menu line and three tour
          cards.
        </p>
        <TextField
          label="Menu line"
          name="metaNav"
          defaultValue={meta.nav ?? ""}
          placeholder="Tours · Stays · Journal · Book"
        />
        {[0, 1, 2].map((i) => (
          <div className="a-grid2" key={i}>
            <TextField
              label={`Card ${i + 1} title`}
              name={`tour${i}Name`}
              defaultValue={meta.tours?.[i]?.name ?? ""}
            />
            <TextField
              label={`Card ${i + 1} detail`}
              name={`tour${i}Detail`}
              defaultValue={meta.tours?.[i]?.detail ?? ""}
            />
          </div>
        ))}
      </details>
    </AdminForm>
  );
}
