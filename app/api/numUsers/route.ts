import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const length = await User.countDocuments();
    return Response.json({ user_length: length });
  } catch (e) {
    console.error("/api/numUsers error:", e);
    return Response.json({ user_length: 0 }, { status: 500 });
  }
}
