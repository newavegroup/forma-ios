"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: "var(--surface-low)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Back arrow */}
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
          }}
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.03em",
              color: "#F5F6F7",
              lineHeight: 1,
            }}
          >
            Forma
          </span>
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#D4FF3A",
              marginBottom: 8,
            }}
          />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ backgroundColor: "var(--surface-highest)", color: "var(--secondary)" }}
        >
          JA
        </div>
      </div>
    </header>
  );
}
