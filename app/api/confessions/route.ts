// app/api/confessions/route.ts
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const category = searchParams.get("category") || undefined;

    const confessions = await prisma.confession.findMany({
      take: limit,
      where: {
        isDeleted: false,
        ...(category && category !== "all" && {
          Category: {
            name: category,
          },
        }),
      },
      include: {
        Category: true,
        User: true,
        ModerationQueue: {
          where: {
            reviewed: false,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter out pending confessions (only show approved)
    const approvedConfessions = confessions.filter(
      (c) => !c.ModerationQueue || c.ModerationQueue.reviewed
    );

    return Response.json({
      confessions: approvedConfessions.map((confession) => ({
        id: confession.id,
        content: confession.content,
        category: confession.Category?.name || null,
        sentiment: confession.sentiment,
        createdAt: confession.createdAt.toISOString(),
        anonId: confession.User?.alias || "unknown",
      })),
    });
  } catch (error) {
    console.error("Error fetching confessions:", error);
    return Response.json(
      { error: "Failed to fetch confessions" },
      { status: 500 }
    );
  }
}

