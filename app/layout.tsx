import type { Metadata } from "next";
import Script from "next/script";
import { Zilla_Slab, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Google Analytics 4 — property "Green Star", stream 15185244702.
const GA_ID = "G-FJJNMXN1TJ";

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
  title: {
    default:
      "Green Star Solutions — Perception Studio for the Trades | Las Vegas, NV",
    template: "%s | Green Star Solutions",
  },
  description:
    "We redesign the feeling people get when they look at your business. Brand, website, socials, and ads that let trade companies charge premium prices — plus the follow-up system that books every new call. Las Vegas, NV.",
  keywords: [
    "trades branding agency Las Vegas",
    "HVAC website design",
    "contractor rebrand",
    "plumber marketing",
    "roofing company websites",
    "contractor Google Ads",
    "local service business marketing",
  ],
  openGraph: {
    title: "Green Star Solutions — Perception Studio for the Trades",
    description:
      "We redesign the feeling people get when they look at your business — brand, website, socials, ads, and the conversion system behind them.",
    type: "website",
    locale: "en_US",
    siteName: "Green Star Solutions",
  },
};

// Local-business structured data for search engines.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Green Star Solutions",
  url: "https://green-starsolutions.com",
  email: "robert@green-starsolutions.com",
  telephone: "+1-702-742-9285",
  description:
    "Perception studio for the trades: brand, website, social, and ad design that lets HVAC, plumbing, electrical, roofing, and landscaping companies charge premium prices — with automated follow-up that books every call.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Las Vegas",
    addressRegion: "NV",
    addressCountry: "US",
  },
  areaServed: { "@type": "City", name: "Las Vegas" },
  knowsAbout: [
    "Brand design",
    "Website design",
    "Google Ads",
    "Meta Ads",
    "CRM setup",
    "Marketing automation",
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');`}
        </Script>
        {children}
      </body>
    </html>
  );
}
