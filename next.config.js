/** @type {import('next').NextConfig} */
const nextConfig = {
  // 使用 server 模式以支持 API 路由
  // 如需静态导出，请使用: output: 'export'
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
