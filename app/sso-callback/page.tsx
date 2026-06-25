"use client";

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

async function registerUserInDB(clerkId: string, username: string) {
  await fetch("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkId, username }),
  });
}

export default function SsoCallbackPage() {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();
  const hasRun = useRef(false);

  useEffect(() => {
    (async () => {
      if (!clerk.loaded || hasRun.current) return;
      hasRun.current = true;

      const navigateTo = (url: string) => {
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      };

      const finalizeSignIn = async () => {
        await signIn.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            navigateTo(decorateUrl("/dashboard"));
          },
        });
      };

      const finalizeSignUp = async () => {
        // Derive username from Clerk data before finalizing
        const clerkUser = signUp;
        const username =
          clerkUser?.username ??
          clerkUser?.emailAddress?.split("@")[0] ??
          signUp?.createdUserId?.slice(0, 8) ??
          "user";

        await signUp.finalize({
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;

            // Register in MongoDB after successful sign-up
            if (signUp.createdUserId) {
              await registerUserInDB(signUp.createdUserId, username);
            }

            navigateTo(decorateUrl("/dashboard"));
          },
        });
      };

      // Case 1: sign-in is already complete
      if (signIn.status === "complete") {
        await finalizeSignIn();
        return;
      }

      // Case 2: sign-up used an existing account → transfer to sign-in
      if (signUp.isTransferable) {
        await signIn.create({ transfer: true });
        if ((signIn.status as string) === "complete") {
          await finalizeSignIn();
          return;
        }
        router.push("/sign-in");
        return;
      }

      // Case 3: sign-in used a new account → transfer to sign-up
      if (signIn.isTransferable) {
        await signUp.create({ transfer: true });
        if (signUp.status === "complete") {
          await finalizeSignUp();
          return;
        }
        router.push("/sign-in/continue");
        return;
      }

      // Case 4: sign-up is complete
      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      // Case 5: existing session activated (e.g. already logged in on another tab)
      const sessionId =
        signIn.existingSession?.sessionId ?? signUp.existingSession?.sessionId;
      if (sessionId) {
        await clerk.setActive({
          session: sessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            navigateTo(decorateUrl("/dashboard"));
          },
        });
        return;
      }

      // Fallback
      router.push("/sign-in");
    })();
  }, [clerk, signIn, signUp]);

  return (
    <div>
      {" "}
      <div id="clerk-captcha" />
      Loading{" "}
    </div>
  );
}
