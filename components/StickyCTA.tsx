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
  const [pastHero, setPastHero] = useState(false);
  const [atForm, setAtForm] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setPastHero(!entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Retire the chip once the form is on screen.
  //
  // It is a route TO the form, so over the form it is redundant — and on a
  // phone it is worse than redundant. Fixed bottom-right at 375px, the chip
  // lands on top of the form's own Continue button: measured, the chip ends
  // at y=802 and Continue starts at y=783, and elementFromPoint in that band
  // returns the chip. Someone advancing the form taps "Book a free call" and
  // gets thrown out of it.
  //
  // The comment above says a corner chip cannot collide with anything. It
  // cannot collide with page TEXT, which is what that was about. It very much
  // can collide with a control.
  useEffect(() => {
    const form = document.querySelector("#start");
    if (!form) return;
    const io = new IntersectionObserver(([entry]) => setAtForm(entry.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    io.observe(form);
    return () => io.disconnect();
  }, []);

  const show = pastHero && !atForm;

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
