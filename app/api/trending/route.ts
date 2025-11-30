// app/api/trending/route.ts
import { prisma } from "@/lib/prisma";

// Trending algorithm: Reddit/HN inspired ranking
function trendingScore(
  upvotes: number,
  downvotes: number,
  createdAt: Date
): number {
  const score = upvotes - downvotes; // raw score
  const ageHours =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const gravity = 1.8; // tune
  return score / Math.pow(ageHours + 2, gravity);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category") || undefined;

    // Fetch confessions
    const confessions = await prisma.confession.findMany({
      take: limit * 2, // Get more to sort, then limit
      where: {
        isDeleted: false,
        ...(category &&
          category !== "all" && {
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
    });

    // Filter out pending confessions (only show approved)
    const approvedConfessions = confessions.filter(
      (c) => !c.ModerationQueue || c.ModerationQueue.reviewed
    );

    // Calculate trending scores and sort
    const confessionsWithScores = approvedConfessions.map((confession) => ({
      confession: {
        id: confession.id,
        content: confession.content,
        category: confession.Category?.name || null,
        sentiment: confession.sentiment,
        createdAt: confession.createdAt.toISOString(),
        upvotes: confession.upvotes,
        downvotes: confession.downvotes,
        anonId: confession.User?.alias || "unknown",
      },
      trendingScore: trendingScore(
        confession.upvotes,
        confession.downvotes,
        confession.createdAt
      ),
    }));

    // Sort by trending score (highest first) and limit
    const trending = confessionsWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map((item) => ({
        ...item.confession,
        trendingScore: item.trendingScore,
      }));

    return Response.json({
      confessions: trending,
    });
  } catch (error) {
    console.error("Error fetching trending confessions:", error);
    return Response.json(
      { error: "Failed to fetch trending confessions" },
      { status: 500 }
    );
  }
}
