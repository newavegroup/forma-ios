"use client";

import { useState } from "react";
import { register, login } from "@/app/actions/auth";

const C = {
  canvas:   "#0A0B0D",
  surface:  "#14161A",
  subtle:   "#1F2228",
  fg1:      "#F5F6F7",
  fg2:      "#A8ADB6",
  fg3:      "#6B7280",
  fg4:      "#3A3F47",
  accent:   "#D4FF3A",
  danger:   "#F56565",
  b1:       "rgba(255,255,255,0.06)",
  b2:       "rgba(255,255,255,0.10)",
};

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    let result: { error?: string } | undefined;

    if (mode === "register") {
      const name = formData.get("name") as string;
      result = await register({ email, password, name });
    } else {
      result = await login({ email, password });
    }

    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  function inputStyle(field: string) {
    return {
      width: "100%",
      height: 52,
      background: C.subtle,
      border: `1px solid ${focusedField === field ? C.accent : error && field !== "name" ? C.b2 : C.b1}`,
      borderRadius: 6,
      padding: "0 14px",
      fontFamily: "var(--font-body)",
      fontSize: 15,
      color: C.fg1,
      outline: "none",
      boxSizing: "border-box" as const,
    };
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: C.canvas,
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "32px 24px 0" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 22,
            letterSpacing: "-0.03em",
            color: C.fg1,
          }}
        >
          Forma
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          padding: "48px 24px 0",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          maxWidth: 480,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "clamp(28px, 5vw, 36px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: C.fg1,
              margin: 0,
            }}
          >
            {mode === "register"
              ? "A nutrition OS for hybrid athletes."
              : "Welcome back."}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 15,
              lineHeight: 1.55,
              color: C.fg2,
              margin: "14px 0 0",
            }}
          >
            {mode === "register"
              ? "Calibrated to your body. Adjusted every week. Logged in seconds."
              : "Sign in to your athlete dashboard."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "register" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                htmlFor="name"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: C.fg2,
                }}
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Alex Johnson"
                style={inputStyle("name")}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
              />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="email"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.fg2,
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              style={inputStyle("email")}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              htmlFor="password"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: C.fg2,
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
              style={inputStyle("password")}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
            />
          </div>

          {error && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: C.danger,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 52,
              borderRadius: 6,
              border: 0,
              background: loading ? C.fg4 : C.accent,
              color: C.canvas,
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 9999,
                    border: `2px solid ${C.canvas}`,
                    borderTopColor: "transparent",
                    animation: "spin 1s linear infinite",
                  }}
                />
                {mode === "register" ? "Creating account" : "Signing in"}
              </>
            ) : mode === "register" ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px 32px", maxWidth: 480, width: "100%", margin: "0 auto", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          style={{
            background: "transparent",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: C.fg2,
            cursor: "pointer",
          }}
        >
          {mode === "login" ? (
            <>Don&apos;t have an account? <span style={{ color: C.fg1, fontWeight: 500 }}>Sign up</span></>
          ) : (
            <>Already have an account? <span style={{ color: C.fg1, fontWeight: 500 }}>Sign in</span></>
          )}
        </button>
      </div>
    </div>
  );
}
