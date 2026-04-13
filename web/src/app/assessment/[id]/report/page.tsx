"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, DollarSign, Download, FileCheck } from "lucide-react";
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
  contractValue: number | null;
  feeDescription: string | null;
  clauses: Clause[];
}

interface ReportData {
  assessment: Record<string, unknown>;
  clients: ClientReport[];
}

const formatUSD = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

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

  const totalContractValue = (report?.clients ?? []).reduce(
    (sum, c) => sum + (c.contractValue ?? 0),
    0
  );
  const valueAtRisk = (report?.clients ?? []).reduce((sum, c) => {
    if (c.contractValue == null) return sum;
    const hasViolations = c.clauses.some((cl) => cl.violations.length > 0);
    const isAtRisk =
      c.riskScore === "high" || c.riskScore === "medium" || hasViolations;
    return isAtRisk ? sum + c.contractValue : sum;
  }, 0);
  const hasContractValues = (report?.clients ?? []).some(
    (c) => c.contractValue != null && c.contractValue > 0
  );
  const contractsAtRisk = (report?.clients ?? []).filter(
    (c) => c.riskScore === "high" || c.riskScore === "medium"
  ).length;

  return (
    <div>
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-4xl font-semibold tracking-tight">
              Compliance Report
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Vendor assessment for{" "}
              <span className="text-foreground font-medium">
                {assessment?.vendorName ?? "—"}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Stats bar */}
        <div className="mt-8 flex items-center gap-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileCheck className="h-5 w-5 text-gold" />
            <div>
              <p className="text-4xl font-heading font-semibold">
                {eligibleCount}
                <span className="text-muted-foreground text-xl">
                  /{totalCount}
                </span>
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Clients Eligible
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-risk-high" />
            <div>
              <p className="text-4xl font-heading font-semibold text-risk-high">
                {contractsAtRisk}
                <span className="text-muted-foreground text-xl">
                  /{totalCount}
                </span>
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Contracts at Risk
              </p>
            </div>
          </div>
          {report?.clients && report.clients.length > 0 && (
            <>
              <div className="h-12 w-px bg-border" />
              <div className="flex flex-1 items-center gap-2">
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
                      className={`h-4 flex-1 rounded-full ${color}`}
                      title={`${client.clientName}: ${risk ?? "unknown"} risk`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-risk-high" /> High
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-risk-medium" /> Medium
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-risk-low" /> Low
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Contract Value at Risk */}
      {hasContractValues && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex items-center gap-8 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-gold" />
              <div>
                <p className="text-3xl font-heading font-semibold">
                  {formatUSD(totalContractValue)}
                </p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  Total Contract Value
                </p>
              </div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="text-3xl font-heading font-semibold text-risk-high">
                {formatUSD(valueAtRisk)}
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                Value at Risk
              </p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Risk-weighted exposure</span>
                <span className="ml-auto font-medium">
                  {totalContractValue > 0
                    ? Math.round((valueAtRisk / totalContractValue) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-risk-low via-risk-medium to-risk-high"
                  style={{
                    width: `${totalContractValue > 0 ? Math.round((valueAtRisk / totalContractValue) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Report accordion */}
      {!report?.clients?.length ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-card text-base text-muted-foreground shadow-sm">
          No report data yet. Wait for the swarm to complete analysis.
        </div>
      ) : (
        <div className="space-y-4">
          {report.clients.map((client) => {
            const allViolations = client.clauses.flatMap((clause) =>
              clause.violations.map((v) => ({
                ...v,
                clause: { sectionRef: clause.sectionRef },
              }))
            );

            const riskLevel = client.riskScore ?? "low";
            const borderColor =
              riskLevel === "high"
                ? "border-l-risk-high"
                : riskLevel === "medium"
                  ? "border-l-risk-medium"
                  : "border-l-risk-low";

            return (
              <Accordion key={client.id} defaultValue={[client.id]}>
                <AccordionItem
                  value={client.id}
                  className={`border border-border rounded-xl bg-card shadow-sm border-l-4 ${borderColor} overflow-hidden`}
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <span className="text-lg font-semibold">
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
                        <span className="text-sm text-muted-foreground">
                          {allViolations.length} violation
                          {allViolations.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <span className="ml-auto text-sm font-medium text-gold">
                        {client.contractValue != null && client.contractValue > 0
                          ? formatUSD(client.contractValue)
                          : "N/A"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="px-6 pb-5 space-y-4">
                      {client.feeDescription && (
                        <p className="text-sm italic text-muted-foreground">
                          {client.feeDescription}
                        </p>
                      )}
                      {allViolations.length === 0 ? (
                        <div className="rounded-lg bg-risk-low/8 border border-risk-low/20 p-4">
                          <p className="text-base text-risk-low font-medium">
                            No violations found. Contract terms are compatible with
                            vendor engagement.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Summary callout */}
                          <div className="rounded-lg bg-surface p-4 flex items-center gap-6">
                            <div className="text-sm text-muted-foreground">
                              <span className="text-2xl font-heading font-semibold text-foreground">
                                {allViolations.length}
                              </span>{" "}
                              violation{allViolations.length !== 1 ? "s" : ""} found
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="flex items-center gap-3 text-sm">
                              {["critical", "major", "minor"].map((sev) => {
                                const count = allViolations.filter(
                                  (v) => v.severity === sev
                                ).length;
                                if (count === 0) return null;
                                const sevColor =
                                  sev === "critical"
                                    ? "text-risk-high"
                                    : sev === "major"
                                      ? "text-risk-medium"
                                      : "text-risk-low";
                                return (
                                  <span key={sev} className={`${sevColor} font-medium`}>
                                    {count} {sev}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          {allViolations.map((violation) => (
                            <ViolationCard
                              key={violation.id}
                              violation={violation}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </div>
      )}
    </div>
  );
}
