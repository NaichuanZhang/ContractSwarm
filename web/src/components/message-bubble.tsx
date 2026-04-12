"use client";

import { motion } from "framer-motion";
import { Brain, Terminal, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  readonly message: {
    readonly id: string;
    readonly agent_name: string;
    readonly message_type: string;
    readonly content: string;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isContractAgent = message.agent_name === "ContractAgent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="px-3 py-1.5"
    >
      {/* Agent name label */}
      {message.message_type === "text" && (
        <p
          className={cn(
            "mb-1 text-[10px] font-medium uppercase tracking-wider",
            isContractAgent ? "text-gold/70" : "text-blue-400/70"
          )}
        >
          {message.agent_name}
        </p>
      )}

      {/* Message content by type */}
      {message.message_type === "text" && (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-[13px] leading-relaxed",
            isContractAgent
              ? "bg-secondary text-foreground/90"
              : "bg-secondary text-foreground/90"
          )}
        >
          {message.content}
        </div>
      )}

      {message.message_type === "thought" && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2 opacity-60">
          <Brain className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
          <p className="text-[12px] italic leading-relaxed text-muted-foreground">
            {message.content}
          </p>
        </div>
      )}

      {message.message_type === "tool_call" && (
        <div className="rounded-lg bg-muted border border-border/50 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Terminal className="h-3 w-3 text-gold/60" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-gold/60">
              Tool Call
            </span>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed text-foreground/70 whitespace-pre-wrap break-all">
            {message.content}
          </pre>
        </div>
      )}

      {message.message_type === "tool_result" && (
        <div className="rounded-lg border-l-2 border-gold/40 bg-muted px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowRight className="h-3 w-3 text-gold/40" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Result
            </span>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed text-foreground/60 whitespace-pre-wrap break-all">
            {message.content}
          </pre>
        </div>
      )}
    </motion.div>
  );
}
