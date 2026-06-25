import { LeetCode } from "leetcode-query";

const lc = new LeetCode();
const COMPILER_MAP: Record<string, string> = {
  python: "python-3.14",
  javascript: "typescript-deno",
  cpp: "g++-15",
  c: "gcc-15",
  go: "go-1.26",
  rust: "rust-1.93",
};

const normalize = (s: string) =>
  s
    .trim()
    .replace(/[\r\n\t]/g, "")
    .replace(/\s/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .toLowerCase();

// ── Python ──────────────────────────────────────────────────────────────────
function parsePythonSignature(code: string): { method: string } | null {
  // Isolate the Solution class block only (from "class Solution" to next top-level "class" or EOF)
  const classMatch = code.match(/class\s+Solution\b[\s\S]*?(?=\nclass\s|\Z)/);
  const scope = classMatch ? classMatch[0] : code;

  // Find all method defs inside, skip dunder methods like __init__
  const methodMatches = [...scope.matchAll(/def\s+(\w+)\s*\(self([^)]*)\)/g)];
  const realMethod = methodMatches.find((m) => !m[1].startsWith("__"));
  if (!realMethod) return null;
  return { method: realMethod[1] };
}

function buildPythonScript(userCode: string, inputLines: string[]): string {
  const sig = parsePythonSignature(userCode);
  if (!sig) return userCode;

  const usesListNode = /ListNode/.test(userCode);
  const usesTreeNode = /TreeNode/.test(userCode);
  const usesOptional = /Optional/.test(userCode);
  const usesList = /\bList\[/.test(userCode);

  const helpers: string[] = [];

  if (usesListNode) {
    helpers.push(`
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def _to_linked_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    cur = head
    for v in arr[1:]:
        cur.next = ListNode(v)
        cur = cur.next
    return head

def _from_linked_list(node):
    out = []
    while node:
        out.append(node.val)
        node = node.next
    return out
`);
  }

  if (usesTreeNode) {
    helpers.push(`
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def _to_tree(arr):
    if not arr: return None
    nodes = [TreeNode(v) if v is not None else None for v in arr]
    kids = nodes[::-1]
    root = kids.pop()
    for node in nodes:
        if node:
            if kids: node.left = kids.pop()
            if kids: node.right = kids.pop()
    return root

def _from_tree(root):
    if not root: return []
    out, queue = [], [root]
    while queue:
        node = queue.pop(0)
        if node:
            out.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            out.append(None)
    while out and out[-1] is None:
        out.pop()
    return out
`);
  }

  const importLine = `import ast, json${usesOptional || usesList ? ", typing" : ""}\n${usesOptional ? "from typing import Optional, List\n" : usesList ? "from typing import List\n" : ""}`;

  const argsRaw = `_raw_args = [ast.literal_eval(x) for x in ${JSON.stringify(inputLines)}]`;

  let argConversion = "_args = _raw_args";
  if (usesListNode) {
    argConversion = `_args = [_to_linked_list(a) if isinstance(a, list) else a for a in _raw_args]`;
  } else if (usesTreeNode) {
    argConversion = `_args = [_to_tree(a) if isinstance(a, list) else a for a in _raw_args]`;
  }

  let outputConversion = "json.dumps(_result)";
  if (usesListNode) {
    outputConversion = "json.dumps(_from_linked_list(_result))";
  } else if (usesTreeNode) {
    outputConversion = "json.dumps(_from_tree(_result))";
  }

  return `${importLine}${helpers.join("\n")}
${userCode}

${argsRaw}
${argConversion}
_result = Solution().${sig.method}(*_args)
print(${outputConversion})
`;
}

// ── JavaScript ───────────────────────────────────────────────────────────────
function parseJSSignature(
  code: string,
): { method: string; isClassMethod: boolean } | null {
  if (/class\s+Solution\b/.test(code)) {
    const classBodyMatch = code.match(
      /class\s+Solution\b[^{]*\{([\s\S]*)\}\s*$/,
    );
    const body = classBodyMatch ? classBodyMatch[1] : code;

    const methodMatches = [
      ...body.matchAll(/^[ \t]*(\w+)\s*\(([^)]*)\)\s*\{/gm),
    ];
    const real = methodMatches.find((m) => m[1] !== "constructor");
    if (real) return { method: real[1], isClassMethod: true };
  }

  // var name = function(...)
  let match = code.match(/var\s+(\w+)\s*=\s*function/);
  if (match) return { method: match[1], isClassMethod: false };
  // function name(...)
  match = code.match(/function\s+(\w+)\s*\(/);
  if (match) return { method: match[1], isClassMethod: false };
  // const/let name = (...) =>  (arrow function)
  match = code.match(/(?:const|let)\s+(\w+)\s*=\s*(?:function|\()/);
  if (match) return { method: match[1], isClassMethod: false };
  return null;
}

function buildJSScript(userCode: string, inputLines: string[]): string {
  const sig = parseJSSignature(userCode);
  const argList = inputLines
    .map((l) => `JSON.parse(${JSON.stringify(l.trim())})`)
    .join(", ");

  if (sig?.isClassMethod) {
    return `${userCode}\n\nconst _result = new Solution().${sig.method}(${argList});\nconsole.log(JSON.stringify(_result));\n`;
  }

  if (sig) {
    return `${userCode}\n\nconst _result = ${sig.method}(${argList});\nconsole.log(JSON.stringify(_result));\n`;
  }

  return `${userCode}\n\nconst _sol = new Solution();\nconst _method = Object.getOwnPropertyNames(Solution.prototype).find(m => m !== 'constructor');\nconst _result = _sol[_method](${argList});\nconsole.log(JSON.stringify(_result));\n`;
}

// ── C ────────────────────────────────────────────────────────────────────────

function parseCSignature(
  code: string,
): { method: string; params: { type: string; name: string }[] } | null {
  const match = code.match(/\w[\w\* ]*\s+(\w+)\s*\(([^)]*)\)\s*\{/);
  if (!match) return null;
  const method = match[1];
  const paramStr = match[2];
  const params = paramStr
    .split(",")
    .map((p) => {
      p = p.trim();
      const parts = p.split(/\s+/);
      const name = parts[parts.length - 1].replace(/\*/, "");
      const type = parts.slice(0, -1).join(" ").trim();
      return { type, name };
    })
    .filter((p) => p.name && p.type);
  return { method, params };
}

function buildCScript(userCode: string, inputLines: string[]): string {
  const sig = parseCSignature(userCode);
  if (!sig) return userCode;

  const realParams = sig.params.filter((p) => !/size|len|count/i.test(p.name));

  const argList = realParams
    .map((p, i) => {
      const line = (inputLines[i] ?? "").trim();
      if (p.type.includes("*")) return line; // arrays not fully supported in simple mode
      return line;
    })
    .join(", ");

  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${userCode}

int main() {
    int result = ${sig.method}(${argList});
    printf("%d\\n", result);
    return 0;
}
`;
}

// ── C++ ──────────────────────────────────────────────────────────────────────
// Parses method name + param types from the class definition
function parseCppSignature(
  code: string,
): { method: string; params: { type: string; name: string }[] } | null {
  // e.g. vector<int> twoSum(vector<int>& nums, int target)
  const match = code.match(/\w[\w<>, *]*\s+(\w+)\s*\(([^)]*)\)\s*\{/);
  if (!match) return null;
  const method = match[1];
  if (method === "Solution") return null; // skip constructor
  const paramStr = match[2];
  const params = paramStr
    .split(",")
    .map((p) => {
      p = p.trim();
      const parts = p.split(/\s+/);
      const name = parts[parts.length - 1].replace(/[&*]/, "");
      const type = parts.slice(0, -1).join(" ").replace(/[&*]/g, "").trim();
      return { type, name };
    })
    .filter((p) => p.name && p.type);
  return { method, params };
}

function cppArgFromLine(type: string, line: string): string {
  const t = type.toLowerCase();
  if (t.includes("vector") && t.includes("vector")) {
    // vector<vector<int>>
    return `parseVecVec(${JSON.stringify(line)})`;
  } else if (t.includes("vector")) {
    return `parseVec(${JSON.stringify(line)})`;
  } else if (t === "string") {
    return JSON.stringify(line.replace(/^"|"$/g, ""));
  } else {
    return line.trim(); // int, long, double etc
  }
}

function buildCppScript(userCode: string, inputLines: string[]): string {
  const sig = parseCppSignature(userCode);
  if (!sig) return userCode;

  const argList = sig.params
    .map((p, i) => cppArgFromLine(p.type, inputLines[i] ?? ""))
    .join(", ");

  return `#include <bits/stdc++.h>
using namespace std;

template<typename T>
ostream& operator<<(ostream& os, const vector<T>& v) {
    os << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i) os << ",";
        os << v[i];
    }
    os << "]";
    return os;
}

${userCode}

vector<int> parseVec(const string& s) {
    vector<int> v; string t = s;
    t.erase(remove(t.begin(),t.end(),'['),t.end());
    t.erase(remove(t.begin(),t.end(),']'),t.end());
    stringstream ss(t); string tok;
    while(getline(ss,tok,',')) if(!tok.empty()) v.push_back(stoi(tok));
    return v;
}
vector<vector<int>> parseVecVec(const string& s) {
    vector<vector<int>> res;
    // minimal parser for [[1,2],[3,4]]
    string inner = s.substr(1, s.size()-2);
    int depth=0; string cur;
    for(char c : inner) {
        if(c=='[') { depth++; cur+=c; }
        else if(c==']') { depth--; cur+=c; if(depth==0){ res.push_back(parseVec(cur)); cur=""; } }
        else if(c==',' && depth==0) {}
        else cur+=c;
    }
    return res;
}

int main() {
    Solution sol;
    auto result = sol.${sig.method}(${argList});
    cout << result << endl;
    return 0;
}
`;
}

// ── Go ───────────────────────────────────────────────────────────────────────
function parseGoSignature(
  code: string,
): { method: string; params: string[] } | null {
  const match = code.match(/func\s+(\w+)\s*\(([^)]*)\)/);
  if (!match) return null;
  const method = match[1];
  const params = match[2]
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return { method, params };
}

function goArgFromLine(param: string, line: string): string {
  if (param.includes("[]int")) return `parseIntSlice(${JSON.stringify(line)})`;
  if (param.includes("string"))
    return JSON.stringify(line.replace(/^"|"$/g, ""));
  return line.trim(); // int, float64 etc
}

function buildGoScript(userCode: string, inputLines: string[]): string {
  const sig = parseGoSignature(userCode);
  if (!sig) return userCode;

  const argList = sig.params
    .map((p, i) => goArgFromLine(p, inputLines[i] ?? ""))
    .join(", ");

  return `package main

import (
    "fmt"
    "strconv"
    "strings"
)

${userCode}

func parseIntSlice(s string) []int {
    s = strings.Trim(s, "[]")
    parts := strings.Split(s, ",")
    var result []int
    for _, p := range parts {
        p = strings.TrimSpace(p)
        if p == "" { continue }
        n, _ := strconv.Atoi(p)
        result = append(result, n)
    }
    return result
}

func formatResult(v interface{}) string {
    switch val := v.(type) {
    case []int:
        parts := make([]string, len(val))
        for i, n := range val {
            parts[i] = strconv.Itoa(n)
        }
        return "[" + strings.Join(parts, ",") + "]"
    default:
        return fmt.Sprintf("%v", val)
    }
}

func main() {
    result := ${sig.method}(${argList})
    fmt.Println(formatResult(result))
}
`;
}

// ── Rust ─────────────────────────────────────────────────────────────────────
function buildRustScript(userCode: string, inputLines: string[]): string {
  const match = userCode.match(/pub fn\s+(\w+)\s*\(\s*&self\s*,?([^)]*)\)/);
  const isStaticFn = !match && userCode.match(/pub fn\s+(\w+)\s*\(([^)]*)\)/);

  if (!match && !isStaticFn) return userCode;

  const method = match ? match[1] : (isStaticFn as RegExpMatchArray)[1];
  const paramStr = match ? match[2] : (isStaticFn as RegExpMatchArray)[2];
  const params = paramStr
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const argList = params
    .map((p, i) => {
      const line = (inputLines[i] ?? "").trim();
      if (p.includes("Vec<i32>")) {
        const nums = line
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean)
          .join(", ");
        return `vec![${nums}]`;
      }
      if (p.includes("i32") || p.includes("i64")) return line;
      if (p.includes("String")) {
        const unquoted = line.replace(/^"|"$/g, "");
        return `String::from(${JSON.stringify(unquoted)})`;
      }
      return line;
    })
    .join(", ");

  const callExpr = match
    ? `Solution{}.${method}(${argList})` // instance method needs &self -> Solution{}.method(...)
    : `Solution::${method}(${argList})`; // static fn

  // LeetCode Rust starter never declares `struct Solution;` itself — add it
  const needsStruct = !/struct\s+Solution\b/.test(userCode);
  const structDecl = needsStruct ? "struct Solution;\n\n" : "";

  return `${structDecl}${userCode}

fn main() {
    let result = ${callExpr};
    println!("{:?}", result);
}
`;
}

function extractValueTokens(input: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "[" || ch === "(") depth++;
    if (ch === "]" || ch === ")") depth--;
    if (ch === "," && depth === 0) {
      tokens.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) tokens.push(cur.trim());
  return tokens.map((t) => {
    const eq = t.indexOf("=");
    return (eq >= 0 ? t.slice(eq + 1) : t).trim();
  });
}

function comparableInputKey(tokens: string[]): string {
  return normalize(tokens.join(","));
}

export async function POST(req: Request) {
  const { code, language, slug } = await req.json();

  if (!code || !language || !slug) {
    return Response.json(
      { error: "code, language, and slug are required" },
      { status: 400 },
    );
  }

  let problem;
  try {
    problem = await lc.problem(slug);
  } catch {
    return Response.json({ error: "Failed to fetch problem" }, { status: 500 });
  }

  const raw = problem.exampleTestcases ?? "";

  function decodeHtmlEntities(s: string): string {
    return s
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\r/g, "")
      .trim();
  }

  function stripExampleLabel(line: string): string {
    return line.replace(/^(input|output)\s*:\s*/i, "").trim();
  }

  function splitExampleCases(rawCases: string, caseCount: number): string[][] {
    const cleaned = decodeHtmlEntities(rawCases).replace(/\r/g, "").trim();
    if (!cleaned) return [];

    const blankLineBlocks = cleaned
      .split(/\n\s*\n+/)
      .map((block) =>
        block
          .split("\n")
          .map((line) => stripExampleLabel(line))
          .filter(Boolean),
      )
      .filter((block) => block.length > 0);

    if (blankLineBlocks.length > 1) {
      if (caseCount <= 0 || blankLineBlocks.length === caseCount) {
        return blankLineBlocks;
      }
    }

    const lines = cleaned
      .split("\n")
      .map((line) => stripExampleLabel(line))
      .filter(Boolean);
    if (lines.length === 0) return [];
    if (caseCount > 0 && lines.length === caseCount) {
      return lines.map((line) => [line]);
    }
    if (caseCount <= 1 || lines.length <= 1) {
      return [lines];
    }

    const chunkSize = Math.ceil(lines.length / caseCount);
    const cases: string[][] = [];
    for (let i = 0; i < lines.length; i += chunkSize) {
      cases.push(lines.slice(i, i + chunkSize));
    }
    return cases;
  }

  const plainContent = decodeHtmlEntities(
    (problem.content ?? "").replace(/<[^>]+>/g, "\n"),
  );

  const expectedOutputs = [
    ...plainContent.matchAll(/Output:\s*([^\n]+)/gi),
  ].map((m) => m[1].trim());

  const exampleInputsRaw = [
    ...plainContent.matchAll(/Input:\s*([^\n]+)/gi),
  ].map((m) => m[1].trim());

  const numCases = expectedOutputs.length || 1;
  const casesLines = splitExampleCases(raw, numCases);

  if (casesLines.length === 0) {
    return Response.json(
      { error: "No test cases found for this problem" },
      { status: 400 },
    );
  }

  if (expectedOutputs.length !== casesLines.length) {
    console.warn(
      `[run_code] Mismatch for slug "${slug}": ${expectedOutputs.length} Output label(s) parsed ` +
        `from description but ${casesLines.length} input case(s) derived from exampleTestcases. ` +
        `expectedOutputs=${JSON.stringify(expectedOutputs)}`,
    );
  }

  const descriptionInputKeys = exampleInputsRaw.map((rawInput) =>
    comparableInputKey(extractValueTokens(rawInput)),
  );

  const usedDescriptionIndices = new Set<number>();
  const matchedExpectedOutputs: (string | undefined)[] = casesLines.map(
    (caseLines) => {
      const key = comparableInputKey(caseLines);
      const matchIdx = descriptionInputKeys.findIndex(
        (descKey, idx) => descKey === key && !usedDescriptionIndices.has(idx),
      );
      if (matchIdx === -1) return undefined;
      usedDescriptionIndices.add(matchIdx);
      return expectedOutputs[matchIdx];
    },
  );

  const unmatchedCount = matchedExpectedOutputs.filter(
    (v) => v === undefined,
  ).length;
  if (unmatchedCount > 0) {
    console.warn(
      `[run_code] For slug "${slug}": couldn't value-match ${unmatchedCount} case(s) to a ` +
        `description example by input content; falling back to positional pairing for those. ` +
        `casesLines=${JSON.stringify(casesLines)} exampleInputsRaw=${JSON.stringify(exampleInputsRaw)}`,
    );
  }

  const compiler = COMPILER_MAP[language] ?? "python-3.14";
  const results = [];

  for (let i = 0; i < casesLines.length; i++) {
    const inputLines = casesLines[i];
    const inputDisplay = inputLines.join(" ");

    const expected = matchedExpectedOutputs[i] ?? expectedOutputs[i] ?? "?";
    let actual = "";
    let error = null;

    let runnableCode: string;
    switch (language) {
      case "python":
        runnableCode = buildPythonScript(code, inputLines);
        break;
      case "javascript":
        runnableCode = buildJSScript(code, inputLines);
        break;
      case "c":
        runnableCode = buildCScript(code, inputLines);
        break;
      case "cpp":
        runnableCode = buildCppScript(code, inputLines);
        break;
      case "go":
        runnableCode = buildGoScript(code, inputLines);
        break;
      case "rust":
        runnableCode = buildRustScript(code, inputLines);
        break;
      default:
        runnableCode = code;
    }

    console.log(
      `=== Case ${i + 1} (${language}) SCRIPT ===\n${runnableCode}\n=== END SCRIPT ===`,
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s safety timeout

      const response = await fetch(
        "https://api.onlinecompiler.io/api/run-code-sync/",
        {
          method: "POST",
          headers: {
            Authorization: process.env.ONLINECOMPILER_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ compiler, code: runnableCode }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log(`Case ${i + 1} response:`, JSON.stringify(data));
      actual = (data.output ?? data.stdout ?? data.result ?? "").trim();
      if (data.error) error = data.error;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        error = "Execution timed out after 25s";
      } else {
        error = String(e);
      }
      console.log(`Case ${i + 1} fetch error:`, error);
    }

    function extractComparableValue(s: string): string {
      const m = s.match(/^(-?\d+)\s*,\s*nums\s*=/i);
      return m ? m[1] : s;
    }

    function unwrapQuotedString(s: string): string {
      const trimmed = s.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        return trimmed.slice(1, -1);
      }
      return trimmed;
    }

    const passed =
      !error &&
      (normalize(extractComparableValue(actual)) ===
        normalize(extractComparableValue(expected)) ||
        normalize(unwrapQuotedString(extractComparableValue(actual))) ===
          normalize(unwrapQuotedString(extractComparableValue(expected))));
    if (!passed && !error) {
      console.warn(
        `[run_code] Case ${i + 1} mismatch despite visual similarity — raw values:\n` +
          `  expected raw: ${JSON.stringify(expected)}\n` +
          `  actual raw:   ${JSON.stringify(actual)}\n` +
          `  expected normalized: ${JSON.stringify(normalize(expected))}\n` +
          `  actual normalized:   ${JSON.stringify(normalize(actual))}`,
      );
    }

    results.push({
      input: inputDisplay,
      expected,
      actual,
      passed,
      error: error ?? null,
    });
  }

  return Response.json({
    passed: results.every((r) => r.passed),
    results,
  });
}
