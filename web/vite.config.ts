import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          // 开发环境使用localhost，生产环境使用环境变量
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts'],
            utils: ['swr', 'zustand', 'date-fns'],
          },
        },
      },
    },
    define: {
      // 确保环境变量可用
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:8080'),
    },
  }
})
