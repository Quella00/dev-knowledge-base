import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 告诉 Next.js 把这个包排除在打包之外，作为外部依赖处理
  serverExternalPackages: ["svg-captcha"],
};

export default nextConfig;
