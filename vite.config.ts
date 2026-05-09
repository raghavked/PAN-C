import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Allow all hosts — needed for sandbox proxy and Replit preview
    allowedHosts: true,
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
