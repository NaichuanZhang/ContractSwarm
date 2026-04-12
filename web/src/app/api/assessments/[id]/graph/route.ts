import { NextRequest, NextResponse } from "next/server";
import { getGraphData } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const graphData = getGraphData(id);
  return NextResponse.json(graphData);
}
