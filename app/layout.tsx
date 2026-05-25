import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillSync AI",
  description: "AI Upwork job matching assistant for freelancers"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
