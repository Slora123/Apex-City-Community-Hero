import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin removed as endpoint was moved to backend

export default defineConfig({
  plugins: [react()],
  envDir: '../',
  server: {
    proxy: {
      '/api/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/authority': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/issues': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/missions': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/analyze': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/users': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/leaderboard': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/stats': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/achievements': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/health': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
