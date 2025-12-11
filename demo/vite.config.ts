import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'

// 获取当前目录的ES模块兼容方式
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(() => {

  // HTTPS配置
  const httpsConfig = existsSync('./certs/server.key') && existsSync('./certs/server.crt') ? {
    key: readFileSync('./certs/server.key'),
    cert: readFileSync('./certs/server.crt')
  } : undefined

  return {
    base: '/seamless-texture-generator/',
    plugins: [vue(), UnoCSS()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0', // 允许外部访问
      port: 3000,
      open: true,
      https: httpsConfig,
      headers: {
        // 移动设备安全头部
        'Content-Security-Policy': 'upgrade-insecure-requests',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        // 允许跨域访问（开发环境）
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
        // 代理配置
    proxy: {
      '/api/proxy': {
        target: 'https://api-inference.modelscope.cn',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api\/proxy/, '')
      }
    }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    optimizeDeps: {
      include: ['@leolee9086/split-viewer']
    },
  
  }
})