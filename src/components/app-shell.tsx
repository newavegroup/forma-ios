"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex pt-14 min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-56 p-6 min-h-full">
          {children}
        </main>
      </div>
    </>
  );
}
