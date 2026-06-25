"use client";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const handler = (data: LeaderboardEntry[]) => setEntries(data);
    socket.on("leaderboard_update", handler);
    socket.emit("get_leaderboard", { sessionId });
    return () => {
      socket.off("leaderboard_update", handler);
    };
  }, [socket, sessionId]);

  return (
    <div className="flex flex-col gap-1.5 h-full overflow-y-auto">
      {entries.length === 0 && (
        <p className="text-white/15 font-mono text-xs text-center py-6">
          No participants yet.
        </p>
      )}
      {entries.map((entry, i) => {
        const isMe = entry.username === username;
        const isWinner = totalQuestions > 0 && entry.solved >= totalQuestions;
        const pct =
          totalQuestions > 0
            ? Math.round((entry.solved / totalQuestions) * 100)
            : 0;
        return (
          <div
            key={entry.username}
            className={`relative px-3 py-2.5 rounded-xl border overflow-hidden transition-colors ${
              isWinner
                ? "bg-amber-400/8 border-amber-400/20"
                : isMe
                  ? "bg-[#B7ADCF]/8 border-[#B7ADCF]/15"
                  : "bg-[#1a1a1b] border-white/5"
            }`}
          >
            {/* progress bar bg */}
            <div
              className={`absolute inset-0 opacity-10 transition-all duration-500 ${isWinner ? "bg-amber-400" : isMe ? "bg-[#B7ADCF]" : "bg-white"}`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center gap-2.5">
              <span className="text-white/20 font-mono text-[10px] w-4 shrink-0">
                {i + 1}
              </span>
              {isWinner && (
                <span className="text-[9px] font-mono tracking-widest text-amber-400 shrink-0">
                  WINNER
                </span>
              )}
              <span
                className={`font-mono text-sm truncate ${isMe ? "text-[#B7ADCF]" : "text-white/65"}`}
              >
                {entry.username}
              </span>
              <span className="ml-auto text-white/25 font-mono text-xs shrink-0">
                {entry.solved}
                {totalQuestions > 0 ? `/${totalQuestions}` : ""} solved
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
