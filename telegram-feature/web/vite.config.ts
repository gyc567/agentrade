import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5000,
      proxy: {
        '/api': {
          // 开发环境使用localhost，生产环境使用环境变量
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            // React核心（必须）
            'react-vendor': ['react', 'react-dom'],

            // 图表库（最大优化点 - 407kB）
            'charts-vendor': ['recharts'],

            // UI组件库
            'ui-vendor': ['lucide-react', 'framer-motion'],

            // 状态管理和数据获取
            'state-vendor': ['swr', 'zustand'],

            // 工具库
            'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
      // 增加警告阈值但仍然提醒大文件
      chunkSizeWarningLimit: 800,
    },
    define: {
      // 确保环境变量可用
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:8080'),
    },
  }
})
