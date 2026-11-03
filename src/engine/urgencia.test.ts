import { describe, expect, it } from 'vitest';
import { coberturaDias, coberturaDuravel, indiceUrgencia, urgenciaItem } from './urgencia';
import { PARAMETROS_PADRAO } from './parametros';
import { procedencia } from './camadas';
import type { Dado } from './tipos';

const D = (valor: number, camada: Dado['camada'] = 'SIMULADO'): Dado => ({
  valor,
  unidade: 'u',
  fonte: 'teste',
  url: camada === 'SIMULADO' ? null : 'https://x.org',
  data_referencia: '2026-07-23',
  data_consulta: '2026-11-03',
  camada,
});

describe('Índice de Urgência', () => {
  it('cobertura_dias = estoque / (pessoas × consumo)', () => {
    expect(coberturaDias(900, 100, 3)).toBe(3);
    expect(coberturaDias(0, 100, 3)).toBe(0);
    expect(coberturaDias(10, 0, 3)).toBe(Infinity);
  });
  it('urgência = clamp(1 − cobertura/prazo, 0, 1) × peso', () => {
    expect(indiceUrgencia(0, 3, 1)).toBe(1);
    expect(indiceUrgencia(1.5, 3, 1)).toBeCloseTo(0.5);
    expect(indiceUrgencia(6, 3, 1)).toBe(0);
    expect(indiceUrgencia(1.5, 3, 0.8)).toBeCloseTo(0.4);
    expect(indiceUrgencia(Infinity, 3, 1)).toBe(0);
  });
  it('item durável: cobertura proporcional às pessoas atendidas', () => {
    expect(coberturaDuravel(50, 100, 2)).toBe(1);
    expect(coberturaDuravel(100, 100, 2)).toBe(Infinity);
  });
  it('a fase muda os pesos: higiene pesa mais com a água baixando', () => {
    const base = {
      item: 'higiene' as const,
      estoque: D(1),
      pessoas: D(100, 'ATUAL'),
      etaDias: null,
      parametros: PARAMETROS_PADRAO,
    };
    const cheia = urgenciaItem({ ...base, fase: 'cheia' });
    const baixando = urgenciaItem({ ...base, fase: 'baixando' });
    expect(baixando.urgencia.valor).toBeGreaterThan(cheia.urgencia.valor);
  });
  it('atraso na reposição reduz a cobertura na chegada e sobe a urgência', () => {
    const base = {
      item: 'agua' as const,
      estoque: D(900),
      pessoas: D(100, 'ATUAL'),
      fase: 'cheia' as const,
      parametros: PARAMETROS_PADRAO,
    };
    const sem = urgenciaItem({ ...base, etaDias: null });
    const com = urgenciaItem({
      ...base,
      etaDias: { valor: 2, unidade: 'dias', formula: 'eta', insumos: [] },
    });
    expect(sem.cobertura.valor).toBeCloseTo(3);
    expect(com.coberturaNaChegada.valor).toBeCloseTo(1);
    expect(com.urgencia.valor).toBeGreaterThan(sem.urgencia.valor);
  });
  it('a urgência carrega a procedência: estoque SIMULADO + pessoas ATUAL + parâmetros', () => {
    const u = urgenciaItem({
      item: 'agua',
      estoque: D(100),
      pessoas: D(100, 'ATUAL'),
      etaDias: null,
      fase: 'cheia',
      parametros: PARAMETROS_PADRAO,
    });
    const p = procedencia(u.urgencia);
    expect(p.camadas).toEqual(['ATUAL', 'SIMULADO']);
    expect(p.usaParametro).toBe(true);
  });
});
