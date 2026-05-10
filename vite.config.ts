import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',

    allowedHosts: true,
    proxy: {
      // In dev mode, proxy /api calls to the Express backend on port 3001
      // This means the frontend only needs to call /api/... (no full URL needed in dev)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5000,

    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
