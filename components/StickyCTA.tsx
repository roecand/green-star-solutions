"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Persistent route to the form, shown once the hero has scrolled away.
 *
 * The nav is not sticky, deliberately: a transparent sticky bar shipped on
 * this site once and put ink links over page text across 75% of the scroll
 * range, measuring 1.00:1 over the footer. A solid chip pinned in the corner
 * cannot collide with anything.
 *
 * The sentinel spans the height of the fold and is absolutely positioned
 * inside a zero-height wrapper, so it measures the hero without occupying any
 * layout. A zero-height sentinel plus a negative rootMargin would read as
 * "not intersecting" at scroll 0 and show the chip immediately, which is the
 * opposite of the point.
 *
 * IntersectionObserver, not a scroll listener.
 */
export default function StickyCTA() {
  const sentinel = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setShow(!entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div style={{ position: "relative", height: 0 }} aria-hidden="true">
        <div
          ref={sentinel}
          style={{
            position: "absolute",
            top: 0,
            width: "1px",
            height: "78vh",
            pointerEvents: "none",
          }}
        />
      </div>
      <div className="stickycta" data-show={show}>
        <a className="btn" href="#start" tabIndex={show ? 0 : -1}>
          Book a free call
        </a>
      </div>
    </>
  );
}
