import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  extracting: { label: "Extracting", variant: "outline" },
  analyzing: { label: "Analyzing", variant: "outline" },
  running: { label: "Running", variant: "outline" },
  completed: { label: "Completed", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  active: { label: "Active", variant: "outline" },
};

const RISK_CONFIG: Record<string, { emoji: string; className: string }> = {
  low: { emoji: "\uD83D\uDFE2", className: "border-green-500/50 text-green-400" },
  medium: { emoji: "\uD83D\uDFE1", className: "border-yellow-500/50 text-yellow-400" },
  high: { emoji: "\uD83D\uDD34", className: "border-red-500/50 text-red-400" },
};

const RECOMMENDATION_CONFIG: Record<string, { label: string; className: string }> = {
  eligible: { label: "Eligible", className: "border-green-500/50 text-green-400 bg-green-500/10" },
  ineligible: { label: "Ineligible", className: "border-red-500/50 text-red-400 bg-red-500/10" },
  needs_amendment: { label: "Needs Amendment", className: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk) return null;
  const config = RISK_CONFIG[risk];
  if (!config) return <Badge variant="outline">{risk}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.emoji} {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
    </Badge>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation: string | null }) {
  if (!recommendation) return null;
  const config = RECOMMENDATION_CONFIG[recommendation];
  if (!config) return <Badge variant="outline">{recommendation}</Badge>;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
