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
  return NextResponse.json({ assessment, clients });
}
