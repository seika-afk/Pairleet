import { SignOutButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
      <SignOutButton redirectUrl="/sign-in">
        <button type="button">Log out</button>
      </SignOutButton>
  );
}
