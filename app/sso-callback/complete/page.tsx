import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export default async function SsoCompletePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  await connectDB();

  const existing = await User.findOne({ clerkId: userId });
  if (!existing) {
    const username =
      clerkUser?.username ??
      clerkUser?.emailAddresses[0]?.emailAddress.split("@")[0] ??
      userId.slice(0, 8);

    await User.create({
      clerkId: userId,
      username,
      totalSessions: 0,
      totalWins: 0,
    });
  }

  redirect("/dashboard");
}
