// lib/sse-events.ts

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  category?: string; // Optional: filter by category/topic
};

class EventBroadcaster {
  private clients: Map<string, SSEClient> = new Map();

  // Add a new SSE client connection
  addClient(clientId: string, controller: ReadableStreamDefaultController, category?: string) {
    this.clients.set(clientId, {
      id: clientId,
      controller,
      category,
    });
    console.log(`[SSE] Added client ${clientId}, total: ${this.clients.size}`);
  }

  // Remove a client connection
  removeClient(clientId: string) {
    const removed = this.clients.delete(clientId);
    if (removed) {
      console.log(`[SSE] Removed client ${clientId}, total: ${this.clients.size}`);
    }
  }

  // Broadcast event to all clients (or filtered by category)
  broadcast(event: string, data: any, category?: string) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    console.log(`[SSE] Broadcasting ${event} to ${this.clients.size} clients`, {
      category,
      clientCount: this.clients.size,
      clientIds: Array.from(this.clients.keys()),
    });
    
    let sentCount = 0;
    this.clients.forEach((client) => {
      // Send to client if:
      // 1. No category filter in broadcast (send to all)
      // 2. Client has no category filter (listening to all)
      // 3. Client's category matches the broadcast category
      const shouldSend = !category || !client.category || client.category === category;
      
      if (shouldSend) {
        try {
          client.controller.enqueue(new TextEncoder().encode(message));
          sentCount++;
          console.log(`[SSE] ✓ Sent to client ${client.id} (category: ${client.category || 'all'})`);
        } catch (error) {
          // Client disconnected, remove it
          console.error(`[SSE] ✗ Error sending to client ${client.id}:`, error);
          this.removeClient(client.id);
        }
      } else {
        console.log(`[SSE] ⊘ Skipped client ${client.id} (filter: ${client.category}, broadcast: ${category})`);
      }
    });
    
    console.log(`[SSE] Summary: Sent ${event} to ${sentCount} of ${this.clients.size} clients`);
  }

  // Get count of connected clients
  getClientCount(): number {
    return this.clients.size;
  }
}

// Use globalThis to ensure singleton across Next.js route handlers (similar to Prisma pattern)
const globalForEventBroadcaster = globalThis as unknown as {
  eventBroadcaster: EventBroadcaster;
};

export const eventBroadcaster =
  globalForEventBroadcaster.eventBroadcaster ||
  new EventBroadcaster();

if (process.env.NODE_ENV !== "production") {
  globalForEventBroadcaster.eventBroadcaster = eventBroadcaster;
}

