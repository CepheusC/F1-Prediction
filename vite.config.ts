import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

function utf8HtmlHeaderPlugin() {
  return {
    name: 'utf8-html-header',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const originalSetHeader = res.setHeader
        res.setHeader = ((name: string, value: unknown) => {
          if (typeof name === 'string' && name.toLowerCase() === 'content-type') {
            if (typeof value === 'string' && value.startsWith('text/html') && !value.toLowerCase().includes('charset=')) {
              return originalSetHeader.call(res, name, `${value}; charset=utf-8`)
            }
          }
          return originalSetHeader.call(res, name, value as never)
        }) as never

        const originalWriteHead = res.writeHead
        res.writeHead = ((statusCode: number, ...rest: unknown[]) => {
          try {
            const contentType = res.getHeader('Content-Type')
            if (typeof contentType === 'string' && contentType.startsWith('text/html') && !contentType.toLowerCase().includes('charset=')) {
              originalSetHeader.call(res, 'Content-Type', `${contentType}; charset=utf-8`)
            }
          } catch (e) {
            void e
          }
          return originalWriteHead.apply(res, [statusCode, ...rest] as never)
        }) as never

        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const originalSetHeader = res.setHeader
        res.setHeader = ((name: string, value: unknown) => {
          if (typeof name === 'string' && name.toLowerCase() === 'content-type') {
            if (typeof value === 'string' && value.startsWith('text/html') && !value.toLowerCase().includes('charset=')) {
              return originalSetHeader.call(res, name, `${value}; charset=utf-8`)
            }
          }
          return originalSetHeader.call(res, name, value as never)
        }) as never

        const originalWriteHead = res.writeHead
        res.writeHead = ((statusCode: number, ...rest: unknown[]) => {
          try {
            const contentType = res.getHeader('Content-Type')
            if (typeof contentType === 'string' && contentType.startsWith('text/html') && !contentType.toLowerCase().includes('charset=')) {
              originalSetHeader.call(res, 'Content-Type', `${contentType}; charset=utf-8`)
            }
          } catch (e) {
            void e
          }
          return originalWriteHead.apply(res, [statusCode, ...rest] as never)
        }) as never

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    utf8HtmlHeaderPlugin(),
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
