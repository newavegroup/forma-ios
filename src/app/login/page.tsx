"use client";

import { useState } from "react";
import { register, login } from "@/app/actions/auth";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold"
              style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
            >
              F
            </div>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
            >
              Forma
            </span>
          </div>
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--foreground)" }}
          >
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--secondary)" }}>
            {mode === "login"
              ? "Sign in to your athlete dashboard"
              : "Start tracking your hybrid athlete nutrition"}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 space-y-5"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.3)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Alex Johnson"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--surface-high)",
                    border: "1px solid var(--outline-variant)",
                    color: "var(--foreground)",
                    fontFamily: "var(--font-body)",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--outline-variant)")
                  }
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="alex@example.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--surface-high)",
                  border: "1px solid var(--outline-variant)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--primary)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--outline-variant)")
                }
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--surface-high)",
                  border: "1px solid var(--outline-variant)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--primary)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--outline-variant)")
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--background)",
                fontFamily: "var(--font-body)",
              }}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-sm transition-opacity hover:opacity-80"
              style={{ color: "var(--primary)" }}
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--secondary)" }}>
          Built for hybrid athletes — strength + endurance
        </p>
      </div>
    </div>
  );
}
