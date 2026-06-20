"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Lobby from "@/components/serverComponent";
import { SignOutButton } from "@clerk/nextjs";

type SessionSummary = {
  id: string;
  sessionName: string;
  startedAt: string;
  endedAt: string;
  totalQuestions: number;
  winnerUsername: string | null;
  participants: {
    userId?: string | null;
    username: string;
    rank: number;
    solved: number;
    totalTime: number;
  }[];
  questions: {
    title: string;
    wasSolved: boolean;
    fastestSolvedBy: string;
  }[];
};

type UserSummary = {
  clerkId: string;
  username: string;
  totalSessions: number;
  totalWins: number;
} | null;

type DashboardClientProps = {
  userId: string;
};

export default function DashboardClient({ userId }: DashboardClientProps) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [sessionId, setSessionId] = useState("");
  const [username, setUsername] = useState("");
  const [joinDenied, setJoinDenied] = useState(false);
  const [user, setUser] = useState<UserSummary>(null);

  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    if (!userId) return;

    fetch("/api/user-sessions")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user ?? null);
        setSessions(data.sessions ?? []);
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleJoinDenied = () => {
      setJoinDenied(true);
    };

    socket.on("join_denied", handleJoinDenied);

    return () => {
      socket.off("join_denied", handleJoinDenied);
    };
  }, [socket]);
  const joinSession = () => {
    if (!socket || !sessionId || !username) {
      console.log("❌ blocked — missing:", {
        socket: !!socket,
        sessionId,
        username,
      });
      return;
    }

    sessionStorage.setItem("username", username);
    socket.emit("join_session", { sessionId, username, userId });
    router.push(`/session/${sessionId}`);
  };
  if (joinDenied) {
    return <div>Session has already started</div>;
  }
  return (
    <div className="p-4">
      <Lobby
        sessionId={sessionId}
        username={username}
        setSessionId={setSessionId}
        setUsername={setUsername}
        joinSession={joinSession}
        isConnected={isConnected}
      />
      <div className="mt-6 max-w-3xl border border-zinc-700 p-4 text-sm text-zinc-300">
        <div>
          <div className="text-zinc-500">Past sessions</div>
          <div className="mt-3 flex flex-col gap-3">
            {sessions.length === 0 ? (
              <div className="text-zinc-600">No past sessions yet.</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-zinc-700 px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-zinc-100">
                      {session.sessionName}
                    </div>
                    <div className="text-zinc-500">
                      Started: {new Date(session.startedAt).toLocaleString()}
                    </div>
                    <div className="text-zinc-500">
                      Ended: {new Date(session.endedAt).toLocaleString()}
                    </div>
                    <div className="text-zinc-400">
                      Winner: {session.winnerUsername ?? "unknown"}
                    </div>
                    <div className="text-zinc-400">
                      Questions solved:{" "}
                      {
                        session.questions.filter(
                          (question) => question.wasSolved,
                        ).length
                      }{" "}
                      / {session.totalQuestions}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <div className="text-zinc-500">Participants</div>
                    <div className="mt-2 flex flex-col gap-1">
                      {session.participants.map((participant) => (
                        <div
                          key={participant.username}
                          className="flex items-center justify-between border border-zinc-800 px-3 py-2"
                        >
                          <span>
                            #{participant.rank} {participant.username}
                          </span>
                          <span className="text-zinc-500">
                            {participant.solved} solved
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <div className="text-zinc-500">Questions</div>
                    <div className="mt-2 flex flex-col gap-1">
                      {session.questions.map((question, index) => (
                        <div
                          key={`${session.id}-${index}`}
                          className="flex items-center justify-between border border-zinc-800 px-3 py-2"
                        >
                          <span>{question.title}</span>
                          <span className="text-zinc-500">
                            {question.wasSolved
                              ? `Solved by ${question.fastestSolvedBy}`
                              : "Unsolved"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <SignOutButton redirectUrl="/sign-in">
        <button>Log out</button>
      </SignOutButton>
    </div>
  );
}
