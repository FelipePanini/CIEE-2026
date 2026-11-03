import { describe, expect, it } from 'vitest';
import { formatarPeriodo, procedencia, rotuloSelo } from './camadas';
import type { Calculado, Dado } from './tipos';

const dado = (camada: Dado['camada'], fonte = 'Fonte X'): Dado => ({
  valor: 1,
  unidade: 'u',
  fonte,
  url: 'https://exemplo.org',
  data_referencia: '2026-07-23',
  data_consulta: '2026-11-03',
  camada,
});

describe('camadas', () => {
  it('selo ATUAL mostra a data do boletim da Defesa Civil', () => {
    expect(rotuloSelo(dado('ATUAL', 'Defesa Civil RS — boletim'))).toBe(
      'ATUAL · boletim 23/07/2026',
    );
    expect(rotuloSelo(dado('ATUAL', 'DIEESE'))).toBe('ATUAL · 23/07/2026');
  });
  it('selo PREVISÃO mostra o período coberto', () => {
    expect(formatarPeriodo('2026-10-01/2026-12-31')).toBe('out–dez/2026');
  });
  it('valor calculado herda a camada mais incerta e lista parâmetros', () => {
    const c: Calculado = {
      valor: 2,
      unidade: 'dias',
      formula: 'f',
      insumos: [
        { tipo: 'dado', rotulo: 'a', dado: dado('HISTORICO') },
        {
          tipo: 'calculado',
          rotulo: 'b',
          calculado: {
            valor: 1,
            unidade: 'u',
            formula: 'g',
            insumos: [{ tipo: 'dado', rotulo: 'c', dado: dado('SIMULADO') }],
          },
        },
        {
          tipo: 'parametro',
          rotulo: 'p',
          parametro: { id: 'p', rotulo: 'p', valor: 3, unidade: 'd' },
        },
      ],
    };
    const p = procedencia(c);
    expect(p.camadas).toEqual(['HISTORICO', 'SIMULADO']);
    expect(p.dominante).toBe('SIMULADO');
    expect(p.usaParametro).toBe(true);
  });
});
