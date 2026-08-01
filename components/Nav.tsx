"use client";

import { useEffect, useState } from "react";
import Mark from "./Mark";
import { SCANNER_URL } from "@/lib/config";

// Path-prefixed anchors so the nav works from /portfolio pages too. The lint
// rule that wants <Link> here is a false positive: these are hash targets on
// a different route.
const links = [
  { href: "/#work", label: "Work" },
  { href: "/#services", label: "Departments" },
  { href: "/#how", label: "Method" },
  { href: "/portfolio/", label: "Portfolio" },
  { href: SCANNER_URL, label: "Free leak scan", external: true },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a
          href="/"
          className="nav__brand"
          aria-label="Green Star Solutions, home"
        >
          <Mark size={20} />
          <span>Green Star</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav__link"
              {...(l.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <a href="/#start" className="btn nav__cta">
            Book a free call
          </a>
          <button
            className="nav__toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span data-open={open} />
            <span data-open={open} />
          </button>
        </div>
      </div>

      {open && (
        <div className="nav__sheet" onClick={() => setOpen(false)}>
          <div className="nav__sheet-inner" onClick={(e) => e.stopPropagation()}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/#start"
              className="btn"
              onClick={() => setOpen(false)}
              style={{ marginTop: "1.2rem" }}
            >
              Book a free call
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Not sticky, and the reason stays with the code: pinning a
           transparent bar here put ink links over 75% of the page's text and
           made them measure 1.00:1 over the footer. If this ever becomes
           sticky again it needs a solid background AND dark-surface
           inversion, or both problems come straight back. The persistent
           route to the form is StickyCTA instead, which is a solid chip in a
           corner and cannot collide with anything. */
        .nav {
          position: relative;
          z-index: 60;
        }
        .nav__inner {
          display: flex;
          align-items: center;
          gap: clamp(1.5rem, 4vw, 3rem);
          height: 76px;
        }
        .nav__brand {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          font-variation-settings: "wdth" var(--wdth-wide);
          font-weight: 700;
          font-size: 1.02rem;
          letter-spacing: -0.03em;
          white-space: nowrap;
          transition: color var(--t-fast) var(--ease);
        }
        .nav__brand:hover {
          color: var(--stone);
        }
        .nav__links {
          display: flex;
          gap: clamp(1.1rem, 2.2vw, 2.1rem);
          margin-left: auto;
        }
        .nav__link {
          font-size: var(--t-s);
          font-weight: 500;
          color: var(--ink-soft);
          position: relative;
          padding-bottom: 3px;
          white-space: nowrap;
          transition: color var(--t-fast) var(--ease);
        }
        .nav__link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 100%;
          background: var(--accent);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform var(--t-mid) var(--ease);
        }
        .nav__link:hover {
          color: var(--ink);
        }
        .nav__link:hover::after {
          transform: scaleX(1);
        }
        .nav__right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: auto;
        }
        .nav__cta {
          padding: 0.7em 1.2em;
        }
        .nav__toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 44px;
          height: 44px;
          border: 1px solid var(--line-strong);
          border-radius: var(--radius);
          background: transparent;
          cursor: pointer;
          transition: border-color var(--t-fast) var(--ease),
            background var(--t-fast) var(--ease);
        }
        .nav__toggle:hover {
          border-color: var(--ink);
          background: var(--paper-2);
        }
        .nav__toggle span {
          display: block;
          width: 17px;
          height: 2px;
          background: var(--ink);
          margin-inline: auto;
          transition: transform var(--t-mid) var(--ease);
        }
        .nav__toggle span[data-open="true"]:first-child {
          transform: translateY(3.5px) rotate(45deg);
        }
        .nav__toggle span[data-open="true"]:last-child {
          transform: translateY(-3.5px) rotate(-45deg);
        }
        .nav__sheet {
          position: fixed;
          inset: 76px 0 0;
          z-index: 55;
          background: var(--paper);
        }
        .nav__sheet-inner {
          display: flex;
          flex-direction: column;
          padding: 1.5rem var(--gutter) 2rem;
          font-variation-settings: "wdth" var(--wdth-wide);
          font-size: var(--t-xl);
          font-weight: 700;
          letter-spacing: -0.03em;
        }
        .nav__sheet-inner a:not(.btn) {
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--line);
          transition: transform var(--t-mid) var(--ease),
            border-bottom-color var(--t-mid) var(--ease);
        }
        .nav__sheet-inner a:not(.btn):hover {
          transform: translateX(0.6rem);
          border-bottom-color: var(--ink);
        }
        .nav__sheet-inner .btn {
          align-self: flex-start;
        }
        @media (max-width: 1000px) {
          .nav__links,
          .nav__cta {
            display: none;
          }
          .nav__toggle {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
}
