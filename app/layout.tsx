import type { Metadata } from "next";
import { Zilla_Slab, Work_Sans, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://green-starsolutions.com"),
  title: "Green Star Solutions — Growth Agency for Local Service Businesses",
  description:
    "More calls, more jobs, less busy work. We build high-converting websites, run Google & Meta ads, and automate follow-up for HVAC, plumbing, electrical, roofing, and landscaping businesses.",
  openGraph: {
    title: "Green Star Solutions — Growth Agency for the Trades",
    description:
      "High-converting websites, Google & Meta ads, and automated follow-up so local service businesses grow faster.",
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
        className={`${display.variable} ${body.variable} ${mono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
