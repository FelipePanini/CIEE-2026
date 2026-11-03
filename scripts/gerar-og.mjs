/**
 * npm run gerar-og — gera public/og.jpg (1200×630) com o MESMO gerador do card do LinkedIn,
 * a partir do app já compilado (npm run build && npx vite preview --port 4173 em outro terminal).
 * Usa o Playwright (npx playwright install chromium, se ainda não tiver).
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Playwright pode estar instalado globalmente (fora do package.json): require resolve via NODE_PATH
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] ?? 'http://localhost:4173';
const b = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${base}/panorama`, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__cc3d?.renderers === 1, null, { timeout: 30_000 });
await p.evaluate(() => window.__ccStore.getState().setPainelRecolhido(true));
await p.waitForTimeout(6000);
const url = await p.evaluate(() => window.__ccCard(1200, 630, 'image/jpeg'));
writeFileSync('public/og.jpg', Buffer.from(url.split(',')[1], 'base64'));
console.log('✓ public/og.jpg');
await b.close();
