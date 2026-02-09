import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // <--- DÒNG NÀY SẼ CỨU BẠN KHỎI MÀN HÌNH TRẮNG
  server: {
    port: 5173, // Cố định port để Electron biết đường mà gọi
    strictPort: true,
  }
})