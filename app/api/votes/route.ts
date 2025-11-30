// app/api/votes/route.ts
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export async function GET() {
  try {
    // Get sessionId from cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return Response.json({ votes: [] });
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { alias: sessionId },
    });

    if (!user) {
      return Response.json({ votes: [] });
    }

    // Get all votes by this user
    const votes = await prisma.vote.findMany({
      where: { userId: user.id },
      select: {
        confessionId: true,
        value: true,
      },
    });

    return Response.json({
      votes: votes.map((v) => ({
        confessionId: v.confessionId,
        value: v.value,
      })),
    });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return Response.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

