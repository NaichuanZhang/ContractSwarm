"use client";

import { use, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, RiskBadge } from "@/components/status-badge";
import { useAssessment } from "@/hooks/use-assessment";
import { useEventSource } from "@/hooks/use-event-source";
import { Bot, MessageSquare, Wrench, Brain, AlertCircle } from "lucide-react";

const AGENT_COLORS: Record<string, string> = {
  ContractAgent: "text-blue-400",
  LawAgent: "text-purple-400",
  Orchestrator: "text-green-400",
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  text: MessageSquare,
  thought: Brain,
  tool_call: Wrench,
  tool_result: Wrench,
  error: AlertCircle,
};

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

  const contractsByRoom = useMemo(() => {
    if (!assessment?.contracts) return new Map<string, string>();
    // We'll map room_id to client name from messages
    const map = new Map<string, string>();
    for (const msg of messages) {
      if (!map.has(msg.room_id) && msg.content.includes("Starting")) {
        const match = msg.content.match(/client:\s*(.+)/i);
        if (match) map.set(msg.room_id, match[1]);
      }
    }
    return map;
  }, [assessment, messages]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">The Swarm</h1>
          <p className="text-sm text-muted-foreground">
            {assessment?.vendorName
              ? `Analyzing contracts for ${assessment.vendorName}`
              : "Watching agents analyze contracts in parallel"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              status === "running"
                ? "border-yellow-500/50 text-yellow-400 animate-pulse"
                : status === "completed"
                  ? "border-green-500/50 text-green-400"
                  : status === "failed"
                    ? "border-red-500/50 text-red-400"
                    : "border-muted-foreground/50"
            }
          >
            {status === "running"
              ? "Agents Working..."
              : status === "completed"
                ? "Analysis Complete"
                : status === "failed"
                  ? "Analysis Failed"
                  : "Connecting..."}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      {assessment?.contracts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Total Contracts</p>
              <p className="text-2xl font-bold">{assessment.totalCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Eligible</p>
              <p className="text-2xl font-bold text-green-400">
                {assessment.eligibleCount ?? "..."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Rooms Active</p>
              <p className="text-2xl font-bold">{roomMessages.size}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">Messages</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from(roomMessages.entries()).map(([roomId, msgs]) => {
          const clientName = contractsByRoom.get(roomId) ?? `Room ${roomId.slice(0, 8)}`;
          const lastMsg = msgs[msgs.length - 1];
          const hasError = msgs.some((m) => m.message_type === "error");
          const contract = assessment?.contracts?.find((c) =>
            msgs.some((m) => m.content.includes(c.clientName))
          );

          return (
            <Card
              key={roomId}
              className={
                hasError
                  ? "border-red-500/30"
                  : contract?.status === "completed"
                    ? "border-green-500/30"
                    : ""
              }
            >
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {clientName}
                  </CardTitle>
                  <div className="flex gap-1">
                    {contract && <StatusBadge status={contract.status} />}
                    {contract && <RiskBadge risk={contract.riskScore} />}
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <ScrollArea className="h-48 p-4">
                  <div className="space-y-2">
                    {msgs.map((msg) => {
                      const Icon = TYPE_ICONS[msg.message_type] ?? MessageSquare;
                      const colorClass =
                        AGENT_COLORS[msg.agent_name] ?? "text-muted-foreground";
                      return (
                        <div key={msg.id} className="flex gap-2 text-xs">
                          <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${colorClass}`} />
                          <div className="min-w-0">
                            <span className={`font-medium ${colorClass}`}>
                              {msg.agent_name}
                            </span>
                            <span className="text-muted-foreground"> &middot; </span>
                            <span className="text-muted-foreground">
                              {msg.message_type}
                            </span>
                            <p className="text-foreground/80 mt-0.5 break-words whitespace-pre-wrap">
                              {msg.content.length > 300
                                ? msg.content.slice(0, 300) + "..."
                                : msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}

        {roomMessages.size === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-3 opacity-50 animate-pulse" />
              <p>Waiting for agents to start...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
