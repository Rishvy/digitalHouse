import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.0.6",
    "34a6b433-63bb-492f-aca1-794e9b5285c6.preview.emergentagent.com",
    "*.preview.emergentagent.com",
  ],
};

export default nextConfig;
