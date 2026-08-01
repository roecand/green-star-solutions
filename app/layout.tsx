import type { Metadata } from "next";
import Script from "next/script";
import { Archivo } from "next/font/google";
import "./globals.css";

// Google Analytics 4 - property "Green Star", stream 15185244702.
const GA_ID = "G-FJJNMXN1TJ";

/**
 * ONE typeface, used at two ends of its width axis.
 *
 * The old stack was Zilla Slab + Work Sans: two Google fonts, which
 * DESIGN-STANDARD.md §3 calls out as literally the default answer. A licensed
 * face is the real cost signal and Robert has not bought one, so the next best
 * thing is a commitment a model would not make: a single variable family
 * stretched to wdth 125 for display and left at 100 for text.
 *
 * Archivo carries a wdth axis from 62 to 125. Expanded, tight-tracked and
 * heavy, it reads like fleet lettering and shop signage - which is the
 * industry - while the normal width sets clean body copy from the same
 * skeleton. Two registers, one family, no serif.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://green-starsolutions.com"),
  title: {
    default:
      "Green Star Solutions: Perception Studio for the Trades | Las Vegas, NV",
    template: "%s | Green Star Solutions",
  },
  description:
    "Homeowners decide in eight seconds. We design what they see, then make sure the call gets answered. Brand, website, socials and ads for HVAC, plumbing, electrical, roofing and landscaping companies in Las Vegas.",
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
    title: "Green Star Solutions: Perception Studio for the Trades",
    description:
      "Homeowners decide in eight seconds. We design what they see, then make sure the call gets answered.",
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
    "Perception studio for the trades: brand, website, social, and ad design that lets HVAC, plumbing, electrical, roofing, and landscaping companies charge premium prices, with automated follow-up that books every call.",
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
    <html lang="en" className="js-anim">
      <head>
        {/* The reveals are opacity 0 in the stylesheet, gated on .js-anim, so
            a visitor with scripting off would otherwise get a page with
            nothing on it. Rather than adding the class with a script (which
            hydration-mismatches against the server HTML, and which React will
            not run on client navigation anyway), the class is server
            rendered and this undoes it when there is no scripting. noscript
            styles need no script by definition and cost nothing otherwise. */}
        <noscript>
          <style>{`.js-anim .reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className={archivo.variable}>
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
