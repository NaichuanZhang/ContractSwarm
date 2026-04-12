import { NextRequest, NextResponse } from "next/server";
import { getRoomsForAssessment } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rooms = getRoomsForAssessment(id);

  return NextResponse.json({
    rooms: rooms.map(({ room, contract }) => ({
      id: room.id,
      contractId: contract.id,
      clientName: contract.clientName,
      status: contract.status,
      riskScore: contract.riskScore,
      thenvoiChatId: room.thenvoiChatId,
    })),
  });
}
