/**
 * Linha de montagem na quadra: descarga → triagem → montagem → estação do bilhete → expedição.
 * Vazão de cada zona = voluntários × taxa (critério do grupo) × fator de produção (ex.: queda de energia).
 * A linha anda na velocidade da zona mais lenta (gargalo).
 */
import type { Calculado } from './tipos';
import type { IdParametro, Parametros } from './parametros';

export type Zona = 'descarga' | 'triagem' | 'montagem' | 'bilhete' | 'expedicao';
export const ZONAS: { id: Zona; nome: string; taxa: IdParametro; unidadeEntrada: string }[] = [
  { id: 'descarga', nome: 'Descarga', taxa: 'taxa_descarga', unidadeEntrada: 'caixas' },
  { id: 'triagem', nome: 'Triagem e conferência', taxa: 'taxa_triagem', unidadeEntrada: 'kits' },
  { id: 'montagem', nome: 'Montagem de kits', taxa: 'taxa_montagem', unidadeEntrada: 'kits' },
  { id: 'bilhete', nome: 'Estação do bilhete', taxa: 'taxa_bilhete', unidadeEntrada: 'kits' },
  { id: 'expedicao', nome: 'Expedição', taxa: 'taxa_expedicao', unidadeEntrada: 'kits' },
];

/** Caixas de doação que formam um kit (descarga é medida em caixas). */
export const CAIXAS_POR_KIT = 3;

export const VOLUNTARIOS_PADRAO: Record<Zona, number> = {
  descarga: 4,
  triagem: 8,
  montagem: 6,
  bilhete: 2,
  expedicao: 3,
};

export interface ResultadoProducao {
  porZona: { zona: Zona; voluntarios: number; kitsHora: number }[];
  gargalo: Zona;
  kitsHora: Calculado;
  horasParaDemanda: Calculado | null;
}

/** Fórmula pura (testada). */
export function vazaoZona(zona: Zona, voluntarios: number, p: Parametros, fator = 1): number {
  const def = ZONAS.find((z) => z.id === zona)!;
  const bruto = voluntarios * p[def.taxa] * fator;
  return zona === 'descarga' ? bruto / CAIXAS_POR_KIT : bruto;
}

export function calcularProducao(
  voluntarios: Record<Zona, number>,
  p: Parametros,
  fator: number,
  kitsDemandados: number,
): ResultadoProducao {
  const porZona = ZONAS.map((z) => ({
    zona: z.id,
    voluntarios: voluntarios[z.id],
    kitsHora: vazaoZona(z.id, voluntarios[z.id], p, fator),
  }));
  const g = porZona.reduce((a, b) => (b.kitsHora < a.kitsHora ? b : a));
  const kitsHora: Calculado = {
    valor: g.kitsHora,
    unidade: 'kits/h',
    formula: 'vazão da linha = mínimo das zonas (voluntários × taxa × fator)',
    insumos: porZona.map((z) => ({
      tipo: 'parametro' as const,
      rotulo: `Voluntários — ${z.zona}`,
      parametro: {
        id: `vol_${z.zona}`,
        rotulo: `Voluntários na ${z.zona}`,
        valor: z.voluntarios,
        unidade: 'pessoas',
      },
    })),
  };
  return {
    porZona,
    gargalo: g.zona,
    kitsHora,
    horasParaDemanda:
      g.kitsHora > 0
        ? {
            valor: kitsDemandados / g.kitsHora,
            unidade: 'h',
            formula: 'horas = kits demandados ÷ vazão da linha',
            insumos: [{ tipo: 'calculado', rotulo: 'Vazão', calculado: kitsHora }],
          }
        : null,
  };
}
