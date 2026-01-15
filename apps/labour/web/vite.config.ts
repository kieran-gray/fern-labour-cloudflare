import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import JSON5 from 'json5';
import { defineConfig } from 'vite';
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa';
import { ViteWebfontDownload } from 'vite-plugin-webfont-dl';

function getWranglerVars(mode: string): Record<string, string> {
  const wranglerContent = readFileSync('./wrangler.jsonc', 'utf-8');
  const wrangler = JSON5.parse(wranglerContent);

  const vars =
    mode === 'development' && wrangler.env?.dev?.vars
      ? { ...wrangler.vars, ...wrangler.env.dev.vars }
      : wrangler.vars;

  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith('VITE_')) {
      define[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }
  return define;
}

// https://vitejs.dev/config/
// biome-ignore lint/style/noDefaultExport: Expected
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    eslint(),
    ViteWebfontDownload([
      'https://fonts.googleapis.com/css2?family=Poppins&family=Quicksand:wght@400;500;600;700;1000&display=swap',
    ]),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg}'],
        // Do not add API endpoints to the PWA background sync. This would conflict with the
        // existing offline sync engine (Dexie + outbox pattern) which provides sync logic
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
        ],
      },
      includeAssets: ['favicon/*.png', 'favicon/favicon.ico', 'favicon/apple-touch-icon.png'],
      manifest: {
        name: 'Fern Labour',
        short_name: 'Fern',
        description: 'Labour tracking and contraction timing app for expectant mothers',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ff7964',
        icons: [
          {
            src: '/favicon/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/favicon/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/favicon/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@base': '/src',
      '@styles': '/src/styles',
      '@components': '/src/components',
      '@lib': '/src/lib',
      '@clients': '/src/clients',
      '@home': '/src/pages/Home',
      '@hooks': '/src/hooks',
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
  },
  define: getWranglerVars(mode),
}));
