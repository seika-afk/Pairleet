"use client";
import { useEffect, useRef, useState } from "react";

interface LeaderboardEntry {
  username: string;
  solved: number;
}
interface LeaderboardProps {
  socket: any;
  sessionId: string;
  username: string;
  totalQuestions: number;
}
export default function Leaderboard({
  socket,
  sessionId,
  username,
  totalQuestions,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const announcedWinners = useRef<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const handleUpdate = (data: LeaderboardEntry[]) => {
      if (totalQuestions > 0) {
        data.forEach((entry) => {
          const hasFinished = entry.solved >= totalQuestions;
          if (hasFinished && !announcedWinners.current.has(entry.username)) {
            announcedWinners.current.add(entry.username);
            showToast(
              entry.username === username
                ? "You finished all questions! 🏆"
                : `${entry.username} finished all questions! 🏆`,
            );
          }
        });
      }
      setEntries(data);
    };
    socket.on("leaderboard_update", handleUpdate);
    socket.emit("get_leaderboard", { sessionId });
    return () => {
      socket.off("leaderboard_update", handleUpdate);
    };
  }, [socket, sessionId, totalQuestions, username]);

  return (
    <div className="relative">
      <h3 className="font-semibold mb-2 text-zinc-300">Leaderboard</h3>
      <div className="flex flex-col gap-1">
        {entries.length === 0 && (
          <p className="text-zinc-500">No participants yet.</p>
        )}
        {entries.map((entry, i) => {
          const isMe = entry.username === username;
          const isWinner = totalQuestions > 0 && entry.solved >= totalQuestions;
          return (
            <div
              key={entry.username}
              className={`flex items-center justify-between px-2 py-1 rounded ${
                isMe ? "" : ""
              } ${isWinner ? "bg-yellow-900/30 border border-yellow-600" : ""}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-zinc-500 w-4">{i + 1}</span>
                {isWinner && (
                  <span className="text-[10px] font-bold tracking-[0.2em] text-yellow-300">
                    WINNER
                  </span>
                )}
                <span className={isMe ? "text-blue-300" : "text-zinc-300"}>
                  {entry.username}
                </span>
              </span>
              <span className="text-zinc-400">
                {entry.solved}
                {totalQuestions > 0 ? ` / ${totalQuestions}` : ""} solved
              </span>
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
