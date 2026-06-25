"use client";
import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { oneDark } from "@codemirror/theme-one-dark";
import { useSocket } from "@/hooks/useSocket";

interface SessionQuestion {
  slug: string;
}
interface ProblemData {
  title: string;
  difficulty: string;
  content: string;
  codeSnippets: { lang: string; langSlug: string; code: string }[];
}

const LANG_OPTIONS = [
  { label: "Python", value: "python", snippetSlug: "python3" },
  { label: "JavaScript", value: "javascript", snippetSlug: "javascript" },
  { label: "C", value: "c", snippetSlug: "c" },
  { label: "C++", value: "cpp", snippetSlug: "cpp" },
  { label: "Go", value: "go", snippetSlug: "golang" },
  { label: "Rust", value: "rust", snippetSlug: "rust" },
];

function getLangExtension(lang: string) {
  switch (lang) {
    case "javascript":
      return javascript();
    case "cpp":
    case "c":
      return cpp();
    case "rust":
      return rust();
    case "go":
      return go();
    default:
      return python();
  }
}

type EditorProps = {
  questions: SessionQuestion[];
  currentSlug: string | null;
  problem: ProblemData | null;
  submitting: boolean;
  onSubmit: (code: string, language: string) => void;
  endSession: () => void;
  sessionId: string;
};

export default function Editor({
  currentSlug,
  problem,
  submitting,
  onSubmit,
  endSession,
  sessionId,
}: EditorProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isOwner, setIsOwner] = useState(false);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!problem) {
      setCode("");
      return;
    }
    const slugKey = LANG_OPTIONS.find((l) => l.value === language)?.snippetSlug;
    const snippet = problem.codeSnippets?.find((s) => s.langSlug === slugKey);
    setCode(snippet?.code ?? "");
  }, [problem]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (!problem) return;
    const slugKey = LANG_OPTIONS.find((l) => l.value === lang)?.snippetSlug;
    const snippet = problem.codeSnippets?.find((s) => s.langSlug === slugKey);
    if (snippet) setCode(snippet.code);
  };

  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;
    const stored = sessionStorage.getItem("username") ?? "";
    const handle = (u: string) => setIsOwner(u === stored);
    socket.on("owner_name", handle);
    socket.emit("get_owner", { sessionId });
    return () => {
      socket.off("owner_name", handle);
    };
  }, [socket, isConnected, sessionId]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0">
        {/* Lang pills */}
        <div className="flex items-center gap-0.5 bg-[#1a1a1b] rounded-lg p-0.5">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLanguageChange(l.value)}
              className={`font-mono text-[10px] px-2 py-1 rounded-md transition-all cursor-pointer ${
                language === l.value
                  ? "bg-[#B7ADCF]/20 text-[#B7ADCF]"
                  : "text-white/25 hover:text-white/50"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {isOwner && (
            <button
              onClick={endSession}
              className="font-mono text-[10px] px-3 py-1.5 rounded-lg text-rose-400/70 hover:text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
            >
              End session
            </button>
          )}
          <button
            onClick={() => onSubmit(code, language)}
            disabled={submitting || !currentSlug}
            className="bg-[#B7ADCF] text-[#2e2640] font-bold text-xs px-5 py-1.5 rounded-lg hover:bg-white transition-colors duration-150 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#2e2640]/50 animate-pulse" />
                Running…
              </>
            ) : (
              <>Submit →</>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          height="100%"
          theme={oneDark}
          extensions={[getLangExtension(language)]}
          onChange={(val) => setCode(val)}
          style={{ height: "100%", fontSize: "13px" }}
        />
      </div>
    </div>
  );
}
