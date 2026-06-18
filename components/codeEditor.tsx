"use client";
import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { oneDark } from "@codemirror/theme-one-dark";

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
};

export default function Editor({
  currentSlug,
  problem,
  submitting,
  onSubmit,
}: EditorProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [theme, setTheme] = useState("dark");

  // When problem loads, prefill starter code
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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b ">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className=""
        >
          {LANG_OPTIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className=""
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <button
          onClick={() => onSubmit(code, language)}
          disabled={submitting || !currentSlug}
          className="ml-auto px-4 py-1  disabled:cursor-not-allowed"
        >
          {submitting ? "Running…" : "Submit"}
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          height="100%"
          theme={theme === "dark" ? oneDark : "light"}
          extensions={[getLangExtension(language)]}
          onChange={(val) => setCode(val)}
          style={{ height: "100%", fontSize: "13px" }}
        />
      </div>
    </div>
  );
}
