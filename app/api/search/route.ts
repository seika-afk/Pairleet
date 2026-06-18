import { LeetCode } from "leetcode-query";

const lc = new LeetCode();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";

  const res = await lc.problems({ limit: 50, offset: 0 });

  const filtered = res.questions.filter((p) =>
    p.title.toLowerCase().includes(q),
  );

  return Response.json({ questions: filtered });
}
