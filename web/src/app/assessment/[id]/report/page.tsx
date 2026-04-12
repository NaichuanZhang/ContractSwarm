"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RiskBadge, RecommendationBadge } from "@/components/risk-badge";
import { ViolationCard } from "@/components/violation-card";
import { useAssessment } from "@/hooks/use-assessment";
import type { RiskLevel, Recommendation } from "@/lib/types";

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
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading report...
      </div>
    );
  }

  const eligibleCount = assessment?.eligibleCount ?? 0;
  const totalCount = assessment?.totalCount ?? 0;

  return (
    <div>
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Compliance Report
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vendor assessment for{" "}
              <span className="text-foreground">
                {assessment?.vendorName ?? "—"}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>

        {/* Stats bar */}
        <div className="mt-6 flex items-center gap-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-gold" />
            <div>
              <p className="text-2xl font-heading font-semibold">
                {eligibleCount}
                <span className="text-muted-foreground text-lg">
                  /{totalCount}
                </span>
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Clients Eligible
              </p>
            </div>
          </div>
          {report?.clients && report.clients.length > 0 && (
            <>
              <div className="h-10 w-px bg-border" />
              <div className="flex flex-1 items-center gap-1.5">
                {report.clients.map((client) => {
                  const risk = client.riskScore;
                  const color =
                    risk === "high"
                      ? "bg-risk-high"
                      : risk === "medium"
                        ? "bg-risk-medium"
                        : "bg-risk-low";
                  return (
                    <div
                      key={client.id}
                      className={`h-3 flex-1 rounded-full ${color}`}
                      title={`${client.clientName}: ${risk ?? "unknown"} risk`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-risk-high" /> High
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-risk-medium" /> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-risk-low" /> Low
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Report accordion */}
      {!report?.clients?.length ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
          No report data yet. Wait for the swarm to complete analysis.
        </div>
      ) : (
        <Accordion defaultValue={[report.clients[0]?.id ?? ""]}>
          {report.clients.map((client) => {
            const allViolations = client.clauses.flatMap((clause) =>
              clause.violations.map((v) => ({
                ...v,
                clause: { sectionRef: clause.sectionRef },
              }))
            );

            return (
              <AccordionItem
                key={client.id}
                value={client.id}
                className="border-border"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-sm font-medium">
                      {client.clientName}
                    </span>
                    {client.riskScore && (
                      <RiskBadge level={client.riskScore as RiskLevel} />
                    )}
                    {client.recommendation && (
                      <RecommendationBadge
                        recommendation={client.recommendation as Recommendation}
                      />
                    )}
                    {allViolations.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {allViolations.length} violation
                        {allViolations.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {allViolations.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">
                        No violations found. Contract terms are compatible with vendor
                        engagement.
                      </p>
                    )}
                    {allViolations.map((violation) => (
                      <ViolationCard key={violation.id} violation={violation} />
                    ))}
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
