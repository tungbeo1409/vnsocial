import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Chỉ dùng base path khi build production (cho GitHub Pages)
  // Khi dev local, để base: '/' hoặc không set
  base: process.env.NODE_ENV === 'production' ? '/News/' : '/'
})

