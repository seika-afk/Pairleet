import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clerkId, username } = body as {
      clerkId?: string;
      username?: string;
    };

    if (!clerkId || !username) {
      return Response.json(
        { error: "clerkId and username are required." },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({ clerkId });
    if (existing) {
      return Response.json({ ok: true, created: false });
    }

    await User.create({
      clerkId,
      username,
      totalSessions: 0,
      totalWins: 0,
    });

    return Response.json({ ok: true, created: true }, { status: 201 });
  } catch (err) {
    console.error("[/api/users/register]", err);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
