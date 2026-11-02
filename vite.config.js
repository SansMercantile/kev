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
        // Precache the 3D models so the immersive classroom works fully
        // offline on first visit, not only after an online load: the Human
        // Atlas (gzip geometry chunks + catalog) and the Model X GLB are core
        // to the lessons and are version-pinned (?v=…) in the source, so a new
        // build re-fetches them. Matched here by URL prefix.
        additionalManifestEntries: [
          { url: '/models/atlas.json', revision: 'atlas-1' },
          ...Array.from({ length: 15 }, (_, i) => ({ url: `/models/body-${i}.bin.gz`, revision: 'atlas-1' })),
          { url: '/models/model-x.glb', revision: 'modelx-334' },
          { url: '/models/model-x-manifest.json', revision: 'modelx-334' },
        ],
        // 3D catalogs + fonts: cache-first, they rarely change.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
            handler: 'CacheFirst',
            // The full atlas (15 chunks + catalog) + Model X GLB + manifest
            // exceed the old 10-entry cap, which evicted chunks mid-stream.
            options: { cacheName: 'kev-models', expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 3600 } },
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
    // Vite rejects requests whose Host header is not localhost or an allowed
    // host, answering 403 "Blocked request. This host is not allowed." The
    // sandboxed preview proxies this dev server under
    // https://{port}-{sandboxId}.e2b.app, so that domain has to be permitted or
    // the preview shows a 403 instead of the app. A leading dot matches
    // subdomains, which covers the per-session sandbox id without opening the
    // server to arbitrary hosts.
    allowedHosts: ['.e2b.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Strip the `/api` prefix. The backend mounts its routes at `/xr/...`,
        // `/library/...` etc. with no `/api` prefix — that prefix only exists as
        // the browser-facing same-origin base. `vercel.json` does the same with
        // `source: "/api/:path*" -> destination: ".../:path*"`; without this the
        // proxy forwards `/api/xr/campus/floors` verbatim and FastAPI 404s.
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Upgrade WebSockets too. `xrWsUrl()` resolves a relative API base
        // against the page origin, so in dev the campus chat socket connects to
        // ws://{vite-host}/api/xr/ws/campus-chat and relies on this proxy to
        // forward the upgrade. Without `ws: true` the handshake never reaches
        // FastAPI and CampusChatSidebar sits on "Connecting to campus mesh…",
        // silently falling back to its polling path.
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    // Same reasoning as server.allowedHosts: `npm run preview` is served under
    // the sandbox preview host too, and reads its own allowlist.
    allowedHosts: ['.e2b.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Strip the `/api` prefix. The backend mounts its routes at `/xr/...`,
        // `/library/...` etc. with no `/api` prefix — that prefix only exists as
        // the browser-facing same-origin base. `vercel.json` does the same with
        // `source: "/api/:path*" -> destination: ".../:path*"`; without this the
        // proxy forwards `/api/xr/campus/floors` verbatim and FastAPI 404s.
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
      },
    },
  },
});
