import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't write AGENTS.md / CLAUDE.md into the repository on `next dev`.
  agentRules: false,
};

export default nextConfig;
