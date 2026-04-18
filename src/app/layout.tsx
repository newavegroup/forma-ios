import type { Metadata } from "next";
import { Epilogue, Manrope } from "next/font/google";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forma — Nutrition for Hybrid Athletes",
  description:
    "Track nutrition, generate AI-powered meal plans, and monitor performance for hybrid athletes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${epilogue.variable} ${manrope.variable} h-full antialiased`}
    >
      <body
        className="min-h-full"
        style={{ fontFamily: "var(--font-body)", backgroundColor: "var(--background)" }}
      >
        {children}
      </body>
    </html>
  );
}
