import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = dirname(fileURLToPath(import.meta.url));

function makeCSSnoblocking(): Plugin {
  return {
    name: 'make-css-non-blocking',
    transformIndexHtml: {
      order: 'post',
      handler(html: string): string {
        return html.replace(
          /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
          `<link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'" crossorigin href="$1">`
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [
    makeCSSnoblocking(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'auto',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/pokeapi\.co\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/(wsrv\.nl|raw\.githubusercontent\.com)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokemon-images',
              expiration: {
                maxEntries: 600,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        impressum: resolve(__dirname, 'impressum.html'),
      },
      output: {
        manualChunks: {
          vendor: ['dompurify'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**', 'src/types.ts'],
    },
  },
});
