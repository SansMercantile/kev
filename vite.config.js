import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Use the kev directory as root where index.html is located
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3004,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});