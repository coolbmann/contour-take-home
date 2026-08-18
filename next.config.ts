import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // @fluentui/react-icons has ~26k barrel exports; this keeps imports
    // tree-shaken to only the icons actually referenced.
    optimizePackageImports: ["@fluentui/react-icons"],
  },
};

export default nextConfig;
