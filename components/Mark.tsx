/**
 * The brand mark.
 *
 * Replaces the old four-point ✦ sparkle, which is the glyph Gemini, Copilot
 * and every "generate with AI" button in the world use. On a site whose entire
 * pitch is "you look machine-made, we fix that", the logo was the AI logo.
 *
 * This is a six-arm typographic asterisk: three straight bars crossing at 60°.
 * Straight bars with rounded caps, no taper, no concave curve. It reads as a
 * printer's asterisk or a compass rose, not as a sparkle.
 *
 * Three directions are live at /mark-options for Robert to choose between.
 */

type Variant = "asterisk" | "stamp" | "none";

export default function Mark({
  size = 22,
  variant = "asterisk",
}: {
  size?: number;
  variant?: Variant;
}) {
  if (variant === "none") return null;

  if (variant === "stamp") {
    return (
      <span
        className="mark mark--stamp"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width={size} height={size} focusable="false">
          <rect width="24" height="24" rx="7" fill="var(--accent)" />
          <g stroke="var(--on-accent)" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5.9" y1="8.5" x2="18.1" y2="15.5" />
            <line x1="5.9" y1="15.5" x2="18.1" y2="8.5" />
          </g>
        </svg>
      </span>
    );
  }

  return (
    <span className="mark" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size} height={size} focusable="false">
        <g
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        >
          <line x1="12" y1="2.5" x2="12" y2="21.5" />
          <line x1="3.77" y1="7.25" x2="20.23" y2="16.75" />
          <line x1="3.77" y1="16.75" x2="20.23" y2="7.25" />
        </g>
      </svg>
    </span>
  );
}
