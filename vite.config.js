import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Use the kev directory as root where index.html is located
  root: __dirname,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['kev-logo.svg', 'kev-logo.png'],
      manifest: {
        name: 'KEV - XR Online School & Virtual Labs',
        short_name: 'KEV',
        description: 'Immersive 3D science labs, XR campus, tutors, and curriculum — online and offline.',
        theme_color: '#0b1830',
        background_color: '#020617',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/kev-logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/kev-logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // SPA shell: stale app still boots with zero network.
        navigateFallback: 'index.html',
        // 3D catalogs + fonts: cache-first, they rarely change.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
            handler: 'CacheFirst',
            options: { cacheName: 'kev-models', expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 3600 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'kev-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 3600 } },
          },
          {
            // API reads: fresh when online, last-good copy when not.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'kev-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 24 * 3600 },
            },
          },
          {
            // Queued chat posts replay automatically when back online.
            urlPattern: ({ url }) => url.pathname.endsWith('/xr/campus/chat/send'),
            handler: 'NetworkOnly',
            method: 'POST',
            options: {
              backgroundSync: { name: 'kev-chat-outbox', options: { maxRetentionTime: 24 * 60 } },
            },
          },
        ],
      },
    }),
  ],
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
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
