/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["svg-captcha", "@prisma/client", 'prisma'],
  
  // 保留 typescript 配置，防止构建报错
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ❌ 删除 eslint 配置块，Next.js 15 不支持在这里配置它
  // eslint: {
  //   ignoreDuringBuilds: true,
  // }
};

module.exports = nextConfig;
