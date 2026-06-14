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

export default function SearchBox() {
  const params = useParams();
  const sessionId = params.id as string;
  const { socket, isConnected } = useSocket();

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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setRes(data.questions ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (slug: string) => {
    socket.emit("add_question", { sessionId, question: { slug } });
    showToast(`Added "${slug}" to session`);
  };

  const handleRemove = (slug: string) => {
    socket.emit("remove_question", { sessionId, slug });
  };

  return (
    <div>
      <div className="border-2 flex flex-col border-black">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search Question"
        />
      </div>
      {loading && <p>Loading...</p>}
      <div className="border-2 flex flex-col">
        {res.map((q, index) => (
          <div
            key={index}
            className="cursor-pointer hover:border-2 border-red-300"
            onClick={() => handleClick(q.titleSlug)}
          >
            {q.title}
          </div>
        ))}
      </div>

      {/* Added questions */}
      <div className="border-2 flex flex-col">
        {questions.map((q, index) => (
          <div key={index} className="flex justify-between items-center">
            <span>{q.slug}</span>
            <button onClick={() => handleRemove(q.slug)}>✕</button>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
