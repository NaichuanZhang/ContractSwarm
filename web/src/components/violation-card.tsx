"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SeverityBadge } from "./risk-badge";
import type { Severity } from "@/lib/types";

interface LegalRef {
  readonly id: string;
  readonly citation: string;
  readonly caseName: string;
  readonly courtName: string | null;
}

interface ViolationCardProps {
  readonly violation: {
    readonly id: string;
    readonly severity: string;
    readonly explanation: string;
    readonly originalLanguage: string | null;
    readonly proposedAmendment: string | null;
    readonly legalJustification: string | null;
    readonly legalRef: LegalRef | null;
    readonly clause: {
      readonly sectionRef: string | null;
    };
  };
}

export function ViolationCard({ violation }: ViolationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityBorder =
    violation.severity === "critical"
      ? "border-l-risk-high"
      : violation.severity === "major"
        ? "border-l-risk-medium"
        : "border-l-risk-low";

  const isCritical = violation.severity === "critical";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm overflow-hidden border-l-4",
        severityBorder,
        isCritical && "bg-risk-high/5 border-risk-high/30"
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2.5">
              <SeverityBadge severity={violation.severity as Severity} />
              {violation.clause.sectionRef && (
                <span className="text-xs text-muted-foreground">
                  {violation.clause.sectionRef}
                </span>
              )}
            </div>
            <p className="text-base leading-relaxed text-foreground/90">
              {violation.explanation}
            </p>
          </div>
        </div>

        {(violation.originalLanguage || violation.proposedAmendment) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-180"
              )}
            />
            {expanded ? "Hide details" : "Show clause & amendment"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {violation.originalLanguage && (
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                Original Clause
              </p>
              <div className="rounded-md bg-surface p-4">
                <p className="text-sm leading-relaxed text-foreground/70 italic">
                  &ldquo;{violation.originalLanguage}&rdquo;
                </p>
              </div>
            </div>
          )}

          {violation.proposedAmendment && (
            <div>
              <p className="text-xs uppercase tracking-wider text-risk-low mb-2 font-medium">
                Proposed Amendment
              </p>
              <div className="rounded-md bg-risk-low/8 border-l-4 border-l-risk-low border border-risk-low/15 p-4">
                <p className="text-sm leading-relaxed text-foreground/85">
                  &ldquo;{violation.proposedAmendment}&rdquo;
                </p>
              </div>
            </div>
          )}

          {violation.legalRef && (
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-xs text-muted-foreground font-medium">Cited:</span>
              <span className="text-sm text-gold italic">
                {violation.legalRef.caseName}, {violation.legalRef.citation}
              </span>
            </div>
          )}

          {violation.legalJustification && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {violation.legalJustification}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
