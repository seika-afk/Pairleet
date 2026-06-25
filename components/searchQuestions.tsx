"use client";
import { useSocket } from "@/hooks/useSocket";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Problem {
  title: string;
  titleSlug: string;
  difficulty: string;
  acRate: number;
}

interface SessionQuestion {
  slug: string;
}

const difficultyColor: Record<string, string> = {
  Easy: "text-emerald-400",
  Medium: "text-amber-400",
  Hard: "text-rose-400",
};

export default function SearchBox() {
  const params = useParams();
  const sessionId = params.id as string;
  const { socket } = useSocket();
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [res, setRes] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("get_questions", { sessionId });
    socket.on("questions_list", (q: SessionQuestion[]) => setQuestions(q));
    return () => {
      socket.off("questions_list");
    };
  }, [socket, sessionId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await r.json();
      setRes(data.questions ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (slug: string) => {
    socket.emit("add_question", { sessionId, question: { slug } });
    showToast(`Added "${slug}" to queue`);
    setQuery("");
    setRes([]);
  };

  const handleRemove = (slug: string) => {
    socket.emit("remove_question", { sessionId, slug });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search problems..."
          className="w-full bg-[#1a1a1b] text-white/80 placeholder-white/20 font-mono text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#B7ADCF]/50 transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#B7ADCF] animate-pulse" />
        )}
      </div>

      {/* Search results dropdown */}
      {res.length > 0 && (
        <div className="flex flex-col gap-1 bg-[#1a1a1b] rounded-xl border border-white/10 overflow-hidden max-h-48 overflow-y-auto">
          {res.map((q, i) => (
            <button
              key={i}
              onClick={() => handleClick(q.titleSlug)}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-left group cursor-pointer"
            >
              <span className="text-white/70 text-sm group-hover:text-white transition-colors truncate">
                {q.title}
              </span>
              <span
                className={`text-xs font-mono shrink-0 ml-3 ${
                  difficultyColor[q.difficulty] ?? "text-white/30"
                }`}
              >
                {q.difficulty}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Queue */}
      {questions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-white/20 font-mono text-xs tracking-widest uppercase mb-1">
            Queue ({questions.length})
          </p>
          {questions.map((q, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 bg-[#1a1a1b] rounded-lg border border-white/5 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-white/20 font-mono text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-white/70 text-sm font-mono">
                  {q.slug}
                </span>
              </div>
              <button
                onClick={() => handleRemove(q.slug)}
                className="text-white/20 hover:text-rose-400 transition-colors text-xs opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {questions.length === 0 && !loading && (
        <p className="text-white/20 text-xs font-mono text-center py-4">
          No problems queued yet
        </p>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#2e2e30] border border-white/10 text-white/80 text-sm font-mono px-4 py-2.5 rounded-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
