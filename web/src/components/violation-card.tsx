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

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={violation.severity as Severity} />
              {violation.clause.sectionRef && (
                <span className="text-[10px] text-muted-foreground">
                  {violation.clause.sectionRef}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {violation.explanation}
            </p>
          </div>
        </div>

        {(violation.originalLanguage || violation.proposedAmendment) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-180"
              )}
            />
            {expanded ? "Hide details" : "Show clause & amendment"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {violation.originalLanguage && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Original Clause
              </p>
              <div className="rounded-md bg-surface p-3">
                <p className="text-xs leading-relaxed text-foreground/70 italic">
                  &ldquo;{violation.originalLanguage}&rdquo;
                </p>
              </div>
            </div>
          )}

          {violation.proposedAmendment && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-risk-low mb-1">
                Proposed Amendment
              </p>
              <div className="rounded-md bg-risk-low/5 border border-risk-low/10 p-3">
                <p className="text-xs leading-relaxed text-foreground/80">
                  &ldquo;{violation.proposedAmendment}&rdquo;
                </p>
              </div>
            </div>
          )}

          {violation.legalRef && (
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground">Cited:</span>
              <span className="text-[11px] text-gold/80 italic">
                {violation.legalRef.caseName}, {violation.legalRef.citation}
              </span>
            </div>
          )}

          {violation.legalJustification && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {violation.legalJustification}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
