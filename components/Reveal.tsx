"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section" | "article";
};

/**
 * Fade + defocus on scroll into view. Everything in a group arrives together —
 * there is deliberately no stagger prop. A uniform `delay={i * n}` cascade is
 * one of the strongest machine-built tells, and removing it is most of why
 * this page stopped reading as generated.
 */
export default function Reveal({
  children,
  className = "",
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  return (
    <Tag ref={ref} className={`reveal ${shown ? "is-in" : ""} ${className}`}>
      {children}
    </Tag>
  );
}
