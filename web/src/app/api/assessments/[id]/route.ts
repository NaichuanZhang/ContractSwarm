import { NextRequest, NextResponse } from "next/server";
import { getAssessment, getContractsForAssessment } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const assessment = getAssessment(id);

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  const contractList = getContractsForAssessment(id);

  return NextResponse.json({
    ...assessment,
    contracts: contractList.map((c) => ({
      id: c.id,
      clientName: c.clientName,
      fileName: c.fileName,
      status: c.status,
      riskScore: c.riskScore,
      recommendation: c.recommendation,
    })),
  });
}
