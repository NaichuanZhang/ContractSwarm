"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, ScrollText, Scale, Landmark, AlertTriangle } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { CLAUSE_TYPE_LABELS } from "@/lib/constants";

interface ViolationData {
  readonly severity: string;
  readonly explanation: string;
  readonly originalLanguage: string | null;
  readonly legalRef: {
    readonly citation: string;
    readonly caseName: string;
  } | null;
}

interface GraphSidebarProps {
  readonly node: Node | null;
  readonly nodes: Node[];
  readonly edges: Edge[];
  readonly onClose: () => void;
}

export function GraphSidebar({ node, nodes, edges, onClose }: GraphSidebarProps) {
  const connectedClauses = useMemo(() => {
    if (!node || node.type !== "client") return [];
    return edges
      .filter((e) => e.source === node.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n != null && n.type === "clause");
  }, [node, nodes, edges]);
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 z-10 w-80 border-l border-border bg-card overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">Node Details</h3>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {node.type === "client" && (
              <>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">{node.data.label as string}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className="capitalize">{node.data.riskScore as string ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommendation</span>
                    <span className="capitalize">
                      {(node.data.recommendation as string)?.replace("_", " ") ?? "—"}
                    </span>
                  </div>
                </div>

                {connectedClauses.length > 0 && (
                  <div className="space-y-3 border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Contract Clauses & Violations
                    </p>
                    {connectedClauses.map((clause) => {
                      const clauseViolations = (clause.data.violations ?? []) as ViolationData[];
                      const clauseLabel =
                        CLAUSE_TYPE_LABELS[clause.data.clauseType as string ?? ""] ??
                        (clause.data.label as string)?.replace(/_/g, " ");
                      return (
                        <div key={clause.id} className="space-y-2">
                          <p className="text-xs font-medium text-foreground/80">
                            {clauseLabel}
                            {typeof clause.data.sectionRef === "string" && (
                              <span className="text-muted-foreground ml-1">
                                — {clause.data.sectionRef}
                              </span>
                            )}
                          </p>
                          {typeof clause.data.clauseText === "string" && (
                            <blockquote className="rounded-md bg-surface p-2.5 border-l-2 border-gold/30">
                              <p className="text-[10px] leading-relaxed text-muted-foreground italic line-clamp-4">
                                &ldquo;{clause.data.clauseText}&rdquo;
                              </p>
                            </blockquote>
                          )}
                          {clauseViolations.map((v, vi) => {
                            const sevColor =
                              v.severity === "critical"
                                ? "text-risk-high"
                                : v.severity === "major"
                                  ? "text-risk-medium"
                                  : "text-risk-low";
                            return (
                              <div
                                key={vi}
                                className="rounded-md bg-risk-high/5 border border-risk-high/10 p-2.5 space-y-1.5"
                              >
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className={`h-3 w-3 ${sevColor}`} />
                                  <span className={`text-[10px] font-semibold uppercase ${sevColor}`}>
                                    {v.severity}
                                  </span>
                                </div>
                                <p className="text-[10px] leading-relaxed text-foreground/80">
                                  {v.explanation}
                                </p>
                                {v.originalLanguage && (
                                  <p className="text-[10px] italic text-muted-foreground">
                                    &ldquo;{v.originalLanguage}&rdquo;
                                  </p>
                                )}
                                {v.legalRef && (
                                  <p className="text-[10px] text-gold italic">
                                    {v.legalRef.caseName}, {v.legalRef.citation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {node.type === "clause" && (
              <>
                <div className="flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {CLAUSE_TYPE_LABELS[node.data.clauseType as string ?? ""] ??
                      (node.data.label as string)?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Section</span>
                    <span>{node.data.sectionRef as string ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk</span>
                    <span className="capitalize">{node.data.riskLevel as string ?? "—"}</span>
                  </div>
                </div>
                {node.data.clauseText && (
                  <blockquote className="rounded-md bg-surface p-3 border-l-2 border-gold/30">
                    <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                      &ldquo;{node.data.clauseText as string}&rdquo;
                    </p>
                  </blockquote>
                )}
                {((node.data.violations ?? []) as ViolationData[]).length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Violations
                    </p>
                    {((node.data.violations ?? []) as ViolationData[]).map((v, vi) => {
                      const sevColor =
                        v.severity === "critical"
                          ? "text-risk-high"
                          : v.severity === "major"
                            ? "text-risk-medium"
                            : "text-risk-low";
                      return (
                        <div
                          key={vi}
                          className="rounded-md bg-risk-high/5 border border-risk-high/10 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className={`h-3 w-3 ${sevColor}`} />
                            <span className={`text-[10px] font-semibold uppercase ${sevColor}`}>
                              {v.severity}
                            </span>
                          </div>
                          <p className="text-[10px] leading-relaxed text-foreground/80">
                            {v.explanation}
                          </p>
                          {v.legalRef && (
                            <p className="text-[10px] text-gold italic">
                              {v.legalRef.caseName}, {v.legalRef.citation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {node.type === "category" && (
              <>
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">{node.data.label as string}</span>
                </div>
                <div className="rounded-md bg-gold/5 border border-gold/20 p-3">
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Legal category grouping citations under {node.data.label as string} regulatory framework.
                  </p>
                </div>
              </>
            )}

            {node.type === "law" && (
              <>
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-gold" />
                  <span className="text-sm font-medium">{node.data.label as string}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Citation</span>
                    <span>{node.data.citation as string ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Court</span>
                    <span>{node.data.courtName as string ?? "—"}</span>
                  </div>
                </div>
                {node.data.relevance && (
                  <div className="rounded-md bg-surface p-3">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {node.data.relevance as string}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
