import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // The parent folder has its own package-lock.json, which makes Turbopack
  // guess the wrong workspace root — pin it to this project.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
