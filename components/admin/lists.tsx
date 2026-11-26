"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { SortableList } from "./SortableList";
import { AdminForm } from "./AdminForm";
import { Select, TextArea, TextField, Toggle } from "./fields";
import { deletePackage, savePackage } from "@/app/admin/actions/packages";
import { deleteTestimonial, saveTestimonial } from "@/app/admin/actions/testimonials";

type Reorder = (ids: string[]) => Promise<unknown>;
const Badge = ({ children, tone }: { children: React.ReactNode; tone?: "warn" | "muted" | "gold" }) => (
  <span className={`a-pill ${tone ?? ""}`}>{children}</span>
);

/** Small admin thumbnail */
function Thumb({ src }: { src: string | null }) {
  return src ? (
    <Image src={src} alt="" width={52} height={52} className="a-thumb" />
  ) : (
    <span className="a-thumb" />
  );
}

// ---- Rooms -------------------------------------------------------------------
type RoomRow = { id: string; label: string; korean: string; visible: boolean; works: number };
export function RoomList({ rooms, onReorder }: { rooms: RoomRow[]; onReorder: Reorder }) {
  return (
    <SortableList
      items={rooms}
      onReorder={onReorder}
      render={(r) => (
        <Link href={`/admin/rooms/${r.id}`} className="a-row-link">
          <span className="ko a-ko" lang="ko">
            {r.korean}
          </span>
          <b>{r.label}</b>
          <span className="a-hint">{r.works} pieces</span>
          {!r.visible && <Badge tone="muted">Hidden</Badge>}
        </Link>
      )}
    />
  );
}

// ---- Work --------------------------------------------------------------------
type WorkRow = {
  id: string;
  label: string;
  thumb: string | null;
  kind: "IMAGE" | "VIDEO";
  placeholder: boolean;
  visible: boolean;
  featured: boolean;
  category: string | null;
};
export function WorkList({ works, onReorder }: { works: WorkRow[]; onReorder: Reorder }) {
  if (!works.length) return <p className="a-empty">Nothing in this room yet.</p>;
  return (
    <SortableList
      items={works}
      onReorder={onReorder}
      render={(w) => (
        <Link href={`/admin/work/${w.id}`} className="a-row-link">
          <Thumb src={w.thumb} />
          <span className="a-row-main">
            <b>{w.label}</b>
            <span className="a-hint">
              {w.kind === "VIDEO" ? "Video" : "Image"}
              {w.category ? ` · ${w.category}` : ""}
            </span>
          </span>
          <span className="a-pills">
            {w.placeholder && <Badge tone="warn">Sample art</Badge>}
            {w.featured && <Badge tone="gold">On home page</Badge>}
            {!w.visible && <Badge tone="muted">Hidden</Badge>}
          </span>
        </Link>
      )}
    />
  );
}

// ---- Packages ------------------------------------------------------------------
type Pkg = {
  id: string;
  label: string;
  roomId: string;
  roomName: string;
  korean: string | null;
  priceFrom: string;
  items: string[];
  featured: boolean;
  visible: boolean;
};
type Opt = { value: string; label: string };

function PackageForm({ p, rooms, onDone }: { p?: Pkg; rooms: Opt[]; onDone: () => void }) {
  const router = useRouter();
  return (
    <AdminForm
      action={savePackage}
      className="a-form a-inline-form"
      submitLabel={p ? "Save package" : "Add package"}
      onSaved={() => {
        router.refresh();
        onDone();
      }}
    >
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="a-grid2">
        <TextField label="Name" name="name" defaultValue={p?.label} />
        <Select label="Room" name="roomId" defaultValue={p?.roomId ?? rooms[0]?.value} options={rooms} />
        <TextField
          label="Price"
          name="priceFrom"
          defaultValue={p?.priceFrom ?? "From "}
          hint="Free text, e.g. “From $250” or “From ₦150,000”."
        />
        <TextField label="Korean name (optional)" name="korean" defaultValue={p?.korean ?? ""} lang="ko" />
      </div>
      <TextArea
        label="What’s included"
        name="items"
        defaultValue={p?.items.join("\n")}
        rows={4}
        hint="One item per line."
      />
      <Toggle label="Show on the home page" name="featured" defaultChecked={p?.featured ?? true} />
      <Toggle
        label="Published (visible on the site)"
        name="visible"
        defaultChecked={p?.visible ?? false}
        hint="Leave off to keep it as a hidden draft."
      />
    </AdminForm>
  );
}

