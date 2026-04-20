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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 72" fill="none" style={{ height: 24, width: "auto" }}>
          <text x="0" y="54" fontFamily="var(--font-display), 'Space Grotesk', sans-serif" fontSize="56" fontWeight="700" letterSpacing="-1.68" fill="#F5F6F7">Forma</text>
          <circle cx="232" cy="18" r="6" fill="#D4FF3A" />
        </svg>
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
