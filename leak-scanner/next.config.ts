import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The parent directory contains another project with its own lockfile;
  // without this, Turbopack infers the wrong workspace root and resolves
  // modules (including React) from the wrong node_modules.
  turbopack: {
    root: path.join(__dirname),
  },
  // e2e runs use an isolated build dir so they never collide with a running
  // dev server's .next output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
