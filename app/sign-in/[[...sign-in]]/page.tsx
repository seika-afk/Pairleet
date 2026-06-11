import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main>
      <SignInForm />
      <div id="clerk-captcha" />
    </main>
  );
}
