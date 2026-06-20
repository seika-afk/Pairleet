import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import SessionArchive from "@/models/ServerArchive";
import User from "@/models/User";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ clerkId: userId }).lean();
  const participantFilters = [
    { "participants.userId": userId },
    ...(user?.username ? [{ "participants.username": user.username }] : []),
  ];

  const sessions = await SessionArchive.collection
    .find({ $or: participantFilters })
    .sort({ endedAt: -1, createdAt: -1 })
    .toArray();

  return Response.json({
    user: user
      ? {
          clerkId: user.clerkId,
          username: user.username,
          totalSessions: user.totalSessions ?? 0,
          totalWins: user.totalWins ?? 0,
        }
      : null,
    sessions: sessions.map((session) => ({
      id: String(session._id),
      sessionName: session.sessionName,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      totalQuestions: session.totalQuestions,
      winnerUsername: session.winnerUsername ?? null,
      participants: session.participants ?? [],
      questions: session.questions ?? [],
    })),
  });
}
