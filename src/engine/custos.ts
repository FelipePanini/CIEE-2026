/**
 * Custos: frete pelo piso mínimo da ANTT, custo por família atendida, economia gerada por parceiros
 * e "prevenir vs. reagir" (estoque pré-posicionado × compra emergencial com frete urgente).
 */
import type { Calculado, Dado, Insumo } from './tipos';

export interface PisoAntt {
  eixos: number;
  ccd: Dado<number>;
  cc: Dado<number>;
}

const n = (d: Dado<number>) => (typeof d.valor === 'number' ? d.valor : 0);

/** Fórmula pura (testada): piso ANTT = km × CCD + CC. */
export const pisoFrete = (km: number, ccd: number, cc: number) => km * ccd + cc;

export function freteAntt(
  km: number,
  eixos: number,
  pisos: PisoAntt[],
  rotuloKm: Insumo,
): Calculado {
  const p =
    pisos.find((x) => x.eixos === eixos) ??
    pisos.reduce((a, b) => (Math.abs(b.eixos - eixos) < Math.abs(a.eixos - eixos) ? b : a));
  return {
    valor: pisoFrete(km, n(p.ccd), n(p.cc)),
    unidade: 'R$',
    formula: 'piso ANTT = distância (km) × CCD + CC',
    insumos: [
      rotuloKm,
      { tipo: 'dado', rotulo: `CCD ${p.eixos} eixos`, dado: p.ccd },
      { tipo: 'dado', rotulo: `CC ${p.eixos} eixos`, dado: p.cc },
    ],
  };
}

export const soma = (
  rotulo: string,
  partes: Calculado[],
  unidade = 'R$',
  formula?: string,
): Calculado => ({
  valor: partes.reduce((s, c) => s + c.valor, 0),
  unidade,
  formula: formula ?? `${rotulo} = soma das parcelas`,
  insumos: partes.map((c, i) => ({
    tipo: 'calculado' as const,
    rotulo: `${rotulo} ${i + 1}`,
    calculado: c,
  })),
});

export interface PrevenirReagir {
  prevenir: Calculado;
  reagir: Calculado;
  economia: Calculado;
}

/** Prevenir (estoque mínimo antes da cheia, frete planejado) × reagir (compra no pico, frete urgente). */
export function prevenirVsReagir(
  kits: number,
  custoKit: Calculado,
  fretePlanejado: Calculado,
  sobrepreco: number,
  fatorUrgencia: number,
): PrevenirReagir {
  const ins = (rotulo: string, c: Calculado): Insumo => ({
    tipo: 'calculado',
    rotulo,
    calculado: c,
  });
  const par = (id: string, rotulo: string, valor: number, unidade: string): Insumo => ({
    tipo: 'parametro',
    rotulo,
    parametro: { id, rotulo, valor, unidade },
  });
  const prevenir: Calculado = {
    valor: kits * custoKit.valor + fretePlanejado.valor,
    unidade: 'R$',
    formula: 'prevenir = kits × custo do kit + frete planejado (piso ANTT, caminhão cheio)',
    insumos: [ins('Custo do kit', custoKit), ins('Frete planejado', fretePlanejado)],
  };
  const reagir: Calculado = {
    valor: kits * custoKit.valor * (1 + sobrepreco) + fretePlanejado.valor * fatorUrgencia,
    unidade: 'R$',
    formula: 'reagir = kits × custo do kit × (1 + sobrepreço) + frete × multiplicador de urgência',
    insumos: [
      ins('Custo do kit', custoKit),
      ins('Frete planejado', fretePlanejado),
      par('sobrepreco_emergencial', 'Sobrepreço da compra emergencial', sobrepreco, 'fração'),
      par('fator_urgencia_frete', 'Multiplicador do frete urgente', fatorUrgencia, '×'),
    ],
  };
  return {
    prevenir,
    reagir,
    economia: {
      valor: reagir.valor - prevenir.valor,
      unidade: 'R$',
      formula: 'economia = reagir − prevenir',
      insumos: [ins('Reagir', reagir), ins('Prevenir', prevenir)],
    },
  };
}
