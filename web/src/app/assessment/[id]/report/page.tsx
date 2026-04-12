"use client";

import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { StatusBadge, RiskBadge, RecommendationBadge } from "@/components/status-badge";
import { useAssessment } from "@/hooks/use-assessment";
import { Download, AlertTriangle, CheckCircle, Scale } from "lucide-react";

interface LegalRef {
  id: string;
  citation: string;
  caseName: string;
  courtName: string | null;
}

interface Violation {
  id: string;
  severity: string;
  explanation: string;
  originalLanguage: string | null;
  proposedAmendment: string | null;
  legalJustification: string | null;
  legalRef: LegalRef | null;
}

interface Clause {
  id: string;
  clauseType: string;
  sectionRef: string | null;
  clauseText: string;
  riskLevel: string | null;
  violations: Violation[];
}

interface ClientReport {
  id: string;
  clientName: string;
  fileName: string;
  riskScore: string | null;
  recommendation: string | null;
  clauses: Clause[];
}

interface ReportData {
  assessment: Record<string, unknown>;
  clients: ClientReport[];
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, major: 1, minor: 2 };

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: assessment } = useAssessment(id);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/assessments/${id}/report`)
      .then((res) => res.json())
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Refetch when assessment completes
  useEffect(() => {
    if (assessment?.status === "completed") {
      fetch(`/api/assessments/${id}/report`)
        .then((res) => res.json())
        .then(setReport);
    }
  }, [assessment?.status, id]);

  const handleExport = () => {
    window.open(`/api/assessments/${id}/export`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full text-muted-foreground">
        Loading report...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Report</h1>
          <p className="text-sm text-muted-foreground">
            {assessment?.vendorName
              ? `Vendor: ${assessment.vendorName}`
              : "Per-client violation analysis and draft amendments"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
      </div>

      {/* Summary */}
      {assessment && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Eligible</p>
              <p className="text-2xl font-bold text-green-400">
                {assessment.eligibleCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                of {assessment.totalCount ?? 0} clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Need Amendment</p>
              <p className="text-2xl font-bold text-yellow-400">
                {report?.clients.filter((c) => c.recommendation === "needs_amendment")
                  .length ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Ineligible</p>
              <p className="text-2xl font-bold text-red-400">
                {report?.clients.filter((c) => c.recommendation === "ineligible")
                  .length ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-Client Reports */}
      {!report?.clients?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No report data yet. Wait for the swarm to complete analysis.
          </CardContent>
        </Card>
      ) : (
        <Accordion className="space-y-3">
          {report.clients.map((client) => {
            const totalViolations = client.clauses.reduce(
              (sum, c) => sum + c.violations.length,
              0
            );

            return (
              <AccordionItem
                key={client.id}
                value={client.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left flex-1">
                    <span className="font-medium text-sm">{client.clientName}</span>
                    <RiskBadge risk={client.riskScore} />
                    <RecommendationBadge recommendation={client.recommendation} />
                    {totalViolations > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {totalViolations} violation{totalViolations !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-2">
                    <p className="text-xs text-muted-foreground font-mono">
                      {client.fileName}
                    </p>

                    {client.clauses.length === 0 ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        No clauses flagged for this contract.
                      </p>
                    ) : (
                      client.clauses.map((clause) => (
                        <Card key={clause.id} className="bg-card/50">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-xs font-medium">
                                {clause.clauseType.replace(/_/g, " ").toUpperCase()}
                              </CardTitle>
                              {clause.sectionRef && (
                                <Badge variant="outline" className="text-[10px]">
                                  {clause.sectionRef}
                                </Badge>
                              )}
                              <RiskBadge risk={clause.riskLevel} />
                            </div>
                          </CardHeader>
                          <CardContent className="px-4 pb-3 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {clause.clauseText}
                            </p>

                            {clause.violations.map((v) => (
                              <div
                                key={v.id}
                                className="rounded-md border border-border p-3 space-y-2"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle
                                    className={`h-3.5 w-3.5 ${
                                      v.severity === "critical"
                                        ? "text-red-400"
                                        : v.severity === "major"
                                          ? "text-orange-400"
                                          : "text-yellow-400"
                                    }`}
                                  />
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      v.severity === "critical"
                                        ? "border-red-500/50 text-red-400"
                                        : v.severity === "major"
                                          ? "border-orange-500/50 text-orange-400"
                                          : "border-yellow-500/50 text-yellow-400"
                                    }`}
                                  >
                                    {v.severity}
                                  </Badge>
                                  {v.legalRef && (
                                    <span className="text-[10px] text-purple-400 flex items-center gap-1">
                                      <Scale className="h-3 w-3" />
                                      {v.legalRef.citation}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-foreground/80">
                                  {v.explanation}
                                </p>

                                {v.legalRef && (
                                  <div className="text-[10px] text-purple-300/70 bg-purple-500/5 rounded px-2 py-1">
                                    <span className="font-medium">
                                      {v.legalRef.caseName}
                                    </span>
                                    {v.legalRef.courtName && (
                                      <span> ({v.legalRef.courtName})</span>
                                    )}
                                  </div>
                                )}

                                {v.proposedAmendment && (
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-green-400">
                                      Proposed Amendment:
                                    </p>
                                    <div className="text-xs bg-green-500/5 border border-green-500/20 rounded p-2 text-green-300/90">
                                      {v.proposedAmendment}
                                    </div>
                                    {v.legalJustification && (
                                      <p className="text-[10px] text-muted-foreground italic">
                                        {v.legalJustification}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}

                            {clause.violations.length === 0 && (
                              <p className="text-xs text-green-400 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Compliant — no violations found
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
