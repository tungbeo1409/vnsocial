import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// ⚠️ QUAN TRỌNG: Thay đổi REPO_NAME thành tên repository GitHub của bạn
// - Nếu deploy ở user page (tungbeo1409.github.io): sử dụng '/'
// - Nếu deploy ở project page (tungbeo1409.github.io/repo-name): sử dụng '/repo-name/'
const REPO_NAME = '/' // Thay đổi thành '/vnsocial/' nếu deploy ở project page

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Base path cho GitHub Pages
  // Development: sử dụng '/' (localhost)
  // Production: sử dụng repo name (GitHub Pages) hoặc '/' cho user page
  base: process.env.NODE_ENV === 'production' ? REPO_NAME : '/'
})

