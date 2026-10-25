import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // T9.3: PWA — Manifest, Service Worker mit App-Shell-Precache,
    // Daten (public/data/*.json) mit stale-while-revalidate.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['data/*.json'],
      manifest: {
        name: 'Auto-Tracker',
        short_name: 'Auto-Tracker',
        lang: 'de',
        description: 'Elektroautos vergleichen, bewerten und verfolgen',
        theme_color: '#0a0f16',
        background_color: '#0a0f16',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith(`${import.meta.env.BASE_URL}data/`) &&
              url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  base: './', // works on GitHub Pages and Netlify
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/domain/**',
        'src/scoring/**',
        'src/application/**',
        'src/validation/**',
        'src/infrastructure/**',
        'src/ui/viewmodels/rankingViewModel.ts',
      ],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
});
