import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import Sentiment from "sentiment";
import * as leoProfanity from "leo-profanity";
import { cookies } from "next/headers";
import { eventBroadcaster } from "@/lib/sse-events";
import { confessionRateLimiter } from "@/lib/rate-limiter";

const sentiment = new Sentiment();

// ✅ Initialize the filter dictionary once
leoProfanity.loadDictionary("en");

export async function POST(req: Request) {
  try {
    // Get or create sessionId from cookie (needed for rate limiting)
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      sessionId = nanoid(12);
      // Set cookie for future requests (expires in 1 year)
      cookieStore.set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    // Check rate limit BEFORE processing
    const rateLimitCheck = confessionRateLimiter.check(sessionId);

    if (!rateLimitCheck.allowed) {
      const resetDate = new Date(rateLimitCheck.resetTime);
      const minutesUntilReset = Math.ceil(
        (rateLimitCheck.resetTime - Date.now()) / (1000 * 60)
      );

      return Response.json(
        {
          error: "Rate limit exceeded",
          message: `You have reached the maximum number of confessions allowed. Please try again in ${minutesUntilReset} minute${
            minutesUntilReset !== 1 ? "s" : ""
          }.`,
          rateLimit: {
            limit: 5,
            remaining: 0,
            resetTime: resetDate.toISOString(),
            resetInMinutes: minutesUntilReset,
          },
        },
        {
          status: 429, // Too Many Requests
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitCheck.resetTime.toString(),
            "Retry-After": minutesUntilReset.toString(),
          },
        }
      );
    }

    // 1) Receive post content
    const { content, category } = await req.json();

    if (!content || content.trim().length < 5) {
      return Response.json(
        { error: "Post content too short" },
        { status: 400 }
      );
    }

    // 2) Run profanity filter
    const isProfane = leoProfanity.check(content);

    // 3) Run sentiment to attach sentiment score
    const sentimentResult = sentiment.analyze(content);
    const sentimentScore = Math.max(
      -1,
      Math.min(1, sentimentResult.score / 10)
    ); // normalize to -1 to +1

    // 4) Generate anonId
    const anonId = `anon_${nanoid(6)}`;

    // 5) Save post with moderationStatus: pending (or approved if auto-accept rules pass)
    const isApproved = !isProfane; // Auto-approve if no profanity

    // Find or create the category
    const categoryName = category || "OTHER";
    const categoryRecord = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    // Create or get the author
    const author = await prisma.user.upsert({
      where: { alias: anonId },
      update: {},
      create: {
        id: nanoid(),
        alias: anonId,
      },
    });

    const confession = await prisma.confession.create({
      data: {
        id: nanoid(),
        content: content, // Save original content, not cleaned
        categoryId: categoryRecord.id,
        sentiment: sentimentScore,
        authorId: author.id,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
      },
    });

    // Add to moderation queue if flagged
    if (isProfane) {
      await prisma.moderationQueue.create({
        data: {
          id: nanoid(),
          confessionId: confession.id,
          reason: "Profanity detected",
        },
      });
    }

    // 6) Emit realtime event (if approved) to clients listening in that topic
    if (isApproved) {
      // Use the categoryName we already have (Category relation may not be included in type)
      const broadcastCategory = categoryName;
      console.log(`[Confession] Broadcasting approved confession:`, {
        id: confession.id,
        category: broadcastCategory,
        clientCount: eventBroadcaster.getClientCount(),
      });

      eventBroadcaster.broadcast(
        "confession:new",
        {
          id: confession.id,
          content: confession.content,
          category: broadcastCategory,
          sentiment: confession.sentiment,
          createdAt: confession.createdAt.toISOString(),
          anonId,
        },
        broadcastCategory // Broadcast to category-specific listeners
      );
    } else {
      console.log(
        `[Confession] Not broadcasting - confession requires moderation`
      );
    }

    // Return response with rate limit info
    const response = Response.json(
      {
        message: "Post submitted successfully",
        confession: {
          ...confession,
          anonId,
        },
        sessionId,
        moderationStatus: isApproved ? "approved" : "pending",
        rateLimit: {
          remaining: rateLimitCheck.remaining,
          limit: 5,
          resetTime: new Date(rateLimitCheck.resetTime).toISOString(),
        },
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": rateLimitCheck.remaining.toString(),
          "X-RateLimit-Reset": rateLimitCheck.resetTime.toString(),
        },
      }
    );

    return response;
  } catch (error) {
    console.error("❌ Error posting confession:", error);

    // Provide more helpful error messages
    const isPrismaError =
      error instanceof Error &&
      (error.name === "PrismaClientInitializationError" ||
        (error as { code?: string }).code === "P1001");

    if (isPrismaError) {
      return Response.json(
        {
          error: "Database connection failed",
          message:
            "Cannot reach database server. Please check your DATABASE_URL in .env file and ensure your database is running.",
          details:
            process.env.NODE_ENV === "development" && error instanceof Error
              ? error.message
              : undefined,
        },
        { status: 503 }
      );
    }

    return Response.json(
      {
        error: "Failed to post confession",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
