import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker | Personal Finance Dashboard",
  description:
    "Track expenses, analyze spending patterns, and export reports in a modern Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
