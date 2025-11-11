import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// ⚠️ QUAN TRỌNG: Thay đổi REPO_NAME thành tên repository GitHub của bạn
// Repository name: vnsocial
const REPO_NAME = '/vnsocial/'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Base path cho GitHub Pages
  // Development: sử dụng '/' (localhost)
  // Production: sử dụng repo name (GitHub Pages)
  base: process.env.NODE_ENV === 'production' ? REPO_NAME : '/'
})

