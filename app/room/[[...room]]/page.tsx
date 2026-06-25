"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import Editor from "@/components/codeEditor";
import ChatComponent from "@/components/chatComponent";
import Leaderboard from "@/components/leaderboard";

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
interface LeaderboardEntry {
  username: string;
  solved: number;
}

function DiffSpan({ expected, actual }: { expected: string; actual: string }) {
  const chars = actual.split("").map((ch, i) => (
    <span
      key={i}
      className={
        ch !== expected[i] ? "bg-rose-700 text-white" : "text-rose-300"
      }
    >
      {ch}
    </span>
  ));
  return (
    <span>
      {chars}
      {expected.slice(actual.length) && (
        <span className="bg-rose-900 text-rose-400 opacity-60">
          {expected.slice(actual.length)}
        </span>
      )}
    </span>
  );
}

const diffColor = (d?: string) =>
  d === "Easy"
    ? "text-emerald-400"
    : d === "Medium"
      ? "text-amber-400"
      : "text-rose-400";
const diffBg = (d?: string) =>
  d === "Easy"
    ? "bg-emerald-400/10 border-emerald-400/20"
    : d === "Medium"
      ? "bg-amber-400/10 border-amber-400/20"
      : "bg-rose-400/10 border-rose-400/20";

// ── Drag handles ────────────────────────────────────────────────────────────
function HDivider({ onDrag }: { onDrag: (dx: number) => void }) {
  const active = useRef(false);
  const last = useRef(0);
  const down = (e: React.MouseEvent) => {
    active.current = true;
    last.current = e.clientX;
    e.preventDefault();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!active.current) return;
      onDrag(e.clientX - last.current);
      last.current = e.clientX;
    };
    const up = () => {
      active.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [onDrag]);
  return (
    <div
      onMouseDown={down}
      className="group flex items-center justify-center w-3 shrink-0 cursor-col-resize z-10"
    >
      <div className="w-[2px] h-12 rounded-full bg-white/5 group-hover:bg-[#B7ADCF]/50 group-active:bg-[#B7ADCF] transition-all duration-150" />
    </div>
  );
}

function VDivider({ onDrag }: { onDrag: (dy: number) => void }) {
  const active = useRef(false);
  const last = useRef(0);
  const down = (e: React.MouseEvent) => {
    active.current = true;
    last.current = e.clientY;
    e.preventDefault();
  };
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!active.current) return;
      onDrag(e.clientY - last.current);
      last.current = e.clientY;
    };
    const up = () => {
      active.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [onDrag]);
  return (
    <div
      onMouseDown={down}
      className="group flex items-center justify-center h-3 shrink-0 cursor-row-resize z-10"
    >
      <div className="h-[2px] w-12 rounded-full bg-white/5 group-hover:bg-[#B7ADCF]/50 group-active:bg-[#B7ADCF] transition-all duration-150" />
    </div>
  );
}

