import { LeetCode } from "leetcode-query";

const lc = new LeetCode();

const COMPILER_MAP: Record<string, string> = {
  python: "python-3.14",
  javascript: "nodejs-22",
  cpp: "g++23",
  c: "gcc13",
  go: "go-1.23",
  rust: "rust-1.84",
};

const normalize = (s: string) =>
  s
    .trim()
    .replace(/[\r\n\t]/g, "")
    .replace(/\s/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .toLowerCase();

function parsePythonSignature(code: string): { method: string } | null {
  const match = code.match(/def\s+(\w+)\s*\(self([^)]*)\)/);
  if (!match) return null;
  return { method: match[1] };
}

function buildPythonScript(userCode: string, inputLines: string[]): string {
  const sig = parsePythonSignature(userCode);
  if (!sig) return userCode;
  return `import ast, json\n\n${userCode}\n\n_args = [ast.literal_eval(x) for x in ${JSON.stringify(inputLines)}]\n_result = Solution().${sig.method}(*_args)\nprint(json.dumps(_result))\n`;
}

function buildJSScript(userCode: string, inputLines: string[]): string {
  const argList = inputLines
    .map((l) => `JSON.parse(${JSON.stringify(l.trim())})`)
    .join(", ");
  return `${userCode}\n\nconst _sol = new Solution();\nconst _method = Object.getOwnPropertyNames(Solution.prototype).find(m => m !== 'constructor');\nconst _result = _sol[_method](${argList});\nconsole.log(JSON.stringify(_result));\n`;
}

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
    // print result
    if constexpr (requires { result.begin(); }) {
        cout << "[";
        for(int i=0;i<(int)result.size();i++){
            if(i) cout<<",";
            cout<<result[i];
        }
        cout << "]" << endl;
    } else {
        cout << result << endl;
    }
    return 0;
}
`;
}

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

func main() {
    result := ${sig.method}(${argList})
    fmt.Println(result)
}
`;
}

function buildRustScript(userCode: string, inputLines: string[]): string {
  const match = userCode.match(/pub fn\s+(\w+)\s*\(([^)]*)\)/);
  if (!match) return userCode;

  const method = match[1];
  const params = match[2]
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
      if (p.includes("String")) return `String::from(${JSON.stringify(line)})`;
      return line;
    })
    .join(", ");

  return `${userCode}

fn main() {
    let result = Solution::${method}(${argList});
    println!("{:?}", result);
}
`;
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

  const outputMatches = [
    ...(problem.content?.matchAll(/Output[^:]*:\s*<\/strong>\s*([^\n<]+)/gi) ??
      []),
  ];
  const expectedOutputs = outputMatches.map((m) =>
    m[1]
      .trim()
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\r/g, "")
      .trim(),
  );

  const allLines = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const numCases = expectedOutputs.length || 1;
  const linesPerCase = Math.max(1, Math.round(allLines.length / numCases));

  const casesLines: string[][] = [];
  for (let i = 0; i < allLines.length; i += linesPerCase) {
    casesLines.push(allLines.slice(i, i + linesPerCase));
  }

  if (casesLines.length === 0) {
    return Response.json(
      { error: "No test cases found for this problem" },
      { status: 400 },
    );
  }

  const compiler = COMPILER_MAP[language] ?? "python-3.14";
  const results = [];

  for (let i = 0; i < casesLines.length; i++) {
    const inputLines = casesLines[i];
    const inputDisplay = inputLines.join(" ");
    const expected = expectedOutputs[i] ?? "?";
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

    try {
      const response = await fetch(
        "https://api.onlinecompiler.io/api/run-code-sync/",
        {
          method: "POST",
          headers: {
            Authorization: process.env.ONLINECOMPILER_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ compiler, code: runnableCode }),
        },
      );

      const data = await response.json();
      console.log(`Case ${i + 1} response:`, JSON.stringify(data));
      actual = (data.output ?? data.stdout ?? data.result ?? "").trim();
      if (data.error) error = data.error;
    } catch (e) {
      error = String(e);
    }

    results.push({
      input: inputDisplay,
      expected,
      actual,
      passed: !error && normalize(actual) === normalize(expected),
      error: error ?? null,
    });
  }

  return Response.json({
    passed: results.every((r) => r.passed),
    results,
  });
}
