import type { Metadata } from "next";
import Mark from "@/components/Mark";

/**
 * Unlinked review page. Three replacements for the ✦ sparkle, side by side at
 * real sizes, so the choice gets made by looking rather than by describing.
 *
 * Delete this route once Robert picks one.
 */
export const metadata: Metadata = {
  title: "Mark options",
  robots: { index: false, follow: false },
};

const options = [
  {
    key: "A",
    name: "Wordmark only",
    variant: "none" as const,
    note: "No glyph at all. Clay and IDEO both run essentially typographic lockups: at this size Archivo expanded is already distinctive enough to carry the name on its own. Nothing to misread, nothing to license, nothing that resembles anyone else's icon.",
  },
  {
    key: "B",
    name: "Six-arm asterisk",
    variant: "asterisk" as const,
    note: "Three straight bars crossing at 60 degrees. Straight edges, butt caps, no taper and no concave curve, which is exactly what separates a printer's asterisk from the AI sparkle. Still reads as a star, and it survives at 16px.",
  },
  {
    key: "C",
    name: "Forest stamp",
    variant: "stamp" as const,
    note: "The asterisk knocked out of a rounded forest square. The loudest of the three and the only one that carries the brand colour into the lockup, which makes it the strongest favicon and the most demanding thing to place on a photograph.",
  },
];

export default function MarkOptions() {
  return (
    <main className="container section">
      <h1 className="wide t-2xl" style={{ maxWidth: "18ch" }}>
        Three replacements for the sparkle.
      </h1>
      <p className="lead measure-wide" style={{ marginTop: "1.2rem" }}>
        The ✦ four-point sparkle is the glyph Gemini, Copilot and every
        &ldquo;generate with AI&rdquo; button uses. On a site whose argument is
        that you look machine-made, it was the logo. Pick one of these, or tell
        me none of them work.
      </p>

      <div
        style={{
          display: "grid",
          gap: "clamp(1.5rem,3vw,2.5rem)",
          marginTop: "clamp(2.5rem,5vw,4rem)",
        }}
      >
        {options.map((o) => (
          <section
            key={o.key}
            className="engrow"
            style={{ gridTemplateColumns: "1fr", gap: "1.4rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2.5rem",
                flexWrap: "wrap",
              }}
            >
              {/* nav size */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  fontVariationSettings: '"wdth" 125',
                  fontWeight: 700,
                  fontSize: "1.02rem",
                  letterSpacing: "-0.03em",
                }}
              >
                <Mark size={20} variant={o.variant} />
                Green Star
              </span>

              {/* footer size */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontVariationSettings: '"wdth" 125',
                  fontWeight: 700,
                  fontSize: "1.4rem",
                  letterSpacing: "-0.03em",
                }}
              >
                <Mark size={26} variant={o.variant} />
                Green Star Solutions
              </span>

              {/* favicon size, on both grounds. Skipped for the wordmark
                  option, which has no glyph to show at 16px. */}
              {o.variant !== "none" && (
                <span
                  style={{
                    display: "inline-flex",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <Mark size={16} variant={o.variant} />
                  <span
                    style={{
                      background: "var(--forest)",
                      color: "var(--paper)",
                      padding: "0.5rem", borderRadius: "10px",
                      display: "inline-flex",
                    }}
                  >
                    <Mark size={16} variant={o.variant} />
                  </span>
                </span>
              )}
            </div>

            <div>
              <h2 className="engrow__name">
                {o.key}. {o.name}
              </h2>
              <p className="engrow__desc">{o.note}</p>
            </div>
          </section>
        ))}
      </div>

      <p className="trades__note">
        Currently live on the site: B. Change the default in
        components/Mark.tsx, or pass variant to the two lockups in Nav and
        Footer.
      </p>
    </main>
  );
}
