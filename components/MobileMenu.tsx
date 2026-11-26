"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useDialog } from "./viewers/useDialog";

type Room = { slug: string; name: string; korean: string };

/**
 * Full-screen menu on phones: room names stagger in, in large serif, with
 * their Korean names. Closes on Esc, swipe up, or choosing a link.
 */
export function MobileMenu({ rooms }: { rooms: Room[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { ref, close: shut } = useDialog(open, close);
  const startY = useRef<number | null>(null);

  return (
    <>
      <button
        type="button"
        className="theme-toggle menu-btn"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M4 8h16M4 16h16" strokeLinecap="round" />
        </svg>
      </button>
      <dialog
        ref={ref}
        className="menu"
        aria-label="Menu"
        onTouchStart={(e) => (startY.current = e.touches[0].clientY)}
        onTouchEnd={(e) => {
          if (startY.current !== null && startY.current - e.changedTouches[0].clientY > 80) shut();
          startY.current = null;
        }}
      >
        <div className="menu-top">
          <span className="brand">
            <b>Caitly Racheal</b>
            <span className="ko" lang="ko">
              아틀리에
            </span>
          </span>
          <button type="button" className="icon-btn" onClick={shut} aria-label="Close menu" autoFocus>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="menu-list">
          {rooms.map((r, i) => (
            <li key={r.slug} style={{ "--i": i } as React.CSSProperties}>
              <Link href={`/work/${r.slug}`} onClick={shut}>
                {r.name.replace(/^The /, "")}
                <span className="ko" lang="ko">
                  {r.korean}
                </span>
              </Link>
            </li>
          ))}
          <li style={{ "--i": rooms.length } as React.CSSProperties}>
            <Link href="/#commission" onClick={shut}>
              Commission
              <span className="ko" lang="ko">
                함께 만들어요
              </span>
            </Link>
          </li>
        </ul>
        <p className="menu-foot">Swipe up to close</p>
      </dialog>
    </>
  );
}
