"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface AgentMessage {
  id: string;
  room_id: string;
  agent_name: string;
  message_type: string;
  content: string;
  metadata: string | null;
  created_at: string;
}

export function useEventSource(url: string | null) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [status, setStatus] = useState<string>("connecting");
  const sourceRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!url) return;

    const es = new EventSource(url);
    sourceRef.current = es;

    es.addEventListener("message", (event) => {
      try {
        const msg: AgentMessage = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener("status", (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatus(data.status);
        if (data.status === "completed" || data.status === "failed") {
          es.close();
        }
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      setStatus("error");
      es.close();
    };

    return () => {
      es.close();
    };
  }, [url]);

  return { messages, status, close };
}
