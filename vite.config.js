import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- THÊM DÒNG NÀY ĐỂ SỬA LỖI TRẮNG MÀN HÌNH
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})