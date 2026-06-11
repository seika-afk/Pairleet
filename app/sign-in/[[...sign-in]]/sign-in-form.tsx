"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useClerk, useSignIn } from "@clerk/nextjs";

function getErrorMessage(
  error: { longMessage?: string; message: string } | null,
) {
  return error?.longMessage ?? error?.message ?? "Unable to sign in.";
}

export function SignInForm() {
  const clerk = useClerk();
  const state = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn } = state;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!signIn) {
        setError("Sign in is not ready yet.");
        return;
      }

      const result = await signIn.password({ emailAddress, password });

      if (result.error) {
        setError(getErrorMessage(result.error));
        return;
      }

      if (signIn.createdSessionId) {
        await clerk.setActive({
          session: signIn.createdSessionId,
          redirectUrl: "/dashboard",
        });
        return;
      }

      setError("Sign in could not be completed.");
    } catch {
      setError("Sign in could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!signIn) {
        setError("Google sign in is not ready yet.");
        return;
      }

      const result = await signIn.sso({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectCallbackUrl: "/sso-callback",
        oidcPrompt: "select_account",
      });

      if (result.error) {
        setError(getErrorMessage(result.error));
      }
    } catch {
      setError("Google sign in could not be completed.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        id="sign-in-email"
        type="email"
        autoComplete="email"
        required
        value={emailAddress}
        onChange={(event) => setEmailAddress(event.target.value)}
        placeholder="Email"
        className="border-black border-2"
      />

      <input
        id="sign-in-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="border-black border-2"
      />

      {error ? <p>{error}</p> : null}

      <button
        type="submit"
        className="border-black border-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <button
        type="button"
        className="border-black border-2"
        onClick={signInWithGoogle}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Opening Google..." : "Continue with Google"}
      </button>

      <p>
        No account? <Link href="/sign-up">Create one</Link>
      </p>
    </form>
  );
}
