type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * The Green Star mark — a clean four-point sextile.
 * It reads as a star (the name) and as the AI "sparkle" at once,
 * so the brand mark and the positioning are the same glyph.
 */
export default function StarMark({ size = 20, className = "", title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`star ${className}`}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="currentColor"
    >
      <path d="M50 1.5 C 54.5 30.5 69.5 45.5 98.5 50 C 69.5 54.5 54.5 69.5 50 98.5 C 45.5 69.5 30.5 54.5 1.5 50 C 30.5 45.5 45.5 30.5 50 1.5 Z" />
    </svg>
  );
}
