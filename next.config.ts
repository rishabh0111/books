import type { NextConfig } from "next";

// Static export for GitHub Pages. A project page lives under /<repo>, which the
// deploy workflow passes in as BASE_PATH; locally it is empty.
const basePath = process.env.BASE_PATH ?? "";

const config: NextConfig = {
  output: "export",
  basePath,
  // Folder URLs (/literature/index.html) are what GitHub Pages serves most reliably.
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default config;
