import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import httpProxy from 'http-proxy'

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
    plugins: [
      vue(),
      UnoCSS(),
      {
        name: 'dynamic-proxy-middleware',
        configureServer(server) {
          const proxy = httpProxy.createProxyServer({
            changeOrigin: true,
            secure: false
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy Error:', err);
            // @ts-ignore
            if (!res.headersSent) {
              // @ts-ignore
              res.writeHead(502, { 'Content-Type': 'application/json' });
              // @ts-ignore
              res.end(JSON.stringify({ error: 'Proxy Error', details: err.message }));
            }
          });
          server.middlewares.use('/api/common', (req, res, next) => {
            try {
              const urlObj = new URL(req.url!, 'http://localhost');
              const targetParam = urlObj.searchParams.get('target');
              if (!targetParam) {
                console.error('[Middleware] 缺少 target 参数');
                res.statusCode = 400;
                res.end('Missing target parameter');
                return;
              }
              const targetUrl = new URL(decodeURIComponent(targetParam));
              const targetOrigin = targetUrl.origin;
              const cleanPath = targetUrl.pathname.replace(/\/\//g, '/') + targetUrl.search;
              req.url = cleanPath;
              console.log(`[Proxy] 🚀 转发: ${targetOrigin} -> ${cleanPath}`);
              proxy.web(req, res, { target: targetOrigin });
            } catch (e) {
              console.error('[Middleware] 解析失败:', e);
              res.statusCode = 500;
              res.end('Internal Proxy Error');
            }
          });
        }
      }
    ],
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
          // Fallback，实际上会被 router 覆盖
          target: 'http://localhost',
          changeOrigin: true,
          secure: false, // 支持自签名 HTTPS

          // 【关键步骤 1】Rewrite: 决定发给目标服务器的 "路径"
          rewrite: (path: string) => {
            try {
              // 构造一个 URL 对象方便解析参数
              // 注意：path 只是路径部分，new URL 需要完整的 url，所以补一个 dummy base
              const urlObj = new URL(path, 'http://localhost')
              const targetEncoded = urlObj.searchParams.get('target')
              const cleanTargetEncoded = targetEncoded.replace(/\/\//g, '/');
                console.log(cleanTargetEncoded)

              if (cleanTargetEncoded) {
                // 再次解析 target 参数
                
                const targetUrl = new URL(cleanTargetEncoded);

                // 🔥 核心修复：把 pathname 里的双斜杠 // 替换为单斜杠 /
                // 你的日志里 pathname 是 //v1/images/generations
                const cleanPath = targetUrl.pathname.replace(/^\/+/, '/');
                console.log(cleanPath)

                return targetUrl.origin+cleanPath + targetUrl.search;

              }
              return path // 如果没传 target，原样返回（或者报错）
            } catch (e) {
              console.error('解析代理目标失败:', e)
              return path
            }
          },
    // 【关键步骤 2】Router: 决定发给目标服务器的 "域名"
          router: (req: any) => {
            try {
              // req.url 包含完整的 path 和 query
              const urlObj = new URL(req.url, 'http://localhost')
              const targetEncoded = urlObj.searchParams.get('target')
                console.log(`[Proxy] Dynamic Target: ${targetEncoded}`)

              if (targetEncoded) {
                const targetUrl = new URL(targetEncoded)
                // 返回协议 + 域名 (例如 https://google.com)
                console.log(`[Proxy] Dynamic Target: ${targetUrl.origin}`)
                return targetUrl.origin
              }
            } catch (e) {
              // ignore error
            }
            return 'http://localhost'
          }
      
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