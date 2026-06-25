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

async function registerUserInDB(clerkId: string, username: string) {
  const res = await fetch("/api/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clerkId, username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to save user.");
  }
}

// ─── Shared input style ────────────────────────────────────────────────────────
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
  transition: "border-color 0.15s",
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
  transition: "opacity 0.15s",
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
  transition: "border-color 0.15s",
};

const ghostBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#7c6ff7",
  cursor: "pointer",
  fontSize: "0.8rem",
  padding: 0,
  fontFamily: "inherit",
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

// ─── Component ─────────────────────────────────────────────────────────────────
export function SignUpForm() {
  const clerk = useClerk();
  const state = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [username, setUsername] = useState("");
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
        // Save to MongoDB before activating session
        await registerUserInDB(signUp.createdUserId!, username);
        await clerk.setActive({
          session: signUp.createdSessionId,
          redirectUrl: "/dashboard",
        });
        return;
      }

      await signUp.verifications.sendEmailCode();
      setStage("verify");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create account.",
      );
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
        // Save to MongoDB after email verification
        await registerUserInDB(signUp.createdUserId!, username);
        await clerk.setActive({
          session: signUp.createdSessionId,
          redirectUrl: "/dashboard",
        });
        return;
      }

      setError("Verification completed, but no active session was returned.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to verify the code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (!signUp) return;
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

  // ── Verify stage ──────────────────────────────────────────────────────────────
  if (stage === "verify") {
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
            Check your email
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.4rem" }}>
            We sent a 6-digit code to{" "}
            <span style={{ color: "#aaa" }}>{emailAddress}</span>.
          </p>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <form
          onSubmit={submitCode}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label htmlFor="sign-up-code" style={labelStyle}>
              VERIFICATION CODE
            </label>
            <input
              id="sign-up-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              style={{
                ...inputStyle,
                letterSpacing: "0.3em",
                fontSize: "1.1rem",
                textAlign: "center",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              ...primaryBtnStyle,
              opacity: isSubmitting ? 0.6 : 1,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify code →"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            style={ghostBtnStyle}
            onClick={resendCode}
            disabled={isSubmitting}
          >
            Resend code
          </button>
          <button
            type="button"
            style={{ ...ghostBtnStyle, color: "#555" }}
            onClick={restartSignUp}
            disabled={isSubmitting}
          >
            Change email
          </button>
        </div>
      </div>
    );
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
          Create account
        </h2>
        <p
          style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.4rem" }}
        ></p>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <form
        onSubmit={submitSignUp}
        style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
      >
        <div>
          <label htmlFor="sign-up-username" style={labelStyle}>
            USERNAME
          </label>
          <input
            id="sign-up-username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Random corny name"
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="sign-up-email" style={labelStyle}>
            EMAIL
          </label>
          <input
            id="sign-up-email"
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
          <label htmlFor="sign-up-password" style={labelStyle}>
            PASSWORD
          </label>
          <input
            id="sign-up-password"
            type="password"
            autoComplete="new-password"
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
          {isSubmitting ? "Creating..." : "Create account →"}
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
        onClick={signUpWithGoogle}
        style={{
          ...secondaryBtnStyle,
          opacity: isSubmitting ? 0.6 : 1,
        }}
        disabled={isSubmitting}
      >
        {/* Google icon */}
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
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-zinc-200 hover:text-zinc-500"
          style={{ textDecoration: "none" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
