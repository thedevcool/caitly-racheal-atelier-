"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useTransition, type ReactNode } from "react";

type Item = { id: string; label: string };

/**
 * Drag to reorder (mouse, touch and keyboard via dnd-kit), plus up/down
 * buttons for anyone who'd rather tap. Saves the new order immediately.
 */
export function SortableList<T extends Item>({
  items: initial,
  onReorder,
  render,
}: {
  items: T[];
  onReorder: (ids: string[]) => Promise<unknown>;
  render: (item: T) => ReactNode;
}) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const [announce, setAnnounce] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commit = (next: T[], moved?: T) => {
    setItems(next);
    if (moved) setAnnounce(`${moved.label} moved to position ${next.indexOf(moved) + 1} of ${next.length}.`);
    start(async () => {
      await onReorder(next.map((i) => i.id));
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    commit(arrayMove(items, from, to), items[from]);
  };

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    commit(arrayMove(items, i, j), items[i]);
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className={pending ? "a-sortable is-saving" : "a-sortable"}>
            {items.map((item, i) => (
              <Row key={item.id} item={item} index={i} count={items.length} move={move}>
                {render(item)}
              </Row>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
    </>
  );
}

function Row({
  item,
  index,
  count,
  move,
  children,
}: {
  item: Item;
  index: number;
  count: number;
  move: (i: number, d: -1 | 1) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <li
      ref={setNodeRef}
      className={isDragging ? "a-row is-dragging" : "a-row"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className="a-handle"
        aria-label={`Drag to reorder ${item.label}`}
        {...attributes}
        {...listeners}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>
      <div className="a-row-body">{children}</div>
      <div className="a-updown">
        <button
          type="button"
          onClick={() => move(index, -1)}
          disabled={index === 0}
          aria-label={`Move ${item.label} up`}
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => move(index, 1)}
          disabled={index === count - 1}
          aria-label={`Move ${item.label} down`}
        >
          ↓
        </button>
      </div>
    </li>
  );
}
