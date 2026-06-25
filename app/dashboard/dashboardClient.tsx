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
  const [showSessionModal, setShowSessionModal] = useState(false);

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
    const handleJoinDenied = () => setJoinDenied(true);
    socket.on("join_denied", handleJoinDenied);
    return () => {
      socket.off("join_denied", handleJoinDenied);
    };
  }, [socket]);

  useEffect(() => {
    if (!showSessionModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSessionModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSessionModal]);

  const joinSession = () => {
    if (!socket || !sessionId || !username) return;
    sessionStorage.setItem("username", username);
    socket.emit("join_session", { sessionId, username, userId });
    router.push(`/session/${sessionId}`);
  };

  const totalSolvedAcrossSessions = sessions.reduce(
    (sum, s) => sum + s.questions.filter((q) => q.wasSolved).length,
    0,
  );

  if (joinDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 px-8 py-6 text-center">
          <div className="text-sm uppercase tracking-wider text-zinc-500">
            Pairleet
          </div>
          <div className="mt-2 text-lg font-semibold">
            Session has already started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-100 p-4 md:p-6 overflow-hidden">
      <div className="flex flex-1 min-h-0 gap-2">
        {/* LEFT: sidebar */}
        <div className="flex w-16 flex-shrink-0 flex-col items-center justify-between rounded-2xl border border-zinc-800 py-5 md:w-20">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 [writing-mode:vertical-rl]">
            Pairleet
          </div>
          <SignOutButton redirectUrl="/sign-in">
            <button
              aria-label="Sign out"
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-full cursor-pointer border border-zinc-600 bg-zinc-900 text-zinc-400 transition hover:border-violet-400 hover:text-violet-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </SignOutButton>
        </div>

        {/* MIDDLE: past sessions */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-zinc-600 p-4 md:p-6">
          <div className="flex items-baseline justify-between">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Past sessions
            </div>
            <div className="text-xs text-zinc-600">{sessions.length} total</div>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent">
            <div className="flex flex-col gap-3">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
                  No past sessions yet.
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-5 py-4"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-zinc-100">
                        {session.sessionName}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Started: {new Date(session.startedAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Ended: {new Date(session.endedAt).toLocaleString()}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="text-zinc-500">Winner: </span>
                        <span className="font-medium text-violet-300">
                          {session.winnerUsername ?? "unknown"}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-400">
                        Questions solved:{" "}
                        {session.questions.filter((q) => q.wasSolved).length} /{" "}
                        {session.totalQuestions}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Participants
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {session.participants.map((participant) => (
                          <div
                            key={participant.username}
                            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-violet-300">
                                #{participant.rank}
                              </span>
                              {participant.username}
                            </span>
                            <span className="text-zinc-500">
                              {participant.solved} solved
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-zinc-800 pt-3">
                      <div className="text-xs uppercase tracking-wide text-zinc-500">
                        Questions
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {session.questions.map((question, index) => (
                          <div
                            key={`${session.id}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
                          >
                            <span className="text-zinc-300">
                              {question.title}
                            </span>
                            <span
                              className={
                                question.wasSolved
                                  ? "text-violet-300"
                                  : "text-zinc-600"
                              }
                            >
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

        {/* RIGHT: stats + actions */}
        <div className="flex w-60 flex-shrink-0 flex-col gap-4 rounded-2xl border border-zinc-800 p-4 md:w-64 md:p-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="text-xs leading-snug text-zinc-500">Stats</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">
                {user?.totalSessions ?? sessions.length}
              </span>
              <span className="text-xs text-zinc-500">sessions</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-violet-300">
                {totalSolvedAcrossSessions}
              </span>
              <span className="text-xs text-zinc-500">qns solved</span>
            </div>
          </div>

          <button
            onClick={() => setShowSessionModal(true)}
            className="flex-1 cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition hover:border-violet-400/60 hover:bg-zinc-900"
          >
            <div className="text-xs leading-snug text-zinc-500">
              Click to create
              <br />a session
            </div>
            <div className="mt-3 text-sm font-semibold text-zinc-200">
              Create session
            </div>
          </button>

          <button
            onClick={() => setShowSessionModal(true)}
            className="flex-1 cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 text-left transition hover:border-violet-400/60 hover:bg-zinc-900"
          >
            <div className="text-xs leading-snug text-zinc-500">
              Click to join
              <br />
              an existing session
            </div>
            <div className="mt-3 text-sm font-semibold text-zinc-200">
              Join session
            </div>
          </button>
        </div>
      </div>

      {/* Modal */}
      {showSessionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowSessionModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500">
                  Pairleet
                </div>
                <h3 className="mt-1 text-xl font-bold text-white">Session</h3>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                aria-label="Close"
                className="rounded-full border border-zinc-700 px-2.5 py-1 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-5">
              <Lobby
                sessionId={sessionId}
                username={username}
                setSessionId={setSessionId}
                setUsername={setUsername}
                joinSession={joinSession}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
