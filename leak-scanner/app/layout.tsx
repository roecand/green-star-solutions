import type { Metadata } from "next";
import { Zilla_Slab, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Same type system as the Green Star marketing site: slab-serif display,
// neo-grotesk body, technical mono.
const display = Zilla_Slab({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Greenstar Revenue Leak Scanner",
    template: "%s | Greenstar Revenue Leak Scanner",
  },
  description:
    "Scan your website, local visibility, AI visibility, trust signals, and follow-up readiness. Get a clear Revenue Leak Score and a prioritized action plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
