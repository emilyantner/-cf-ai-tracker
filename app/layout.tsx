import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Initiatives Tracker · Channel Factory",
  description: "AERO + IQ Series initiatives tracker for Channel Factory executive team",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
