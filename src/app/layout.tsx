import type { Metadata } from "next";
import { Space_Grotesk, Inter, Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Forma — Nutrition for Hybrid Athletes",
  description:
    "Track nutrition, generate AI-powered meal plans, and monitor performance for hybrid athletes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${barlowCondensed.variable} ${barlow.variable} h-full antialiased`}
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
