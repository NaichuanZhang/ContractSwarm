import { NextRequest, NextResponse } from "next/server";
import { getReportData, getAssessment } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = getAssessment(id);

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const clients = getReportData(id);
  const report = {
    generatedAt: new Date().toISOString(),
    assessment: {
      id: assessment.id,
      vendorName: assessment.vendorName,
      vendorDescription: assessment.vendorDescription,
      status: assessment.status,
      eligibleCount: assessment.eligibleCount,
      totalCount: assessment.totalCount,
    },
    clients: clients.map((client) => ({
      clientName: client.clientName,
      fileName: client.fileName,
      riskScore: client.riskScore,
      recommendation: client.recommendation,
      clauses: client.clauses.map((clause) => ({
        type: clause.clauseType,
        section: clause.sectionRef,
        text: clause.clauseText,
        riskLevel: clause.riskLevel,
        violations: clause.violations.map((v) => ({
          severity: v.severity,
          explanation: v.explanation,
          originalLanguage: v.originalLanguage,
          proposedAmendment: v.proposedAmendment,
          legalJustification: v.legalJustification,
          legalRef: v.legalRef
            ? {
                citation: v.legalRef.citation,
                caseName: v.legalRef.caseName,
                courtName: v.legalRef.courtName,
              }
            : null,
        })),
      })),
    })),
  };

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="contractswarm-report-${id}.json"`,
    },
  });
}
