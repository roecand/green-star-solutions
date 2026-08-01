/**
 * A photograph that does not exist yet.
 *
 * Rather than a grey box or a stock-looking stand-in, the slot prints its own
 * shot specification. The page review and the shot list are the same document,
 * so nothing gets wired up from a filename without someone having looked at
 * the actual pixels. Every id here has a matching generation prompt in
 * IMAGE-BRIEF.md.
 *
 * Pass `src` once the real file lands in /public/media and the slot becomes
 * the photograph with no other change.
 */
export default function Slot({
  id,
  spec,
  className = "",
  src,
  alt,
  width,
  height,
  priority = false,
}: {
  id: string;
  spec: string;
  className?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={`plate ${className}`}>
        <picture>
          <source srcSet={src.replace(/\.jpg$/, ".webp")} type="image/webp" />
          <img
            src={src}
            alt={alt ?? ""}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  return (
    <div className={`slot ${className}`} role="img" aria-label={spec}>
      <span className="slot__id">{id}</span>
      <span className="slot__spec">{spec}</span>
    </div>
  );
}
