import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["neo4j-driver", "jsdom"],
};

export default nextConfig;
