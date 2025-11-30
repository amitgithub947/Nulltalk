// app/api/vote/route.ts
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { confessionId, value } = await req.json();

    if (!confessionId || value === undefined) {
      return Response.json(
        { error: "confessionId and value are required" },
        { status: 400 }
      );
    }

    if (value !== 1 && value !== -1) {
      return Response.json(
        { error: "value must be 1 (upvote) or -1 (downvote)" },
        { status: 400 }
      );
    }

    // Get or create sessionId from cookie
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      sessionId = nanoid(12);
      cookieStore.set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // Get or create user from session
    const user = await prisma.user.upsert({
      where: { alias: sessionId },
      update: {},
      create: { 
        id: nanoid(),
        alias: sessionId 
      },
    });

    // Check if user already voted on this confession
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_confessionId: {
          userId: user.id,
          confessionId: confessionId,
        },
      },
    });

    let vote;
    if (existingVote) {
      // Update existing vote if different
      if (existingVote.value !== value) {
        vote = await prisma.vote.update({
          where: { id: existingVote.id },
          data: { value },
        });

        // Update confession vote counts - remove old vote, add new vote
        const oldValue = existingVote.value;
        const newValue = value;
        
        await prisma.confession.update({
          where: { id: confessionId },
          data: {
            upvotes: {
              increment: (oldValue === 1 ? -1 : 0) + (newValue === 1 ? 1 : 0),
            },
            downvotes: {
              increment: (oldValue === -1 ? -1 : 0) + (newValue === -1 ? 1 : 0),
            },
          },
        });
      } else {
        // Same vote, no change
        vote = existingVote;
      }
    } else {
      // Create new vote
      vote = await prisma.vote.create({
        data: {
          id: nanoid(),
          userId: user.id,
          confessionId: confessionId,
          value,
        },
      });

      // Update confession vote counts
      await prisma.confession.update({
        where: { id: confessionId },
        data: {
          upvotes: {
            increment: value === 1 ? 1 : 0,
          },
          downvotes: {
            increment: value === -1 ? 1 : 0,
          },
        },
      });
    }

    return Response.json({
      message: "Vote recorded",
      vote: {
        id: vote.id,
        value: vote.value,
      },
    });
  } catch (error) {
    console.error("Error recording vote:", error);
    return Response.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}

