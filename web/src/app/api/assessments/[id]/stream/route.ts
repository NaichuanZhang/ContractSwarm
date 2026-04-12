import { NextRequest } from "next/server";
import { getMessagesForAssessment, getAssessment } from "@/lib/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastSeen = "";
      let consecutiveEmpty = 0;

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Poll for new messages every 500ms
      const interval = setInterval(() => {
        try {
          const messages = getMessagesForAssessment(id, lastSeen || undefined);

          if (messages.length > 0) {
            consecutiveEmpty = 0;
            for (const msg of messages) {
              send("message", msg);
              if (msg.created_at > lastSeen) {
                lastSeen = msg.created_at;
              }
            }
          } else {
            consecutiveEmpty++;
          }

          // Check if assessment is done
          const assessment = getAssessment(id);
          if (assessment?.status === "completed" || assessment?.status === "failed") {
            send("status", { status: assessment.status });
            clearInterval(interval);
            controller.close();
          }

          // Timeout after 5 minutes of no messages
          if (consecutiveEmpty > 600) {
            send("status", { status: "timeout" });
            clearInterval(interval);
            controller.close();
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 500);

      // Send initial status
      const assessment = getAssessment(id);
      send("status", { status: assessment?.status ?? "unknown" });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
