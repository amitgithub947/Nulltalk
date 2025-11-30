// app/api/admin/verify-key/route.ts
import { ADMIN_KEY } from "@/lib/admin-key";

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== "string" || key.length !== 32) {
      return Response.json(
        { error: "Invalid key format" },
        { status: 400 }
      );
    }

    // Compare with the admin key
    if (key === ADMIN_KEY) {
      return Response.json({ valid: true });
    } else {
      return Response.json(
        { error: "Invalid access key" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error verifying key:", error);
    return Response.json(
      { error: "Failed to verify key" },
      { status: 500 }
    );
  }
}

