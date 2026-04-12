"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Building2, ScrollText, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomNodeProps {
  data: Record<string, unknown>;
  selected?: boolean;
}

function ClientNodeComponent({ data, selected }: CustomNodeProps) {
  const riskLevel = data.riskScore as string | undefined;
  const riskColor =
    riskLevel === "high"
      ? "border-risk-high/50"
      : riskLevel === "medium"
        ? "border-risk-medium/50"
        : "border-risk-low/50";

  const dotColor =
    riskLevel === "high"
      ? "bg-risk-high"
      : riskLevel === "medium"
        ? "bg-risk-medium"
        : "bg-risk-low";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-4 py-3 shadow-lg transition-all",
        riskColor,
        selected && "ring-1 ring-gold/50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">{data.label as string}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
            <span className="text-[10px] text-muted-foreground capitalize">
              {(data.recommendation as string)?.replace("_", " ") ?? "pending"}
            </span>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border !w-2 !h-2" />
    </div>
  );
}

function ClauseNodeComponent({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface px-3 py-2 shadow-md transition-all",
        selected && "ring-1 ring-gold/50"
      )}
    >
      <div className="flex items-center gap-2">
        <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[11px] font-medium text-foreground/80">
          {(data.label as string)?.replace(/_/g, " ")}
        </p>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-border !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-border !w-2 !h-2" />
    </div>
  );
}

function LawNodeComponent({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card px-3 py-2 shadow-md transition-all",
        selected && "ring-1 ring-gold/50"
      )}
    >
      <div className="flex items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-gold/60" />
        <div>
          <p className="text-[11px] font-medium text-foreground/80">{data.label as string}</p>
          {typeof data.citation === "string" && (
            <p className="text-[9px] text-muted-foreground">{data.citation}</p>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-border !w-2 !h-2" />
    </div>
  );
}

export const ClientNode = memo(ClientNodeComponent);
export const ClauseNode = memo(ClauseNodeComponent);
export const LawNode = memo(LawNodeComponent);
