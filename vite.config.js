import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.cjs', // <--- THÊM DÒNG NÀY ĐỂ CHỈ ĐỊNH FILE CẤU HÌNH
  },
})