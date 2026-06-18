"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Editor from "@/components/codeEditor";

interface SessionQuestion {
  slug: string;
}
interface ProblemData {
  title: string;
  difficulty: string;
  content: string;
  codeSnippets: { lang: string; langSlug: string; code: string }[];
}
interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error: string | null;
}
interface RunResponse {
  passed: boolean;
  results: TestResult[];
}

function DiffSpan({ expected, actual }: { expected: string; actual: string }) {
  const chars = actual.split("").map((ch, i) => (
    <span
      key={i}
      className={ch !== expected[i] ? "bg-red-700 text-white" : "text-red-300"}
    >
      {ch}
    </span>
  ));
  const missing = expected.slice(actual.length);
  return (
    <span>
      {chars}
      {missing && (
        <span className="bg-red-900 text-red-400 opacity-60">{missing}</span>
      )}
    </span>
  );
}

export default function Roompage() {
  const params = useParams();
  const roomArr = params.room as string[];
  const sessionId = roomArr?.[0];
  const { socket } = useSocket();

  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);

  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [username, setUsername] = useState("");
  const [solvedQn, setSolvedQn] = useState<Set<number>>(new Set());
  useEffect(() => {
    const stored = sessionStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  //if the user submits correctly
  useEffect(() => {
    if (runResult?.passed) {
      console.log("TEST PASSED");
      //TODO
      // ->Mark this Question as ANswered by client username
      socket.emit("question_solved", { sessionId, qIndex, username });
      setSolvedQn((prev) => {
        const next = new Set(prev);
        next.add(qIndex);
        return next;
      });

      // -> Send a notification at chat that user solved qn number---------------- TODO
      // -> update LEADERBOARD
      //
    }
  }, [runResult]);

  // Socket: join room + get questions
  useEffect(() => {
    const handleQuestions = (q: SessionQuestion[]) => setQuestions(q);
    socket.on("questions_list", handleQuestions);
    socket.emit("join_room", { sessionId });
    socket.emit("get_questions", { sessionId });
    return () => {
      socket.off("questions_list", handleQuestions);
    };
  }, [sessionId]);

  // Fetch problem when slug changes
  const currentSlug = questions[qIndex]?.slug ?? null;
  useEffect(() => {
    if (!currentSlug) {
      setProblem(null);
      return;
    }
    setLoadingQ(true);
    setRunResult(null);
    fetch(`/api/problem?slug=${encodeURIComponent(currentSlug)}`)
      .then((r) => r.json())
      .then((data: ProblemData) => setProblem(data))
      .catch(console.error)
      .finally(() => setLoadingQ(false));
  }, [currentSlug]);

  const handleSubmit = async (code: string, language: string) => {
    if (!currentSlug || !code.trim()) return;
    setSubmitting(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/run_code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, slug: currentSlug }),
      });
      setRunResult(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const diffColor = (d?: string) =>
    d === "Easy"
      ? "text-green-400"
      : d === "Medium"
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="flex h-screen overflow-hidden ">
      <div className="w-[40%] flex flex-col border-r border-zinc-800">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
          <button
            disabled={qIndex === 0}
            onClick={() => {
              setQIndex((i) => i - 1);
              setRunResult(null);
            }}
            className="px-2 py-0.5  disabled:opacity-30 "
          >
            Prev
          </button>
          <span className="flex-1 text-center">
            {questions.length === 0
              ? "No questions"
              : `${qIndex + 1} / ${questions.length}`}
          </span>
          <button
            disabled={qIndex >= questions.length - 1}
            onClick={() => {
              setQIndex((i) => i + 1);
              setRunResult(null);
            }}
            className="px-2 py-0.5 text-xs rounded disabled:opacity-30 hover:bg-zinc-600"
          >
            Next
          </button>
          {problem && (
            <span
              className={`text-xs font-semibold ml-2 ${diffColor(problem.difficulty)}`}
            >
              {problem.difficulty}
            </span>
          )}
        </div>

        {/* Question body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loadingQ && <p className="text-xs text-zinc-500">Loading…</p>}
          {!loadingQ && !problem && (
            <p className="text-xs text-zinc-500">
              No questions in this session yet.
            </p>
          )}
          {!loadingQ && problem && (
            <>
              <h2 className="font-semibold mb-3">{problem.title}</h2>
              <h2 className="text-3xl">{solvedQn.has(qIndex) && "SOLVED"}</h2>
              <div
                className="text-xs  prose prose-invert max-w-none
                  [&_pre]:bg-zinc-800 [&_pre]:rounded [&_pre]:p-2 [&_code]:text-green-300"
                dangerouslySetInnerHTML={{ __html: problem.content }}
              />
            </>
          )}
        </div>

        {/* Chat */}
        <div className="h-36 border-t border-zinc-800 px-3 py-2 text-xs text-zinc-600">
          CHAT / LEADERBOARD
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Editor
          questions={questions}
          currentSlug={currentSlug}
          problem={problem}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
        {runResult && (
          <div className="border-t border-zinc-800 bg-zinc-900 px-3 py-2 max-h-56 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  runResult.passed
                    ? "bg-green-900 text-green-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {runResult.passed ? "✓ All passed" : "✗ Some failed"}
              </span>
              <span className="text-xs text-zinc-500">
                {runResult.results.filter((r) => r.passed).length} /{" "}
                {runResult.results.length} passed
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {runResult.results.map((r, i) => (
                <div
                  key={i}
                  className={`rounded border text-xs font-mono ${
                    r.passed
                      ? "border-green-800 bg-green-950"
                      : "border-red-800 bg-red-950"
                  }`}
                >
                  <div
                    className={`px-2 py-1 flex gap-2 border-b ${
                      r.passed ? "border-green-800" : "border-red-800"
                    }`}
                  >
                    <span
                      className={r.passed ? "text-green-400" : "text-red-400"}
                    >
                      {r.passed ? "✓" : "✗"}
                    </span>
                    <span className="text-zinc-400">Case {i + 1}</span>
                  </div>
                  <div className="px-2 py-1.5 flex flex-col gap-0.5">
                    <div>
                      <span className="text-zinc-500">In: </span>
                      <span className="text-zinc-300">{r.input}</span>
                    </div>
                    {r.error ? (
                      <div>
                        <span className="text-zinc-500">Error: </span>
                        <span className="text-red-400 whitespace-pre-wrap">
                          {r.error}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-zinc-500">Expected: </span>
                          <span className="text-green-300">{r.expected}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Got: </span>
                          {r.passed ? (
                            <span className="text-green-300">{r.actual}</span>
                          ) : (
                            <DiffSpan expected={r.expected} actual={r.actual} />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
