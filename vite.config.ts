import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022', sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'], globIgnores: ['**/audio/**', '**/lyrics/**', '**/catalog.json'] },
      manifest: {
        id: '/',
        name: 'Warnada',
        short_name: 'Warnada',
        description: 'Pemutar musik dengan lirik tersinkron. Bisa dipasang di HP dan diputar offline.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0D0A18',
        theme_color: '#0D0A18',
        categories: ['music', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ],
        shortcuts: [
          { name: 'Unduhan', url: '/unduhan', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Cari', url: '/cari', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] }
        ]
      },
      devOptions: { enabled: false }
    })
  ]
});
