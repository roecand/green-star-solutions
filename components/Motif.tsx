export type MotifShape =
  | "cleave"
  | "torque"
  | "interlock"
  | "shell"
  | "warp"
  | "drift";

/**
 * An abstract dimensional volume, ported from the greenstar-systems package.
 *
 * Six forms drawn entirely in SVG gradients: no images, no CSS 3D, no
 * libraries, so they cost nothing to load and render identically everywhere.
 * Depth comes from occlusion, cut faces and one light source at upper-left,
 * never from a blur. That distinction matters here: this site has no shadow
 * token and depth in the layout still comes from colour blocking and scale.
 * A motif is a graphic object with volume, which is a different thing from
 * chrome pretending to float.
 *
 * Lighting reads --gs-form-hi / -mid / -lo / -cut from brand.css, which flip
 * inside .on-dark, so one motif serves paper and forest with no variant.
 *
 * Use them large and cropped by a slab edge. Small and centred they become
 * clip art, which is the one way to get this wrong.
 *
 * No hooks, so this stays a Server Component: gradient ids are derived from
 * `shape`, which is unique as long as a shape appears once per page. Pass
 * `uid` if you ever need the same shape twice.
 */
export default function Motif({
  shape = "cleave",
  size = 320,
  className = "",
  uid,
}: {
  shape?: MotifShape;
  size?: number;
  className?: string;
  uid?: string;
}) {
  const g = (n: string) => `gsm-${uid ?? shape}-${n}`;
  const common = {
    width: size,
    height: size,
    className: `motif ${className}`,
    "aria-hidden": true,
    focusable: "false" as const,
  };

  if (shape === "torque") {
    return (
      <svg {...common} viewBox="0 0 120 140">
        <defs>
          <linearGradient id={g("t")} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--gs-form-lo)" />
            <stop offset="30%" stopColor="var(--gs-form-hi)" />
            <stop offset="70%" stopColor="var(--gs-form-mid)" />
            <stop offset="100%" stopColor="var(--gs-form-lo)" />
          </linearGradient>
        </defs>
        <g fill={`url(#${g("t")})`}>
          {[
            [118, -26],
            [102, -17],
            [86, -8],
            [70, 1],
            [54, 10],
            [38, 19],
            [22, 28],
          ].map(([cy, rot]) => (
            <ellipse
              key={cy}
              cx="60"
              cy={cy}
              rx="36"
              ry="9"
              transform={`rotate(${rot} 60 ${cy})`}
            />
          ))}
        </g>
      </svg>
    );
  }

  if (shape === "interlock") {
    return (
      <svg {...common} viewBox="0 0 140 130">
        <defs>
          <linearGradient id={g("a")} x1="0%" y1="0%" x2="100%" y2="40%">
            <stop offset="0%" stopColor="var(--gs-form-hi)" />
            <stop offset="100%" stopColor="var(--gs-form-mid)" />
          </linearGradient>
          <linearGradient id={g("b")} x1="0%" y1="100%" x2="60%" y2="0%">
            <stop offset="0%" stopColor="var(--gs-form-lo)" />
            <stop offset="100%" stopColor="var(--gs-form-mid)" />
          </linearGradient>
        </defs>
        <g transform="rotate(-32 70 63)">
          <rect x="14" y="46" width="112" height="32" rx="5" fill={`url(#${g("b")})`} />
          <path d="M126 46 L126 78 L118 72 L118 52 Z" fill="var(--gs-form-lo)" />
        </g>
        <g transform="rotate(10 69 63)">
          <rect x="54" y="18" width="30" height="90" rx="5" fill={`url(#${g("a")})`} />
          <path d="M54 18 L84 18 L78 25 L60 25 Z" fill="var(--gs-form-hi)" />
        </g>
      </svg>
    );
  }

  if (shape === "shell") {
    return (
      <svg {...common} viewBox="0 0 130 130">
        <defs>
          <linearGradient id={g("a")} x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="var(--gs-form-hi)" />
            <stop offset="100%" stopColor="var(--gs-form-lo)" />
          </linearGradient>
          <linearGradient id={g("b")} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="var(--gs-form-mid)" />
            <stop offset="100%" stopColor="var(--gs-form-lo)" />
          </linearGradient>
        </defs>
        <path fill={`url(#${g("a")})`} d="M65 6 A59 59 0 0 1 65 124 L65 106 A41 41 0 0 0 65 24 Z" />
        <path fill={`url(#${g("b")})`} d="M65 26 A39 39 0 0 1 65 104 L65 88 A23 23 0 0 0 65 42 Z" />
        <path fill="var(--gs-form-cut)" opacity=".5" d="M60 6 H65 V24 H60 Z M60 106 H65 V124 H60 Z" />
        <circle cx="65" cy="65" r="13" fill={`url(#${g("a")})`} />
      </svg>
    );
  }

  if (shape === "warp") {
    return (
      <svg {...common} viewBox="0 0 140 130">
        <defs>
          <linearGradient id={g("w")} x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="var(--gs-form-lo)" />
            <stop offset="38%" stopColor="var(--gs-form-hi)" />
            <stop offset="72%" stopColor="var(--gs-form-mid)" />
            <stop offset="100%" stopColor="var(--gs-form-lo)" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${g("w")})`}
          d="M10 40 C 44 4, 96 4, 130 40 C 118 62, 118 74, 130 96 C 96 60, 44 60, 10 96 C 22 74, 22 62, 10 40 Z"
        />
      </svg>
    );
  }

  if (shape === "drift") {
    return (
      <svg {...common} viewBox="0 0 140 130">
        <defs>
          <linearGradient id={g("a")} x1="0%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="var(--gs-form-hi)" />
            <stop offset="100%" stopColor="var(--gs-form-mid)" />
          </linearGradient>
          <linearGradient id={g("b")} x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="var(--gs-form-mid)" />
            <stop offset="100%" stopColor="var(--gs-form-lo)" />
          </linearGradient>
        </defs>
        <path d="M4 96 L58 78 L84 92 L30 112 Z" fill={`url(#${g("b")})`} opacity=".7" />
        <path d="M62 66 L134 44 L134 72 L62 96 Z" fill={`url(#${g("b")})`} />
        <path d="M18 34 L96 12 L124 30 L46 56 Z" fill={`url(#${g("a")})`} />
        <path d="M8 58 L52 44 L66 54 L22 70 Z" fill={`url(#${g("b")})`} opacity=".85" />
      </svg>
    );
  }

  return (
    <svg {...common} viewBox="0 0 130 130">
      <defs>
        <linearGradient id={g("a")} x1="10%" y1="0%" x2="90%" y2="80%">
          <stop offset="0%" stopColor="var(--gs-form-hi)" />
          <stop offset="55%" stopColor="var(--gs-form-mid)" />
          <stop offset="100%" stopColor="var(--gs-form-lo)" />
        </linearGradient>
        <linearGradient id={g("b")} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--gs-form-mid)" />
          <stop offset="100%" stopColor="var(--gs-form-lo)" />
        </linearGradient>
      </defs>
      <g transform="translate(9,11)">
        <path
          fill={`url(#${g("b")})`}
          d="M18 66 C 6 44, 22 20, 46 20 L 96 66 C 96 92, 74 108, 52 104 C 30 100, 24 82, 18 66 Z"
        />
        <path fill="var(--gs-form-cut)" opacity=".28" d="M18 66 L96 66 L46 20 Z" />
      </g>
      <path fill={`url(#${g("a")})`} d="M14 60 C 2 38, 18 14, 42 14 C 66 14, 84 32, 92 60 Z" />
      <path fill="var(--gs-form-cut)" d="M14 60 L92 60 L88 66 L18 66 Z" />
    </svg>
  );
}
