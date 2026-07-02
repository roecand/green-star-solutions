/**
 * Live scaled-down embed of a concept site. The concept sites ship in
 * /public/concepts/, so previews are real renders of the actual page —
 * no screenshots to keep in sync.
 *
 * Fluid mode (default): the iframe is 1/scale the container's width, scaled
 * back down to fill it — works at any responsive size.
 * Fixed mode (pass `viewport`): the iframe renders at an exact viewport width
 * (e.g. 375 for a phone) and the container must be viewport × scale wide.
 */
type Props = {
  url: string;
  title: string;
  scale?: number;
  viewport?: number;
  className?: string;
};

export default function SitePreview({
  url,
  title,
  scale = 0.25,
  viewport,
  className = "",
}: Props) {
  const size = viewport ? `${viewport}px` : `calc(100% / ${scale})`;
  return (
    <div className={`sitepreview ${className}`} aria-hidden="true">
      <iframe
        src={url}
        title={title}
        loading="lazy"
        tabIndex={-1}
        scrolling="no"
        style={{
          width: size,
          height: `calc(100% / ${scale})`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}
