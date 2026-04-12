import { cn } from "@/lib/utils";
import type { RiskLevel, Severity, Recommendation } from "@/lib/types";
import { RISK_LABELS, SEVERITY_LABELS, RECOMMENDATION_LABELS } from "@/lib/constants";

interface RiskBadgeProps {
  readonly level: RiskLevel;
  readonly className?: string;
}

const riskStyles: Record<RiskLevel, string> = {
  high: "bg-risk-high/10 text-risk-high border-risk-high/20",
  medium: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
  low: "bg-risk-low/10 text-risk-low border-risk-low/20",
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        riskStyles[level],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          level === "high" && "bg-risk-high",
          level === "medium" && "bg-risk-medium",
          level === "low" && "bg-risk-low"
        )}
      />
      {RISK_LABELS[level]}
    </span>
  );
}

interface SeverityBadgeProps {
  readonly severity: Severity;
  readonly className?: string;
}

const severityToRisk: Record<Severity, RiskLevel> = {
  critical: "high",
  major: "medium",
  minor: "low",
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const level = severityToRisk[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        riskStyles[level],
        className
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

interface RecommendationBadgeProps {
  readonly recommendation: Recommendation;
  readonly className?: string;
}

const recommendationStyles: Record<Recommendation, string> = {
  eligible: "bg-risk-low/10 text-risk-low border-risk-low/20",
  ineligible: "bg-risk-high/10 text-risk-high border-risk-high/20",
  needs_amendment: "bg-risk-medium/10 text-risk-medium border-risk-medium/20",
};

export function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        recommendationStyles[recommendation],
        className
      )}
    >
      {RECOMMENDATION_LABELS[recommendation]}
    </span>
  );
}
