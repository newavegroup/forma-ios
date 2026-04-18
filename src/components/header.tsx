"use client";

import Link from "next/link";

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 border-b"
      style={{
        backgroundColor: "var(--surface-low)",
        borderColor: "var(--outline-variant)",
      }}
    >
      <Link
        href="/"
        className="flex items-center gap-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: "var(--primary)", color: "var(--background)" }}
        >
          F
        </div>
        <span className="font-semibold text-lg tracking-tight" style={{ color: "var(--foreground)" }}>
          Forma
        </span>
      </Link>

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
