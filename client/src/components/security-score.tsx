import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface SecurityScoreProps {
  score: number;
  size?: "sm" | "lg";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500 dark:text-emerald-400";
  if (score >= 60) return "text-yellow-500 dark:text-yellow-400";
  if (score >= 40) return "text-orange-500 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-emerald-500 dark:stroke-emerald-400";
  if (score >= 60) return "stroke-yellow-500 dark:stroke-yellow-400";
  if (score >= 40) return "stroke-orange-500 dark:stroke-orange-400";
  return "stroke-red-500 dark:stroke-red-400";
}

function getScoreBgRing(): string {
  return "stroke-muted";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Secure";
  if (score >= 60) return "Fair";
  if (score >= 40) return "At Risk";
  return "Critical";
}

function getScoreIcon(score: number, size: "sm" | "lg") {
  const cls = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  if (score >= 80) return <ShieldCheck className={cls} />;
  if (score >= 40) return <ShieldAlert className={cls} />;
  return <ShieldX className={cls} />;
}

export function SecurityScore({ score, size = "lg" }: SecurityScoreProps) {
  const dim = size === "lg" ? 160 : 80;
  const strokeW = size === "lg" ? 8 : 5;
  const r = (dim - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            strokeWidth={strokeW}
            className={getScoreBgRing()}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className={`${getScoreRingColor(score)} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${getScoreColor(score)}`}>
          <span className={`font-bold ${size === "lg" ? "text-3xl" : "text-lg"}`} data-testid="text-security-score">
            {score}
          </span>
          {size === "lg" && <span className="text-xs text-muted-foreground">/ 100</span>}
        </div>
      </div>
      <div className={`flex items-center gap-1.5 ${getScoreColor(score)}`}>
        {getScoreIcon(score, size)}
        <span className={`font-semibold ${size === "lg" ? "text-base" : "text-xs"}`} data-testid="text-score-label">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
