import { describe, expect, it } from 'vitest';
import { DADOS } from '../data/carregar';
import { inventariar } from './inventario';

describe('inventário dos Bastidores', () => {
  it('conta os Dados por camada a partir dos JSONs', () => {
    const inv = inventariar(DADOS);
    expect(inv.arquivos).toBe(Object.keys(DADOS).length);
    const soma = Object.values(inv.porCamada).reduce((a, b) => a + b, 0);
    expect(soma).toBe(inv.dados);
    expect(inv.porCamada.HISTORICO).toBeGreaterThan(0);
    expect(inv.porCamada.ATUAL).toBeGreaterThan(0);
    expect(inv.porCamada.PREVISAO).toBeGreaterThan(0);
    expect(inv.dominios).toContain('telemetriaws1.ana.gov.br');
  });

  it('não conta objetos que não são Dado', () => {
    const inv = inventariar({
      a: { valor: 1, unidade: 'm', fonte: 'x', url: 'https://ex.org/a', camada: 'ATUAL' },
      b: { lista: [{ valor: 'A CONFIRMAR', fonte: 'y', url: null, camada: 'SIMULADO' }] },
      c: { nome: 'sem camada' },
    });
    expect(inv.dados).toBe(2);
    expect(inv.aConfirmar).toBe(1);
    expect(inv.urls).toBe(1);
  });
});
