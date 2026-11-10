import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? listar(p) : [p];
  });

const tokens = Object.fromEntries(
  [
    ...readFileSync('src/styles/tokens.css', 'utf8').matchAll(
      /--color-([\w-]+):\s*(#[0-9a-f]{6})/gi,
    ),
  ].map((m) => [m[1]!, m[2]!]),
);

/** Luminância relativa e contraste da WCAG 2.1. */
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contraste = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

describe('tokens de cor', () => {
  it('nenhuma cor fica escrita fora de src/styles/tokens.css', () => {
    const arquivos = listar('src').filter(
      (f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('tokens.css') && !f.endsWith('.test.ts'),
    );
    const achados = arquivos.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .flatMap((l, i) =>
          /#[0-9a-f]{6}\b|#[0-9a-f]{8}\b|\brgba?\(\s*\d/i.test(l)
            ? [`${f}:${i + 1}: ${l.trim()}`]
            : [],
        ),
    );
    expect(achados).toEqual([]);
  });

  it('não sobrou classe da paleta antiga (navy, coral, creme, piscina)', () => {
    const achados = listar('src')
      .filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('.test.ts'))
      .filter((f) => /\b(navy|coral|creme|piscina)-\d/.test(readFileSync(f, 'utf8')));
    expect(achados).toEqual([]);
  });

  it('texto atinge contraste AA (4,5:1) sobre os fundos; alerta, atenção e ok também', () => {
    for (const fundo of ['fundo-0', 'fundo-1', 'fundo-2'])
      for (const texto of ['texto', 'texto-2', 'atencao', 'ok'])
        expect(
          contraste(tokens[texto]!, tokens[fundo]!),
          `${texto} sobre ${fundo}`,
        ).toBeGreaterThanOrEqual(4.5);
    for (const fundo of ['fundo-0', 'fundo-1'])
      expect(contraste(tokens['alerta']!, tokens[fundo]!)).toBeGreaterThanOrEqual(4.5);
    // terciário: só para texto grande e detalhes (3:1)
    expect(contraste(tokens['texto-3']!, tokens['fundo-0']!)).toBeGreaterThanOrEqual(3);
    // texto escuro sobre superfícies claras e sobre o vermelho de alerta
    expect(contraste(tokens['fundo-0']!, tokens['claro']!)).toBeGreaterThanOrEqual(7);
    expect(contraste(tokens['fundo-0']!, tokens['alerta']!)).toBeGreaterThanOrEqual(4.5);
  });
});
