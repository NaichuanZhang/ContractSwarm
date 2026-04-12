import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments, contracts } from "@/lib/schema";
import { listAssessments } from "@/lib/queries";

export async function GET() {
  const rows = listAssessments();
  return NextResponse.json({ assessments: rows });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { vendorName, vendorDescription, contractFiles } = body as {
    vendorName: string;
    vendorDescription: string;
    contractFiles: Array<{
      fileName: string;
      filePath: string;
      clientName: string;
    }>;
  };

  if (!vendorName || !vendorDescription || !contractFiles?.length) {
    return NextResponse.json(
      { error: "vendorName, vendorDescription, and contractFiles are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const assessmentId = crypto.randomUUID();

  db.insert(assessments).values({
    id: assessmentId,
    vendorName,
    vendorDescription,
    status: "pending",
    totalCount: contractFiles.length,
    createdAt: now,
  }).run();

  for (const file of contractFiles) {
    db.insert(contracts).values({
      id: crypto.randomUUID(),
      assessmentId,
      clientName: file.clientName,
      fileName: file.fileName,
      filePath: file.filePath,
      status: "pending",
      createdAt: now,
    }).run();
  }

  // Trigger the Python orchestrator
  const agentBackendUrl = process.env.AGENT_BACKEND_URL || "http://localhost:8000";
  try {
    await fetch(`${agentBackendUrl}/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
  } catch (error) {
    // Don't fail the assessment creation if the backend is not running
    console.error("Failed to trigger orchestrator:", error);
  }

  return NextResponse.json({ id: assessmentId, status: "pending" }, { status: 201 });
}
