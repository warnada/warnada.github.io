import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// CSP hanya untuk build: dev server butuh skrip inline (HMR). GitHub Pages tidak bisa memberi header, jadi lewat <meta>.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: https://*.jamendo.com https://*.newjamendo.com; media-src 'self' https://*.jamendo.com https://*.newjamendo.com; font-src 'self'; connect-src 'self' https://api.jamendo.com https://*.jamendo.com https://*.newjamendo.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
const csp = (): Plugin => ({ name: 'warnada-csp', apply: 'build', transformIndexHtml: (html) => html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`) });

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 0 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  plugins: [
    react(),
    csp(),
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
