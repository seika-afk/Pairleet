import { LeetCode } from "leetcode-query";

const lc = new LeetCode();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });

  const problem = await lc.problem(slug);

  return Response.json({
    title: problem.title,
    difficulty: problem.difficulty,
    content: problem.content, // HTML description
    exampleTestcases: problem.exampleTestcases, // raw test input strings
    sampleTestCase: problem.sampleTestCase,
    hints: problem.hints, // string[]
    topicTags: problem.topicTags,
    codeSnippets: problem.codeSnippets, // per-language starter code
  });
}