// ── Card shell ───────────────────────────────────────────────────────────────
function Card({
  children,
  className = "",
  accent,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative bg-[#232325] rounded-2xl overflow-hidden flex flex-col border border-white/[0.05] ${className}`}
      style={style}
    >
      {accent && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${accent}`} />
      )}
      {children}
    </div>
  );
}

// ── Card header ──────────────────────────────────────────────────────────────
function CardHeader({
  label,
  right,
}: {
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5  border-white/[0.05] shrink-0">
      <span className="text-white/25 font-mono text-[10px] tracking-widest uppercase">
        {label}
      </span>
      {right}
    </div>
  );
}

export default function Roompage() {
  const params = useParams();
  const roomArr = params.room as string[];
  const sessionId = roomArr?.[0];
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const containerRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(40);
  const [problemPct, setProblemPct] = useState(62);

  const handleHDrag = useCallback((dx: number) => {
    const W = containerRef.current?.offsetWidth ?? window.innerWidth;
    setLeftPct((p) => Math.min(68, Math.max(22, p + (dx / W) * 100)));
  }, []);
  const handleVDrag = useCallback((dy: number) => {
    const H = leftColRef.current?.offsetHeight ?? window.innerHeight;
    setProblemPct((p) => Math.min(84, Math.max(16, p + (dy / H) * 100)));
  }, []);

  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [loadingQ, setLoadingQ] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [solvedQn, setSolvedQn] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<"chat" | "lb">("chat");
  const [resultsOpen, setResultsOpen] = useState(true);

  const [toasts, setToasts] = useState<
    { id: number; msg: string; kind: "win" | "solve" }[]
  >([]);
  const toastId = useRef(0);
  const announcedWinners = useRef<Set<string>>(new Set());

  const pushToast = (msg: string, kind: "win" | "solve" = "solve") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, msg, kind }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3200,
    );
  };

  useEffect(() => {
    const s = sessionStorage.getItem("username");
    if (s) setUsername(s);
  }, []);

  // leaderboard listener lives at top level — fires toasts even if tab=chat
  useEffect(() => {
    if (!socket) return;
    const handler = (data: LeaderboardEntry[]) => {
      if (!questions.length) return;
      data.forEach((e) => {
        if (
          e.solved >= questions.length &&
          !announcedWinners.current.has(e.username)
        ) {
          announcedWinners.current.add(e.username);
          pushToast(
            e.username === username
              ? "You finished all questions! 🏆"
              : `${e.username} finished all questions! 🏆`,
            "win",
          );
        }
      });
    };
    socket.on("leaderboard_update", handler);
    socket.emit("get_leaderboard", { sessionId });
    return () => {
      socket.off("leaderboard_update", handler);
    };
  }, [socket, sessionId, questions.length, username]);

  useEffect(() => {
    if (!runResult?.passed) return;
    socket.emit("question_solved", { sessionId, qIndex, username });
    setSolvedQn((prev) => {
      const n = new Set(prev);
      n.add(qIndex);
      return n;
    });
    socket.emit("send_message", {
      sessionId,
      username: "server",
      content: `${username} solved question ${qIndex + 1}`,
    });
    pushToast(`Question ${qIndex + 1} solved!`, "solve");
  }, [runResult]);

  useEffect(() => {
    if (!socket) return;
    const onQ = (q: SessionQuestion[]) => setQuestions(q);
    const onEnd = () => router.push("/dashboard");
    socket.on("questions_list", onQ);
    socket.on("session_ended", onEnd);
    socket.emit("join_room", { sessionId });
    socket.emit("get_questions", { sessionId });
    return () => {
      socket.off("questions_list", onQ);
      socket.off("session_ended", onEnd);
    };
  }, [isConnected, sessionId]);

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
      .then(setProblem)
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
      const data = await res.json();
      setRunResult(data);
      setResultsOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = () => socket.emit("end_session", { sessionId });
  const passCount = runResult?.results.filter((r) => r.passed).length ?? 0;

  return (
    <div
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-[#1a1a1b] text-white p-2 gap-0 select-none"
    >
      {/* ── Toast stack ── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border font-mono text-sm backdrop-blur-sm
            ${
              t.kind === "win"
                ? "bg-amber-400/10 border-amber-400/20 text-amber-300"
                : "bg-emerald-400/10 border-emerald-400/20 text-emerald-300"
            }`}
          >
            <span>{t.kind === "win" ? "🏆" : "✓"}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div
        ref={leftColRef}
        className="flex flex-col gap-0"
        style={{ width: `${leftPct}%`, minWidth: 0, height: "100%" }}
      >
        {/* Problem card */}
        <Card
          className="flex-none"
          accent="bg-gradient-to-r from-[#B7ADCF]/60 via-[#B7ADCF]/20 to-transparent"
          style={{ height: `${problemPct}%` } as React.CSSProperties}
        >
          <CardHeader
            label="Problem"
            right={
              <div className="flex items-center gap-2">
                {problem && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${diffBg(problem.difficulty)} ${diffColor(problem.difficulty)}`}
                  >
                    {problem.difficulty}
                  </span>
                )}
                {solvedQn.has(qIndex) && (
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full bg-emerald-400/10">
                    SOLVED
                  </span>
                )}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    disabled={qIndex === 0}
                    onClick={() => {
                      setQIndex((i) => i - 1);
                      setRunResult(null);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer font-mono text-xs"
                  >
                    ‹
                  </button>
                  <span className="text-white/20 font-mono text-[10px] px-1">
                    {questions.length === 0
                      ? "—"
                      : `${qIndex + 1}/${questions.length}`}
                  </span>
                  <button
                    disabled={qIndex >= questions.length - 1}
                    onClick={() => {
                      setQIndex((i) => i + 1);
                      setRunResult(null);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 disabled:opacity-20 transition-colors cursor-pointer font-mono text-xs"
                  >
                    ›
                  </button>
                </div>
              </div>
            }
          />
          <div className="flex-1 overflow-y-auto px-5 py-4 select-text">
            {loadingQ && (
              <div className="flex items-center gap-2 pt-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B7ADCF] animate-pulse" />
                <p className="text-white/25 font-mono text-xs">Loading…</p>
              </div>
            )}
            {!loadingQ && !problem && (
              <p className="text-white/15 font-mono text-xs pt-8 text-center">
                No questions in this session.
              </p>
            )}
            {!loadingQ && problem && (
              <>
                <h2 className="font-black text-white text-base leading-tight mb-4">
                  {problem.title}
                </h2>
                <div
                  className="text-xs text-white/55 leading-relaxed prose prose-invert max-w-none
                    [&_pre]:bg-[#1a1a1b] [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:my-2 [&_pre]:border [&_pre]:border-white/5
                    [&_code]:text-[#B7ADCF] [&_p]:text-white/55 [&_li]:text-white/55 [&_strong]:text-white/80"
                  dangerouslySetInnerHTML={{ __html: problem.content }}
                />
              </>
            )}
          </div>
        </Card>

        <VDivider onDrag={handleVDrag} />

        {/* Chat / Leaderboard card */}
        <Card
          className="min-h-0"
          style={
            {
              height: `calc(${100 - problemPct}% - 12px)`,
              flexShrink: 0,
            } as React.CSSProperties
          }
          accent={
            tab === "lb"
              ? "bg-gradient-to-r from-amber-400/40 via-amber-400/10 to-transparent"
              : undefined
          }
        >
          <CardHeader
            label={tab === "chat" ? "Chat" : "Leaderboard"}
            right={
              <div className="flex items-center gap-0.5 bg-[#1a1a1b] rounded-lg p-0.5 border border-white/5">
                {(["chat", "lb"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`font-mono text-[10px] px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      tab === t
                        ? "bg-[#B7ADCF]/20 text-[#B7ADCF]"
                        : "text-white/25 hover:text-white/50"
                    }`}
                  >
                    {t === "chat" ? "Chat" : "Board"}
                  </button>
                ))}
              </div>
            }
          />
          <div className="flex-1 overflow-hidden px-4 py-3 min-h-0">
            {tab === "chat" ? (
              <ChatComponent
                socket={socket}
                sessionId={sessionId}
                username={username}
              />
            ) : (
              <Leaderboard
                socket={socket}
                sessionId={sessionId}
                username={username}
                totalQuestions={questions.length}
              />
            )}
          </div>
        </Card>
      </div>

      <HDivider onDrag={handleHDrag} />

      {/* ══ RIGHT COLUMN ══ */}
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        {/* Editor card */}
        <Card
          accent="bg-gradient-to-r from-[#807898]/50 via-[#807898]/10 to-transparent"
          style={
            {
              height: runResult && resultsOpen ? "58%" : "100%",
              transition: "height 0.2s cubic-bezier(0.4,0,0.2,1)",
            } as React.CSSProperties
          }
        >
          <Editor
            sessionId={sessionId}
            questions={questions}
            currentSlug={currentSlug}
            problem={problem}
            submitting={submitting}
            onSubmit={handleSubmit}
            endSession={endSession}
          />
        </Card>

        {/* Results card */}
        {runResult && (
          <>
            <VDivider onDrag={() => {}} />
            <Card
              accent={
                runResult.passed
                  ? "bg-gradient-to-r from-emerald-400/50 via-emerald-400/10 to-transparent"
                  : "bg-gradient-to-r from-rose-400/50 via-rose-400/10 to-transparent"
              }
              style={
                {
                  height: resultsOpen ? "42%" : "42px",
                  transition: "height 0.2s cubic-bezier(0.4,0,0.2,1)",
                  flexShrink: 0,
                } as React.CSSProperties
              }
            >
              {/* Results header — clickable to collapse */}
              <div
                className="flex items-center gap-3 px-4 py-2.5 border border-white/[0.05] shrink-0 cursor-pointer"
                onClick={() => setResultsOpen((o) => !o)}
              >
                <span
                  className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full border ${
                    runResult.passed
                      ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                      : "bg-rose-400/10 border-rose-400/20 text-rose-400"
                  }`}
                >
                  {runResult.passed ? "✓ all passed" : "✗ some failed"}
                </span>
                <span className="text-white/20 font-mono text-xs">
                  {passCount} / {runResult.results.length} cases
                </span>
                <span className="ml-auto text-white/15 font-mono text-[10px]">
                  {resultsOpen ? "▾" : "▸"}
                </span>
              </div>

              {resultsOpen && (
                <div className="flex-1 overflow-y-auto px-4 py-3 select-text">
                  <div className="flex flex-col gap-2">
                    {runResult.results.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border text-xs font-mono overflow-hidden ${
                          r.passed
                            ? "border-emerald-800/40 bg-emerald-950/20"
                            : "border-rose-800/40 bg-rose-950/10"
                        }`}
                      >
                        <div
                          className={`px-3 py-1.5 flex items-center gap-2 ${r.passed ? "border-emerald-800/30" : "border-rose-800/30"}`}
                        >
                          <span
                            className={`w-4 h-4 flex items-center justify-center rounded-md text-[10px] ${r.passed ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}
                          >
                            {r.passed ? "✓" : "✗"}
                          </span>
                          <span className="text-white/25">Case {i + 1}</span>
                        </div>
                        <div className="px-3 py-2 flex flex-col gap-1">
                          <div>
                            <span className="text-white/20">in </span>
                            <span className="text-white/55">{r.input}</span>
                          </div>
                          {r.error ? (
                            <div>
                              <span className="text-white/20">err </span>
                              <span className="text-rose-400 whitespace-pre-wrap">
                                {r.error}
                              </span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="text-white/20">exp </span>
                                <span className="text-emerald-400">
                                  {r.expected}
                                </span>
                              </div>
                              <div>
                                <span className="text-white/20">got </span>
                                {r.passed ? (
                                  <span className="text-emerald-400">
                                    {r.actual}
                                  </span>
                                ) : (
                                  <DiffSpan
                                    expected={r.expected}
                                    actual={r.actual}
                                  />
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
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
