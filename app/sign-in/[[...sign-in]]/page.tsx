import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#111113",
        color: "#e8e8e8",
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Page heading */}
      <div style={{ padding: "2rem 2.5rem 0" }}>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            margin: 0,
            lineHeight: 1,
          }}
        >
          SIGN IN
        </h1>
      </div>

      {/* Bento grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gridTemplateRows: "auto auto",
          gap: "12px",
          padding: "1.5rem 2.5rem 2.5rem",
        }}
      >
        {/* Left top — hero card */}
        <div
          style={{
            backgroundColor: "#1c1c1f",
            borderRadius: "16px",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "220px",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            PAIRLEET
          </span>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            Back to competing.
            <br />
            Back to practicing.
          </h2>
        </div>

        {/* Right — form card, spans 2 rows */}
        <div
          style={{
            backgroundColor: "#1c1c1f",
            borderRadius: "16px",
            padding: "2rem",
            gridRow: "1 / 3",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SignInForm />
          <div id="clerk-captcha" />
        </div>

        {/* Left bottom — bugs/contact card */}
        <div
          style={{
            backgroundColor: "#1c1c1f",
            borderRadius: "16px",
            padding: "2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                color: "#555",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              BUGS / CONTACT
            </span>
            <p
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                margin: "0 0 0.5rem",
                color: "#e8e8e8",
              }}
            >
              Something broken?
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#888",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Since Pairleet has just begun (As of June 2026). You could expect
              a lot of bugs, but we are open to correcting mistakes, so if you
              find any bug — just text us or email us in any given Social. We
              will try to fix it asap :)
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
