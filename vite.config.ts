import { defineConfig, type Plugin } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function makeCSSnoblocking(): Plugin {
  return {
    name: 'make-css-non-blocking',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /<link rel="stylesheet"([^>]*?)>/g,
          (_, attrs) =>
            `<link rel="preload" as="style"${attrs} onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet"${attrs}></noscript>`,
        );
      },
    },
  };
}

function sha256(content: string): string {
  return `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
}

function generateCspPlugin(): Plugin {
  return {
    name: 'generate-csp',
    apply: 'build',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const styleHashes = new Set<string>();
      const handlerHashes = new Set<string>();
      const inlineScriptHashes = new Set<string>();

      for (const page of ['index.html', 'impressum.html']) {
        let html: string;
        try {
          html = readFileSync(resolve(distDir, page), 'utf-8');
        } catch {
          continue;
        }
        for (const [, content] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
          styleHashes.add(sha256(content));
        }
        for (const [, content] of html.matchAll(/\bon\w+="([^"]*)"/g)) {
          handlerHashes.add(sha256(content));
        }
        // Hash inline <script> blocks (no src attribute, not type="module")
        for (const [, content] of html.matchAll(
          /<script(?![^>]*\bsrc\b)(?![^>]*type\s*=\s*["']module["'])[^>]*>([\s\S]*?)<\/script>/gi,
        )) {
          if (content.trim()) inlineScriptHashes.add(sha256(content));
        }
      }

      const styleSrc = [`'self'`, ...styleHashes].join(' ');

      const scriptSrcParts: string[] = [`'self'`, ...inlineScriptHashes];
      if (handlerHashes.size) scriptSrcParts.push(`'unsafe-hashes'`, ...handlerHashes);
      const scriptSrc = scriptSrcParts.join(' ');

      const csp = [
        `default-src 'self'`,
        `script-src ${scriptSrc}`,
        `style-src ${styleSrc}`,
        `img-src 'self' https://wsrv.nl https://raw.githubusercontent.com data:`,
        `connect-src 'self' https://pokeapi.co https://wsrv.nl https://*.ingest.sentry.io`,
        `worker-src 'self'`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `frame-ancestors 'none'`,
      ].join('; ');

      writeFileSync(
        resolve(distDir, '_headers'),
        `/*\n  X-Frame-Options: SAMEORIGIN\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: ${csp}\n`,
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === 'analyze'
      ? [visualizer({ open: true, filename: 'dist/stats.html', gzipSize: true, brotliSize: true })]
      : []),
    makeCSSnoblocking(),
    generateCspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      injectRegister: 'script-defer',
      manifest: false,
      devOptions: { enabled: false },
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
    modulePreload: {
      resolveDependencies(_, deps) {
        return deps.filter((dep) => !dep.includes('interaction'));
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        impressum: resolve(__dirname, 'impressum.html'),
      },
      output: {
        manualChunks(id) {
          if (/[/\\]src[/\\](overlay|keyboard|navigation|tabs)/.test(id)) return 'interaction';
        },
      },
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/types.ts',
        'src/monitoring.ts',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
}));
