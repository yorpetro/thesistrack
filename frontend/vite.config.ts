import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root
  const env = loadEnv(mode, path.resolve(process.cwd(), '../'), '');
  
  // Debug: Log the Google Client ID (remove in production)
  // console.log('Google Client ID loaded:', env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
  
  return {
    plugins: [react()],
    envDir: '../', // Look for .env files in parent directory
    define: {
      // Make specific env vars available to the frontend
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID),
    },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['thesistrack.dev', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Remove /api prefix for /api/health endpoint
          if (path === '/api/health') {
            return '/health';
          }
          // For all other API calls, keep /api/v1/...
          return path;
        }
      }
    }
  },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
  };
}); 