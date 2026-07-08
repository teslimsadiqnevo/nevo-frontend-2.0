import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/context/providers";

// Inter — the app-wide UI/body font (Design System v2 §2), wired to `--font-sans`
// so Tailwind's `font-sans` and shadcn defaults resolve to it everywhere.
// The brand-only "Agile" font is a separate `--font-agile` placeholder in
// globals.css (used ONLY for the logo/wordmark); add it via next/font/local
// once the font files are available.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nevo",
  description: "Learning that adapts to how you learn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
