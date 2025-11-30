// app/api/admin/approve/route.ts
import { prisma } from "@/lib/prisma";
import { eventBroadcaster } from "@/lib/sse-events";

export async function POST(req: Request) {
  try {
    const { confessionId } = await req.json();

    if (!confessionId) {
      return Response.json(
        { error: "confessionId is required" },
        { status: 400 }
      );
    }

    // Get the confession with relations
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      include: {
        Category: true,
        ModerationQueue: true,
        User: true,
      },
    });

    if (!confession) {
      return Response.json(
        { error: "Confession not found" },
        { status: 404 }
      );
    }

    // Remove from moderation queue
    if (confession.ModerationQueue) {
      await prisma.moderationQueue.update({
        where: { confessionId },
        data: { reviewed: true },
      });
    }

    // Broadcast the approved confession
    const broadcastCategory = confession.Category?.name || null;
    eventBroadcaster.broadcast(
      "confession:new",
      {
        id: confession.id,
        content: confession.content,
        category: broadcastCategory,
        sentiment: confession.sentiment,
        createdAt: confession.createdAt.toISOString(),
        anonId: confession.User?.alias || "unknown",
      },
      broadcastCategory || undefined
    );

    return Response.json({
      message: "Confession approved and broadcasted",
      confession: {
        id: confession.id,
        content: confession.content,
        category: broadcastCategory,
      },
    });
  } catch (error) {
    console.error("Error approving confession:", error);
    return Response.json(
      { error: "Failed to approve confession" },
      { status: 500 }
    );
  }
}