export function PackageManager({
  packages,
  rooms,
  onReorder,
}: {
  packages: Pkg[];
  rooms: Opt[];
  onReorder: Reorder;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      {packages.length === 0 ? (
        <p className="a-empty">No packages yet. Add your first below.</p>
      ) : (
        <SortableList
          items={packages}
          onReorder={onReorder}
          render={(p) => (
            <div className="a-row-stack">
              <div className="a-row-link">
                <span className="a-row-main">
                  <b>{p.label}</b>
                  <span className="a-hint">
                    {p.roomName} · {p.priceFrom}
                  </span>
                </span>
                <span className="a-pills">
                  {p.priceFrom.includes("[your price]") && <Badge tone="warn">Needs a price</Badge>}
                  {!p.visible && <Badge tone="muted">Draft</Badge>}
                </span>
                <button
                  type="button"
                  className="a-btn ghost small"
                  onClick={() => setEditing(editing === p.id ? null : p.id)}
                  aria-expanded={editing === p.id}
                >
                  {editing === p.id ? "Close" : "Edit"}
                </button>
                <button
                  type="button"
                  className="a-btn danger small"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Delete “${p.label}”? This can’t be undone.`))
                      start(async () => {
                        await deletePackage(p.id);
                        router.refresh();
                      });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}
      {editing && packages.find((p) => p.id === editing) && (
        <section
          className="a-panel a-editing"
          aria-label="Edit package"
          ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <h2>Edit “{packages.find((p) => p.id === editing)!.label}”</h2>
          <PackageForm
            key={editing}
            p={packages.find((p) => p.id === editing)}
            rooms={rooms}
            onDone={() => setEditing(null)}
          />
        </section>
      )}
      <div className="a-add">
        {adding ? (
          <PackageForm rooms={rooms} onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="a-btn" onClick={() => setAdding(true)}>
            Add a package
          </button>
        )}
      </div>
    </>
  );
}

// ---- Testimonials ------------------------------------------------------------------
type T = { id: string; label: string; quote: string; role: string | null; visible: boolean };

function TestimonialForm({ t, onDone }: { t?: T; onDone: () => void }) {
  const router = useRouter();
  return (
    <AdminForm
      action={saveTestimonial}
      className="a-form a-inline-form"
      submitLabel={t ? "Save" : "Add testimonial"}
      onSaved={() => {
        router.refresh();
        onDone();
      }}
    >
      {t && <input type="hidden" name="id" value={t.id} />}
      <TextArea label="Their words" name="quote" defaultValue={t?.quote} rows={3} maxLength={600} />
      <div className="a-grid2">
        <TextField label="Name" name="name" defaultValue={t?.label} />
        <TextField label="Role or business (optional)" name="role" defaultValue={t?.role ?? ""} />
      </div>
      <Toggle label="Show on the site" name="visible" defaultChecked={t?.visible ?? true} />
      <ConfirmReal />
    </AdminForm>
  );
}

function ConfirmReal() {
  return <Toggle label="This is a real client’s words, shared with their permission" name="confirm" />;
}

export function TestimonialManager({ items, onReorder }: { items: T[]; onReorder: Reorder }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      {items.length === 0 ? (
        <p className="a-empty">
          No testimonials yet, so the section is hidden on the site. When a client says something lovely, add
          it here.
        </p>
      ) : (
        <SortableList
          items={items}
          onReorder={onReorder}
          render={(t) => (
            <div className="a-row-stack">
              <div className="a-row-link">
                <span className="a-row-main">
                  <b>
                    “{t.quote.slice(0, 80)}
                    {t.quote.length > 80 ? "…" : ""}”
                  </b>
                  <span className="a-hint">
                    {t.label}
                    {t.role ? ` · ${t.role}` : ""}
                  </span>
                </span>
                {!t.visible && <Badge tone="muted">Hidden</Badge>}
                <button
                  type="button"
                  className="a-btn ghost small"
                  onClick={() => setEditing(editing === t.id ? null : t.id)}
                  aria-expanded={editing === t.id}
                >
                  {editing === t.id ? "Close" : "Edit"}
                </button>
                <button
                  type="button"
                  className="a-btn danger small"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Delete this testimonial?"))
                      start(async () => {
                        await deleteTestimonial(t.id);
                        router.refresh();
                      });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}
      {editing && items.find((t) => t.id === editing) && (
        <section
          className="a-panel a-editing"
          aria-label="Edit testimonial"
          ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <h2>Edit testimonial</h2>
          <TestimonialForm
            key={editing}
            t={items.find((t) => t.id === editing)}
            onDone={() => setEditing(null)}
          />
        </section>
      )}
      <div className="a-add">
        {adding ? (
          <TestimonialForm onDone={() => setAdding(false)} />
        ) : (
          <button type="button" className="a-btn" onClick={() => setAdding(true)}>
            Add a testimonial
          </button>
        )}
      </div>
    </>
  );
}
