import { describe, expect, it } from 'vitest';
import { contarSobreposicoes, resolverColisoes, type CaixaRotulo } from './layout';

const c = (
  id: string,
  x: number,
  y: number,
  prioridade: number,
  extra: Partial<CaixaRotulo> = {},
) => ({ id, x, y, w: 100, h: 20, prioridade, distancia: 10, ...extra }) satisfies CaixaRotulo;

describe('colisão de rótulos', () => {
  it('quando dois colidem, fica o de maior prioridade', () => {
    const v = resolverColisoes([
      c('municipio', 0, 0, 5),
      c('estacao', 50, 5, 2),
      c('longe', 400, 0, 5),
    ]);
    expect([...v].sort()).toEqual(['estacao', 'longe']);
  });
  it('alerta ativo vence estação de rio, que vence município', () => {
    const v = resolverColisoes([c('m', 0, 0, 3), c('rio', 10, 0, 2), c('alerta', 20, 0, 1)]);
    expect([...v]).toEqual(['alerta']);
  });
  it('o resultado nunca tem sobreposição', () => {
    const itens = Array.from({ length: 60 }, (_, i) =>
      c(`r${i}`, (i * 37) % 500, (i * 53) % 200, 1 + (i % 5)),
    );
    const v = resolverColisoes(itens);
    expect(contarSobreposicoes(itens.filter((i) => v.has(i.id)))).toBe(0);
    expect(v.size).toBeGreaterThan(3);
  });
  it('histerese: empate de prioridade mantém quem já estava visível', () => {
    const v = resolverColisoes([
      c('novo', 0, 0, 3, { distancia: 1 }),
      c('antigo', 10, 0, 3, { distancia: 5, visivelAntes: true }),
    ]);
    expect([...v]).toEqual(['antigo']);
  });
  it('card expandido é fixo e esconde quem está embaixo', () => {
    const v = resolverColisoes([c('alerta', 0, 0, 1), c('card', 10, 0, 9, { fixo: true })]);
    expect([...v]).toEqual(['card']);
  });
});
