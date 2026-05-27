import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_MODE === "export";

const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : "standalone",
  trailingSlash: isMobileBuild,
  images: {
    unoptimized: isMobileBuild,
  },
};

export default nextConfig;
