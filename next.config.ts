import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a fully static site to ./out so it can be dropped onto any static
  // host (Netlify Drop, etc.). The site has no server needs — the form posts
  // to Formspree from the browser.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
