import { cn } from "@/lib/utils";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(score: number): string {
  if (score >= 80) return "var(--primary)";
  if (score >= 55) return "var(--warning)";
  return "var(--danger)";
}

export function ScoreRing({
  score,
  size = 120,
  label,
  className,
}: {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const offset = CIRCUMFERENCE * (1 - score / 100);
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${label ?? "Score"}: ${score} out of 100`}
      >
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="var(--muted)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={ringColor(score)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          className="animate-score-ring"
          style={{ "--ring-circumference": CIRCUMFERENCE } as React.CSSProperties}
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fill="var(--foreground)"
        >
          {score}
        </text>
      </svg>
      {label && <p className="text-center text-sm font-medium">{label}</p>}
    </div>
  );
}
