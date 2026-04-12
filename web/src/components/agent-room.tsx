"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RoomStatus } from "@/lib/types";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

interface AgentMessage {
  readonly id: string;
  readonly room_id: string;
  readonly agent_name: string;
  readonly message_type: string;
  readonly content: string;
}

interface AgentRoomProps {
  readonly clientName: string;
  readonly messages: readonly AgentMessage[];
  readonly status: RoomStatus;
  readonly isTyping: boolean;
}

export function AgentRoom({
  clientName,
  messages,
  status,
  isTyping,
}: AgentRoomProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, isTyping]);

  return (
    <div className="flex h-[400px] flex-col rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium truncate pr-2">{clientName}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <motion.span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "active" ? "bg-risk-medium" : "bg-risk-low"
            )}
            animate={
              status === "active"
                ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                : {}
            }
            transition={
              status === "active"
                ? { duration: 1.5, repeat: Infinity }
                : {}
            }
          />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {status === "active" ? "Analyzing" : "Complete"}
          </span>
        </div>
      </div>

      {/* Message feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 && !isTyping && (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-muted-foreground/50">
              Waiting for agents...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
    </div>
  );
}
