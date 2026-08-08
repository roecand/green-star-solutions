"use client";

import { useEffect, useRef, useState } from "react";
import { whenIntroDone } from "@/lib/intro-gate";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section" | "article" | "ul" | "ol";
  /**
   * Which entrance this block gets. Chosen per section by hand, not derived
   * from an index. There is deliberately no `delay` prop: a uniform
   * delay={i * n} cascade across every grid on a page is the single most
   * recognisable machine-built tell in front-end code, because the uniformity
   * reveals that a rule was the artifact rather than the page.
   */
  motion?: "rise" | "slide" | "scale";
};

export default function Reveal({
  children,
  className = "",
  as = "div",
  motion = "rise",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let io: IntersectionObserver | null = null;
    let failsafe = 0;

    // Wait for the signature intro to finish before observing anything. An
    // IntersectionObserver reports viewport geometry and knows nothing about
    // being covered, so starting it now would spend every above-the-fold
    // reveal behind the veil. Resolves immediately when there is no intro.
    whenIntroDone().then(() => {
      if (cancelled) return;

      let delivered = false;
      io = new IntersectionObserver(
        (entries) => {
          delivered = true;
          entries.forEach((e) => {
            if (e.isIntersecting) {
              setShown(true);
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
      );
      io.observe(el);

      // Anything already scrolled past is shown immediately.
      //
      // Observers only attach once the intro releases, roughly two seconds in.
      // A visitor who scrolls hard in those two seconds moves content ABOVE
      // the viewport before anything is watching it, and an element above the
      // viewport never intersects again — so it would sit at opacity 0 for the
      // rest of the session. Worse, the observer's initial callback still
      // fires (reporting not-intersecting), which sets `delivered` and
      // disarms the failsafe below. Measuring the element's own position is
      // the only thing that catches this case.
      if (el.getBoundingClientRect().top < window.innerHeight) setShown(true);

      // Failsafe. Content must never stay invisible because an optional
      // enhancement did not run: the reveal starts at opacity 0, so anything
      // that stops the observer from delivering takes the whole page with it.
      // The spec guarantees an initial callback on observe, but some embedded
      // and webview engines never deliver one. If nothing has arrived shortly
      // after mount, show the content and stop waiting.
      failsafe = window.setTimeout(() => {
        if (!delivered) setShown(true);
      }, 1200);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      io?.disconnect();
    };
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={`reveal reveal--${motion} ${shown ? "is-in" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
