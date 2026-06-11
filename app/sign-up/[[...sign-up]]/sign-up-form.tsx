"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useClerk, useSignUp } from "@clerk/nextjs";

function getErrorMessage(
  error: { longMessage?: string; message: string } | null,
) {
  return error?.longMessage ?? error?.message ?? "Unable to create account.";
}

export function SignUpForm() {
  const clerk = useClerk();
  const state = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<"form" | "verify">("form");

  const { signUp } = state;

  async function submitSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!signUp) {
        setError("Sign up is not ready yet.");
        return;
      }

      const result = await signUp.password({ emailAddress, password });

      if (result.error) {
        setError(getErrorMessage(result.error));
        return;
      }

      if (signUp.createdSessionId) {
        await clerk.setActive({
          session: signUp.createdSessionId,
          redirectUrl: "/dashboard",
        });
        return;
      }

      await signUp.verifications.sendEmailCode();
      setStage("verify");
    } catch {
      setError("Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signUpWithGoogle() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!signUp) {
        setError("Google sign up is not ready yet.");
        return;
      }

      const result = await signUp.sso({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectCallbackUrl: "/sso-callback",
        oidcPrompt: "select_account",
      });

      if (result.error) {
        setError(getErrorMessage(result.error));
      }
    } catch {
      setError("Google sign up could not be completed.");
      setIsSubmitting(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!signUp) {
        setError("Sign up is not ready yet.");
        return;
      }

      await signUp.verifications.verifyEmailCode({ code });

      if (signUp.createdSessionId) {
        await clerk.setActive({
          session: signUp.createdSessionId,
          redirectUrl: "/dashboard",
        });
        return;
      }

      setError(
        "Verification completed, but Clerk did not return an active session.",
      );
    } catch {
      setError("Unable to verify the code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (!signUp) {
        setError("Sign up is not ready yet.");
        return;
      }

      await signUp.verifications.sendEmailCode();
    } catch {
      setError("Unable to resend the code.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartSignUp() {
    setError(null);
    setCode("");
    setStage("form");
  }

  if (stage === "verify") {
    return (
      <form onSubmit={submitCode}>
        <input
          id="sign-up-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Verification code"
          className="border-black border-2"
        />

        <p>We sent a code to {emailAddress}.</p>

        {error ? <p>{error}</p> : null}

        <button
          type="submit"
          className="border-black border-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Verify code"}
        </button>

        <button
          type="button"
          className="border-black border-2"
          onClick={resendCode}
          disabled={isSubmitting}
        >
          Resend code
        </button>

        <button type="button" onClick={restartSignUp} disabled={isSubmitting}>
          Change email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitSignUp}>
      <input
        id="sign-up-email"
        type="email"
        autoComplete="email"
        required
        value={emailAddress}
        onChange={(event) => setEmailAddress(event.target.value)}
        placeholder="Email"
        className="border-black border-2"
      />

      <input
        id="sign-up-password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        className="border-black border-2"
      />

      {error ? <p>{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="border-black border-2"
      >
        {isSubmitting ? "Creating..." : "Create account"}
      </button>

      <button
        type="button"
        onClick={signUpWithGoogle}
        className="border-black border-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Opening Google..." : "Continue with Google"}
      </button>

      <p>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
