/// <reference types="vitest/config" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Contagens reais do código para os Bastidores (calculadas a cada build, nada digitado à mão). */
function arquitetura() {
  const listar = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? listar(p) : [p];
    });
  const ts = ['src', 'scripts', 'api'].flatMap(listar).filter((f) => /\.tsx?$/.test(f));
  const testes = ts.filter((f) => f.endsWith('.test.ts'));
  return {
    testes: testes.reduce(
      (s, f) => s + (readFileSync(f, 'utf8').match(/^\s*it\(/gm)?.length ?? 0),
      0,
    ),
    arquivosTeste: testes.length,
    modulosMotor: listar('src/engine').filter((f) => /\.ts$/.test(f) && !f.endsWith('.test.ts'))
      .length,
    componentes3d: listar('src/three').filter((f) => f.endsWith('.tsx')).length,
    scripts: listar('scripts').filter((f) => /\.m?ts$/.test(f) && !f.endsWith('.test.ts')).length,
  };
}

/** Open Graph: a imagem precisa de URL absoluta. Na Vercel usamos o domínio de produção do projeto. */
function openGraph(): Plugin {
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? '';
  const base = dominio ? `https://${dominio}` : '';
  return {
    name: 'open-graph',
    transformIndexHtml: (html) =>
      html.replaceAll('%OG_IMAGE%', `${base}/og.jpg`).replaceAll('%OG_URL%', base || '/'),
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    openGraph(),
    // PWA: depois do primeiro acesso o app inteiro (código, dados, relevo, fontes) fica no cache e
    // funciona offline na sala; /api/niveis usa a rede primeiro e cai na última leitura salva.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Central de Comando — Solução Distribuidora · Ação Social RS',
        short_name: 'Central RS',
        description:
          'Da resposta à prontidão: operação humanitária com dados reais das cheias no RS.',
        lang: 'pt-BR',
        start_url: '/panorama',
        scope: '/',
        display: 'standalone',
        theme_color: '#102A35',
        background_color: '#0b1e26',
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icone-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,json,bin}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/niveis'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-niveis',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 4, maxAgeSeconds: 7 * 86_400 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  define: { __ARQUITETURA__: JSON.stringify(arquitetura()) },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // bibliotecas em pedaços próprios: cache longo independente do código do app
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light)[\\/]/.test(id))
            return 'graficos';
          if (/[\\/](react|react-dom|scheduler|zustand)[\\/]/.test(id)) return 'react';
          if (/[\\/]zod[\\/]/.test(id)) return 'zod';
          return undefined;
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'api/**/*.test.ts'],
    environment: 'node',
  },
});
