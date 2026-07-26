"use client";

import { useEffect, useState } from "react";
import StarMark from "./StarMark";
import { SCANNER_URL } from "@/lib/config";

// Path-prefixed anchors so the nav works from /portfolio pages too.
const links = [
  { href: "/#work", label: "The Work" },
  { href: "/#services", label: "Departments" },
  { href: "/#how", label: "How it works" },
  { href: "/portfolio/", label: "Portfolio" },
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
        <a href="/" className="nav__brand" aria-label="Green Star Solutions, home">
          <StarMark size={22} />
          <span>
            Green Star <span className="nav__brand-sub">Solutions</span>
          </span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav__link">
              {l.label}
            </a>
          ))}
          <a
            href={SCANNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="nav__link"
          >
            Free Leak Scan
          </a>
        </nav>

        <div className="nav__right">
          <a href="/#start" className="btn btn--frost nav__cta">
            Book a call
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
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <a
              href={SCANNER_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              Free Leak Scan
            </a>
            <a
              href="/#start"
              className="btn"
              onClick={() => setOpen(false)}
              style={{ marginTop: "0.5rem" }}
            >
              Book a call
            </a>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Deliberately unboxed: no bar, no blur, no border. That only works
           because the nav is NOT sticky — it scrolls away with the page.
           Pinning a transparent bar put ink links over 75% of the page's
           text and made them vanish entirely over the dark sections. If this
           ever becomes sticky again it needs a background and dark-surface
           inversion, or both problems come straight back. */
        .nav {
          position: relative;
          z-index: 60;
        }
        .nav__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
        }
        .nav__brand {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-display), serif;
          font-weight: 500;
          font-size: var(--t-l);
          letter-spacing: -0.01em;
        }
        .nav__brand-sub {
          color: var(--stone);
          font-weight: 500;
        }
        .nav__links {
          display: flex;
          gap: 2.1rem;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }
        .nav__link {
          font-size: var(--t-s);
          font-weight: 500;
          color: var(--ink);
          opacity: 0.62;
          position: relative;
          padding-bottom: 3px;
          transition: opacity 0.2s ease;
        }
        .nav__link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: 0;
          height: 1px;
          width: 100%;
          background: var(--forest);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .nav__link:hover {
          opacity: 1;
        }
        .nav__link:hover::after {
          transform: scaleX(1);
        }
        .nav__right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .nav__cta {
          padding: 0.62em 1.15em;
        }
        .nav__toggle {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          width: 42px;
          height: 42px;
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          background: transparent;
          cursor: pointer;
        }
        .nav__toggle span {
          display: block;
          width: 16px;
          height: 1.6px;
          background: var(--ink);
          margin-inline: auto;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        .nav__toggle span[data-open="true"]:first-child {
          transform: translateY(3.3px) rotate(45deg);
        }
        .nav__toggle span[data-open="true"]:last-child {
          transform: translateY(-3.3px) rotate(-45deg);
        }
        .nav__sheet {
          position: fixed;
          inset: 72px 0 0;
          z-index: 55;
          background: color-mix(in srgb, var(--paper) 96%, transparent);
          backdrop-filter: blur(6px);
        }
        .nav__sheet-inner {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 1.5rem var(--gutter) 2rem;
          font-family: var(--font-display), serif;
          font-size: var(--t-xl);
          font-weight: 500;
          letter-spacing: -0.01em;
        }
        .nav__sheet-inner a:not(.btn) {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--line);
        }
        @media (max-width: 880px) {
          .nav__links {
            display: none;
          }
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
