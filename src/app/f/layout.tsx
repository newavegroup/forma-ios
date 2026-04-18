import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forma",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      {children}
    </div>
  );
}
