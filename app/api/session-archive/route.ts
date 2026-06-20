import { connectDB } from "@/lib/db";
import SessionArchive from "@/models/ServerArchive";
import User from "@/models/User";

type ArchiveParticipant = {
  userId?: string;
  username: string;
  rank: number;
  solved?: number;
  totalTime?: number;
};

type ArchiveQuestion = {
  title: string;
  wasSolved: boolean;
  fastestSolvedBy: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionName,
      startedAt,
      endedAt,
      totalQuestions,
      winnerUsername,
      questions,
      participants,
    } =
      body as {
        sessionName?: string;
        startedAt?: string;
        endedAt?: string;
        totalQuestions?: number;
        winnerUsername?: string | null;
        questions?: ArchiveQuestion[];
        participants?: ArchiveParticipant[];
      };

    if (!sessionName || !startedAt || !endedAt || typeof totalQuestions !== "number") {
      return Response.json(
        {
          error:
            "sessionName, startedAt, endedAt, and totalQuestions are required",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const normalizedParticipants = (participants ?? []).map((participant, index) => ({
      userId: participant.userId,
      username: participant.username,
      rank: participant.rank ?? index + 1,
      solved: participant.solved ?? 0,
      totalTime: participant.totalTime ?? 0,
    }));

    const archiveDocument = {
      sessionName,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      totalQuestions,
      winnerUsername: winnerUsername ?? undefined,
      questions: (questions ?? []).map((question) => ({
        title: question.title,
        wasSolved: question.wasSolved,
        fastestSolvedBy: question.fastestSolvedBy,
      })),
      participants: normalizedParticipants,
    };

    await SessionArchive.collection.updateOne(
      { sessionName },
      { $set: archiveDocument },
      { upsert: true },
    );

    await Promise.all(
      normalizedParticipants
        .filter((participant) => participant.userId)
        .map((participant) =>
          User.findOneAndUpdate(
            { clerkId: participant.userId },
            {
              $setOnInsert: {
                clerkId: participant.userId,
                username: participant.username,
              },
              $set: {
                username: participant.username,
              },
              $inc: {
                totalSessions: 1,
                totalWins: participant.rank === 1 ? 1 : 0,
              },
            },
            { upsert: true, new: true, runValidators: true },
          ),
        ),
    );

    return Response.json({ ok: true, archive: archiveDocument });
  } catch (error) {
    console.error("[session-archive]", error);
    return Response.json(
      { error: "Failed to save session archive" },
      { status: 500 },
    );
  }
}
