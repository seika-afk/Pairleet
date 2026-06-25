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

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#111113",
  border: "1px solid #2a2a2e",
  borderRadius: "10px",
  padding: "0.7rem 1rem",
  color: "#e8e8e8",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#7c6ff7",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "0.75rem 1rem",
  fontWeight: 700,
  fontSize: "0.875rem",
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtnStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#1c1c1f",
  color: "#bbb",
  border: "1px solid #2a2a2e",
  borderRadius: "10px",
  padding: "0.75rem 1rem",
  fontWeight: 600,
  fontSize: "0.875rem",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
  color: "#555",
  textTransform: "uppercase" as const,
  display: "block",
  marginBottom: "0.4rem",
};

const errorStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#e57373",
  backgroundColor: "#1e1315",
  border: "1px solid #3d1f1f",
  borderRadius: "8px",
  padding: "0.6rem 0.75rem",
};

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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <span style={labelStyle}>PAIRLEET</span>
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 800,
            margin: 0,
            color: "#fff",
          }}
        >
          Welcome back
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.4rem" }}>
          Sign in to continue competing.
        </p>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
      >
        <div>
          <label htmlFor="sign-in-email" style={labelStyle}>
            EMAIL
          </label>
          <input
            id="sign-in-email"
            type="email"
            autoComplete="email"
            required
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="sign-in-password" style={labelStyle}>
            PASSWORD
          </label>
          <input
            id="sign-in-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        <button
          className="bg-zinc-400 h-13 hover:bg-zinc-600 cursor-pointer duration-100 transition rounded-2xl"
          type="submit"
          disabled={isSubmitting}
          style={{
            marginTop: "0.25rem",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "Signing in..." : "Sign in →"}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          color: "#333",
          fontSize: "0.75rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", backgroundColor: "#222" }} />
        OR
        <div style={{ flex: 1, height: "1px", backgroundColor: "#222" }} />
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        style={{ ...secondaryBtnStyle, opacity: isSubmitting ? 0.6 : 1 }}
        disabled={isSubmitting}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isSubmitting ? "Opening Google..." : "Continue with Google"}
      </button>

      <p
        style={{
          fontSize: "0.78rem",
          color: "#555",
          textAlign: "center",
          margin: 0,
        }}
      >
        No account?{" "}
        <Link
          className="text-zinc-400 hover:text-zinc-600"
          href="/sign-up"
          style={{ textDecoration: "none" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
