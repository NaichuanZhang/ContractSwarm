"use client";

import { use, useMemo } from "react";
import { useAssessment } from "@/hooks/use-assessment";
import { useEventSource } from "@/hooks/use-event-source";
import { AgentRoom } from "@/components/agent-room";
import type { RoomStatus } from "@/lib/types";

export default function SwarmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: assessment } = useAssessment(id);
  const { messages, status } = useEventSource(`/api/assessments/${id}/stream`);

  // Group messages by room
  const roomMessages = useMemo(() => {
    const grouped = new Map<string, typeof messages>();
    for (const msg of messages) {
      const existing = grouped.get(msg.room_id) ?? [];
      grouped.set(msg.room_id, [...existing, msg]);
    }
    return grouped;
  }, [messages]);

  // Map room_id to client name
  const contractsByRoom = useMemo(() => {
    if (!assessment?.contracts) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const msg of messages) {
      if (!map.has(msg.room_id) && msg.content.includes("Starting")) {
        const match = msg.content.match(/client:\s*(.+)/i);
        if (match) map.set(msg.room_id, match[1]);
      }
    }
    return map;
  }, [assessment, messages]);

  // Determine room status based on contract status
  const getRoomStatus = (roomId: string): RoomStatus => {
    if (status === "completed" || status === "failed") return "completed";
    const contract = assessment?.contracts?.find((c) =>
      (roomMessages.get(roomId) ?? []).some((m) => m.content.includes(c.clientName))
    );
    if (contract?.status === "completed") return "completed";
    return "active";
  };

  const isStreamActive = status === "running" || status === "connecting";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Agent Swarm
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "completed"
              ? "All contracts analyzed"
              : status === "failed"
                ? "Analysis failed"
                : assessment?.vendorName
                  ? `Agents analyzing contracts for ${assessment.vendorName}...`
                  : "Agents analyzing contracts in parallel..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from(roomMessages.entries()).map(([roomId, msgs]) => {
          const clientName =
            contractsByRoom.get(roomId) ?? `Room ${roomId.slice(0, 8)}`;
          const roomStatus = getRoomStatus(roomId);

          return (
            <AgentRoom
              key={roomId}
              clientName={clientName}
              messages={msgs}
              status={roomStatus}
              isTyping={isStreamActive && roomStatus === "active"}
            />
          );
        })}
      </div>

      {roomMessages.size === 0 && (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground/50">
            Waiting for agents to start...
          </p>
        </div>
      )}
    </div>
  );
}
