import { cn } from "@/lib/utils";

/**
 * The hero score visual: a vessel that FILLS with "leak" as risk rises.
 * Risk = 100 - score, so a 0/100 score renders as a dramatically full tank
 * (not an empty, broken-looking ring) and a 95/100 shows barely a puddle.
 * Ties the "Revenue Leak" metaphor to the visual instead of a generic ring.
 */

function fluidColor(score: number): { fill: string; soft: string } {
  if (score >= 80) return { fill: "#16a34a", soft: "#16a34a22" };
  if (score >= 55) return { fill: "#d97706", soft: "#d9770622" };
  return { fill: "#dc2626", soft: "#dc262622" };
}

export function LeakGauge({
  score,
  label = "Revenue Leak Score",
  className,
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  const risk = Math.min(100, Math.max(0, 100 - score));
  const { fill, soft } = fluidColor(score);

  // Vessel interior: y 14..146 (height 132) inside a 108-wide viewBox.
  const innerTop = 14;
  const innerHeight = 132;
  const fluidHeight = Math.round((risk / 100) * innerHeight);
  const fluidY = innerTop + innerHeight - fluidHeight;
  // Wave sits at the fluid surface (skip when empty or brim-full).
  const showWave = fluidHeight > 6 && fluidHeight < innerHeight - 2;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg
        width="128"
        height="176"
        viewBox="0 0 108 160"
        role="img"
        aria-label={`${label}: ${score} out of 100 — ${risk}% at-risk`}
      >
        <defs>
          <clipPath id={`vessel-${score}`}>
            <rect x="12" y={innerTop} width="84" height={innerHeight} rx="14" />
          </clipPath>
        </defs>

        {/* Vessel body */}
        <rect
          x="12"
          y={innerTop}
          width="84"
          height={innerHeight}
          rx="14"
          fill={soft}
          stroke="var(--border)"
          strokeWidth="2.5"
        />

        {/* The leak fluid */}
        <g clipPath={`url(#vessel-${score})`}>
          <rect x="12" y={fluidY} width="84" height={fluidHeight + 4} fill={fill} opacity="0.85">
            <animate
              attributeName="y"
              from={innerTop + innerHeight}
              to={fluidY}
              dur="1.1s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.25 0.1 0.25 1"
            />
            <animate
              attributeName="height"
              from="0"
              to={fluidHeight + 4}
              dur="1.1s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.25 0.1 0.25 1"
            />
          </rect>
          {showWave && (
            <path
              d={`M 4 ${fluidY} q 10 -5 21 0 t 21 0 t 21 0 t 21 0 t 21 0 v 8 h -110 z`}
              fill={fill}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; -12 0; 0 0"
                dur="3.4s"
                repeatCount="indefinite"
              />
            </path>
          )}
        </g>

        {/* Score, high-contrast on a small plate so it reads over any fill level */}
        <rect x="26" y="60" width="56" height="40" rx="10" fill="var(--card)" opacity="0.92" />
        <text
          x="54"
          y="88"
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill="var(--foreground)"
        >
          {score}
        </text>

        {/* Drip below the vessel when risk is high — the leak, literally */}
        {risk >= 45 && (
          <circle cx="54" cy="152" r="3.5" fill={fill}>
            <animate attributeName="cy" values="149;157;149" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.15;0.9" dur="1.6s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {risk >= 60
            ? `${risk}% of your revenue-capture potential is at risk`
            : risk >= 25
              ? `${risk}% at risk — worth plugging`
              : `only ${risk}% at risk — strong position`}
        </p>
      </div>
    </div>
  );
}
