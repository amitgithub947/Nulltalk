// app/api/admin/pending/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pendingConfessions = await prisma.moderationQueue.findMany({
      where: {
        reviewed: false,
        Confession: {
          isDeleted: false, // Exclude deleted confessions from pending queue
        },
      },
      include: {
        Confession: {
          include: {
            Category: true,
            User: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      pending: pendingConfessions.map((item) => ({
        id: item.id,
        confessionId: item.confessionId,
        reason: item.reason,
        createdAt: item.createdAt,
        confession: {
          id: item.Confession.id,
          content: item.Confession.content,
          category: item.Confession.Category?.name || null,
          sentiment: item.Confession.sentiment,
          createdAt: item.Confession.createdAt,
          author: item.Confession.User?.alias || null,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching pending confessions:", error);
    return Response.json(
      { error: "Failed to fetch pending confessions" },
      { status: 500 }
    );
  }
}

