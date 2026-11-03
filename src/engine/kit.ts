/**
 * Kit família padronizado (critério do grupo): 1 kit = 1 família de N pessoas por D dias.
 * As quantidades por pessoa/dia vêm do Manual Esfera; os preços, do DIEESE (alimentos) e do
 * catálogo online de um atacado (higiene, limpeza, água).
 */
import type { Calculado, Dado, Insumo } from './tipos';
import type { IdItem } from './urgencia';

export interface LinhaKit {
  produto: string;
  /** Quantidade na unidade de preço do produto (kg, L, pacote…). */
  qtd: (pessoas: number, dias: number) => number;
  /** Quanto essa linha repõe de cada item do índice de urgência. */
  repoe: Partial<Record<IdItem, (pessoas: number, dias: number) => number>>;
  /** Gramas (ou mL) por unidade de preço, para somar kcal com a TACO. */
  gramasPorUnidade?: number;
  idNutricao?: string;
}

const pd = (p: number, d: number) => p * d;

/** Composição do kit (critério do grupo, ajustável). */
export const COMPOSICAO: LinhaKit[] = [
  // Água: 3 L/pessoa/dia (Esfera, beber) → galões de 5 L
  {
    produto: 'agua5l',
    qtd: (p, d) => Math.ceil((pd(p, d) * 3) / 5),
    repoe: { agua: (p, d) => Math.ceil((pd(p, d) * 3) / 5) * 5 },
  },
  // Alimentos: ~2.100 kcal/pessoa/dia (Esfera)
  {
    produto: 'arroz',
    qtd: (p, d) => +(pd(p, d) * 0.2).toFixed(1),
    repoe: { alimentos: (p, d) => pd(p, d) },
    gramasPorUnidade: 1000,
    idNutricao: 'arroz',
  },
  {
    produto: 'feijao',
    qtd: (p, d) => +(pd(p, d) * 0.1).toFixed(1),
    repoe: {},
    gramasPorUnidade: 1000,
    idNutricao: 'feijao',
  },
  {
    produto: 'farinha',
    qtd: (p, d) => +(pd(p, d) * 0.1).toFixed(1),
    repoe: {},
    gramasPorUnidade: 1000,
    idNutricao: 'farinha',
  },
  {
    produto: 'oleo',
    qtd: (p, d) => Math.max(1, Math.ceil((pd(p, d) * 0.04) / 0.9)),
    repoe: {},
    gramasPorUnidade: 828,
    idNutricao: 'oleo',
  },
  {
    produto: 'acucar',
    qtd: (p, d) => +(pd(p, d) * 0.06).toFixed(1),
    repoe: {},
    gramasPorUnidade: 1000,
    idNutricao: 'acucar',
  },
  {
    produto: 'leite',
    qtd: (p, d) => Math.ceil(pd(p, d) * 0.25),
    repoe: {},
    gramasPorUnidade: 1000,
    idNutricao: 'leite',
  },
  { produto: 'cafe', qtd: (p, d) => +(pd(p, d) * 0.015).toFixed(2), repoe: {} },
  // Higiene (Esfera: 250 g de sabonete e 200 g de sabão por pessoa/mês)
  {
    produto: 'sabonete',
    qtd: (p, d) => Math.max(1, Math.ceil((p * 250 * d) / 30 / 85)),
    repoe: { higiene: (p, d) => (p * d) / 30 },
  },
  { produto: 'sabao_barra', qtd: (p, d) => +((p * 200 * d) / 30 / 800).toFixed(2), repoe: {} },
  { produto: 'creme_dental', qtd: () => 0.25, repoe: {} },
  { produto: 'escova', qtd: (p) => Math.ceil(p / 2), repoe: {} },
  { produto: 'absorvente', qtd: () => 1, repoe: {} },
  {
    produto: 'papel_higienico',
    qtd: (p, d) => +((pd(p, d) * 0.25) / 12).toFixed(2),
    repoe: { papel_roupas: (p, d) => pd(p, d) * 0.25 },
  },
  { produto: 'agua_sanitaria', qtd: () => 1, repoe: {} },
];

export interface ResultadoKit {
  linhas: { produto: string; qtd: number; preco: Dado<number> | null; subtotal: number | null }[];
  custo: Calculado;
  custoPorPessoaDia: Calculado;
  kcalPessoaDia: Calculado;
  repoe: Record<IdItem, number>;
  pendencias: string[];
}

export function calcularKit(
  precos: Map<string, Dado<number>>,
  kcal: Map<string, Dado<number>>,
  pessoas: number,
  dias: number,
): ResultadoKit {
  const linhas: ResultadoKit['linhas'] = [];
  const insumos: Insumo[] = [];
  const pendencias: string[] = [];
  let total = 0;
  let kcalTotal = 0;
  const insumosKcal: Insumo[] = [];
  const repoe: Record<IdItem, number> = {
    agua: 0,
    alimentos: 0,
    higiene: 0,
    cobertores: 0,
    papel_roupas: 0,
  };
  for (const l of COMPOSICAO) {
    const qtd = l.qtd(pessoas, dias);
    const preco = precos.get(l.produto) ?? null;
    const valor = preco && typeof preco.valor === 'number' ? preco.valor : null;
    const subtotal = valor === null ? null : qtd * valor;
    if (subtotal === null) pendencias.push(l.produto);
    else total += subtotal;
    if (preco) insumos.push({ tipo: 'dado', rotulo: l.produto, dado: preco });
    linhas.push({ produto: l.produto, qtd, preco, subtotal });
    for (const [item, f] of Object.entries(l.repoe) as [IdItem, (p: number, d: number) => number][])
      repoe[item] += f(pessoas, dias);
    if (l.idNutricao && l.gramasPorUnidade) {
      const k = kcal.get(l.idNutricao);
      if (k && typeof k.valor === 'number') {
        kcalTotal += (qtd * l.gramasPorUnidade * k.valor) / 100;
        insumosKcal.push({ tipo: 'dado', rotulo: `kcal ${l.idNutricao}`, dado: k });
      }
    }
  }
  insumos.push({
    tipo: 'parametro',
    rotulo: 'Família de referência',
    parametro: {
      id: 'familia_ref',
      rotulo: 'Família de referência',
      valor: pessoas,
      unidade: 'pessoas',
    },
  });
  insumos.push({
    tipo: 'parametro',
    rotulo: 'Dias por kit',
    parametro: { id: 'dias_kit', rotulo: 'Dias cobertos por kit', valor: dias, unidade: 'dias' },
  });
  const custo: Calculado = {
    valor: total,
    unidade: 'R$',
    formula: 'custo do kit = Σ quantidade × preço (DIEESE e catálogo online)',
    insumos,
  };
  return {
    linhas,
    custo,
    custoPorPessoaDia: {
      valor: total / Math.max(1, pessoas * dias),
      unidade: 'R$',
      formula: 'custo por pessoa/dia = custo do kit ÷ (pessoas × dias)',
      insumos: [{ tipo: 'calculado', rotulo: 'Custo do kit', calculado: custo }],
    },
    kcalPessoaDia: {
      valor: kcalTotal / Math.max(1, pessoas * dias),
      unidade: 'kcal/pessoa/dia',
      formula:
        'kcal = Σ gramas × kcal/100 g (TACO) ÷ (pessoas × dias); itens sem valor TACO confirmado não entram',
      insumos: insumosKcal,
    },
    repoe,
    pendencias,
  };
}
