// app/api/admin/confessions/route.ts
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [confessions, total] = await Promise.all([
      prisma.confession.findMany({
        where: {
          isDeleted: false, // Exclude deleted confessions
        },
        skip,
        take: limit,
        include: {
          Category: true,
          User: true,
          ModerationQueue: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.confession.count({
        where: {
          isDeleted: false, // Count only non-deleted confessions
        },
      }),
    ]);

    return Response.json({
      confessions: confessions.map((confession) => ({
        id: confession.id,
        content: confession.content,
        category: confession.Category?.name || null,
        sentiment: confession.sentiment,
        createdAt: confession.createdAt,
        updatedAt: confession.updatedAt,
        upvotes: confession.upvotes,
        downvotes: confession.downvotes,
        isDeleted: confession.isDeleted,
        author: confession.User?.alias || null,
        isPending: confession.ModerationQueue ? !confession.ModerationQueue.reviewed : false,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching confessions:", error);
    return Response.json(
      { error: "Failed to fetch confessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { confessionId } = await req.json();

    if (!confessionId) {
      return Response.json(
        { error: "confessionId is required" },
        { status: 400 }
      );
    }

    // Soft delete by setting isDeleted flag
    const confession = await prisma.confession.update({
      where: { id: confessionId },
      data: { isDeleted: true },
    });

    // Also remove from moderation queue if present
    await prisma.moderationQueue.deleteMany({
      where: { confessionId },
    });

    return Response.json({
      message: "Confession deleted successfully",
      confession: {
        id: confession.id,
      },
    });
  } catch (error) {
    console.error("Error deleting confession:", error);
    return Response.json(
      { error: "Failed to delete confession" },
      { status: 500 }
    );
  }
}

