// app/api/events/route.ts
import { eventBroadcaster } from "@/lib/sse-events";
import { nanoid } from "nanoid";

export async function GET(req: Request) {
  // Get optional category filter from query params
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  // Create a unique client ID
  const clientId = nanoid(12);

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add client to broadcaster
      eventBroadcaster.addClient(clientId, controller, category);
      console.log(
        `[SSE] Client connected: ${clientId}, category filter: ${
          category || "all"
        }, total clients: ${eventBroadcaster.getClientCount()}`
      );

      // Send initial connection message
      const initMessage = `event: connected\ndata: ${JSON.stringify({
        clientId,
        category: category || "all",
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initMessage));

      // Send periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `: heartbeat\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch {
          clearInterval(heartbeatInterval);
          eventBroadcaster.removeClient(clientId);
        }
      }, 30000); // Every 30 seconds

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        eventBroadcaster.removeClient(clientId);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
