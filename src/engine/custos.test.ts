import { describe, expect, it } from 'vitest';
import { pisoFrete, prevenirVsReagir } from './custos';
import { vazaoZona, calcularProducao } from './producao';
import { PARAMETROS_PADRAO } from './parametros';

describe('custos', () => {
  it('piso ANTT = km × CCD + CC (Res. 6.076/2026, carga geral, 3 eixos)', () => {
    expect(pisoFrete(100, 4.7062, 523.33)).toBeCloseTo(994.0, 1);
  });
  it('prevenir custa menos que reagir quando há sobrepreço e frete urgente', () => {
    const kit = { valor: 200, unidade: 'R$', formula: 'k', insumos: [] };
    const frete = { valor: 1000, unidade: 'R$', formula: 'f', insumos: [] };
    const r = prevenirVsReagir(100, kit, frete, 0.2, 1.5);
    expect(r.prevenir.valor).toBe(21000);
    expect(r.reagir.valor).toBe(25500);
    expect(r.economia.valor).toBe(4500);
  });
});

describe('produção', () => {
  it('a linha anda na velocidade do gargalo', () => {
    const v = { descarga: 4, triagem: 8, montagem: 6, bilhete: 2, expedicao: 3 };
    const r = calcularProducao(v, PARAMETROS_PADRAO, 1, 96);
    const min = Math.min(...r.porZona.map((z) => z.kitsHora));
    expect(r.kitsHora.valor).toBe(min);
    expect(r.porZona.find((z) => z.zona === r.gargalo)!.kitsHora).toBe(min);
    expect(r.horasParaDemanda!.valor).toBeCloseTo(96 / min);
  });
  it('queda de energia (fator 0,6) reduz a vazão', () => {
    expect(vazaoZona('montagem', 6, PARAMETROS_PADRAO, 0.6)).toBeCloseTo(
      6 * PARAMETROS_PADRAO.taxa_montagem * 0.6,
    );
  });
});
