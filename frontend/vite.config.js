// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 1. Tumhara Node.js backend (localhost:5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },

      // 2. CP specific routes (agar alag prefix chahiye)
      '/cp': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },

      // 3. Google Apps Script (sirf agar frontend se direct call kar rahe ho)
      '/script': {
        target: 'https://script.google.com/macros/s/AKfycbwdkTmYVfCCtjo8Sxlznr9_-xIowHy0TB9Hz1_y4ui3RvY0clRJTa8wsHaMEXRVY2zG/exec',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/script/, ''),
      },
    },
  },
})