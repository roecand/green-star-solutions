import type { Metadata } from "next";
import {
  Zilla_Slab,
  Work_Sans,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

// Slab-serif headlines — sturdy, confident, editorial. The opposite of a
// friendly geometric sans, and unmistakably its own identity.
const display = Zilla_Slab({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Characterful neo-grotesk body — narrower and sharper than rounded humanist
// sans, keeps long reading crisp and professional.
const body = Work_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Technical mono for labels, indices, and data.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

// The Dr. Kwak-Tran practice's real typeface — used only inside the case-study
// recreation so it's faithful to her brand and a clear foil to Green Star's.
const clinical = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-clinical",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://green-starsolutions.com"),
  title: "Green Star Solutions — Digital & AI Studio in Las Vegas",
  description:
    "We make local businesses win with AI and digital — sites that convert, AI that answers the calls you miss, ads that compound. A Las Vegas studio for practices, firms, and trades.",
  openGraph: {
    title: "Green Star Solutions — Digital & AI Studio in Las Vegas",
    description:
      "Sites that convert, AI that answers, ads that compound. Built for established local businesses in Las Vegas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} ${clinical.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
