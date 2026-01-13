import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 开发环境代理 /api 请求到后端
      '/api': {
        target: 'https://nofx-gyc567.replit.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true, // Make test utilities global for easier use
    setupFiles: ['./vitest.setup.ts'],
    // Revert include to default (all tests)
  },
})
