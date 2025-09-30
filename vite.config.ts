import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/stores': resolve(__dirname, './src/stores')
    }
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: ['electron', 'better-sqlite3', 'drizzle-orm'],
    },
  },
  optimizeDeps: {
    exclude: ['electron', 'better-sqlite3', 'drizzle-orm'],
  }
})
