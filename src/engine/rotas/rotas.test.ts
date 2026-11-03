import { describe, expect, it } from 'vitest';
import { criarGrafo, type Aresta } from './grafo';
import { dijkstra } from './dijkstra';
import { custoRota, sequenciarParadas, vizinhoMaisProximo } from './tsp2opt';

const A = (id: string, de: string, para: string, km: number): Aresta => ({
  id,
  de,
  para,
  km,
  velocidadeKmh: 60,
  via: 'BR',
});
const arestas = [
  A('ab', 'a', 'b', 10),
  A('bc', 'b', 'c', 10),
  A('ac', 'a', 'c', 50),
  A('cd', 'c', 'd', 5),
];

describe('Dijkstra', () => {
  it('acha o menor caminho', () => {
    const c = dijkstra(criarGrafo(['a', 'b', 'c', 'd'], arestas), 'a', 'd')!;
    expect(c.nos).toEqual(['a', 'b', 'c', 'd']);
    expect(c.km).toBe(25);
  });
  it('recalcula quando uma aresta é bloqueada', () => {
    const c = dijkstra(criarGrafo(['a', 'b', 'c', 'd'], arestas, new Set(['bc'])), 'a', 'd')!;
    expect(c.nos).toEqual(['a', 'c', 'd']);
    expect(c.km).toBe(55);
  });
  it('retorna null sem rota', () => {
    expect(
      dijkstra(criarGrafo(['a', 'b', 'c', 'd'], arestas, new Set(['cd'])), 'a', 'd'),
    ).toBeNull();
  });
});

describe('vizinho mais próximo + 2-opt', () => {
  // pontos numa reta: distância = |x − y|
  const pos: Record<string, number> = { d: 0, p1: 1, p2: 5, p3: 2, p4: 4 };
  const custo = (a: string, b: string) => Math.abs(pos[a]! - pos[b]!);
  it('começa e termina no depósito e visita todas as paradas', () => {
    const r = sequenciarParadas('d', ['p1', 'p2', 'p3', 'p4'], custo);
    expect(r[0]).toBe('d');
    expect(r[r.length - 1]).toBe('d');
    expect(new Set(r)).toEqual(new Set(['d', 'p1', 'p2', 'p3', 'p4']));
  });
  it('2-opt nunca piora a rota do vizinho mais próximo', () => {
    const nn = vizinhoMaisProximo('d', ['p1', 'p2', 'p3', 'p4'], custo);
    const opt = sequenciarParadas('d', ['p1', 'p2', 'p3', 'p4'], custo);
    expect(custoRota(opt, custo)).toBeLessThanOrEqual(custoRota(nn, custo));
    expect(custoRota(opt, custo)).toBe(10);
  });
});
