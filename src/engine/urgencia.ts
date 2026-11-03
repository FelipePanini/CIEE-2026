/**
 * Índice de Urgência por item e por abrigo.
 *
 *   cobertura_dias = estoque / (pessoas_abrigadas × consumo_pessoa_dia)
 *   cobertura_na_chegada = max(0, cobertura_dias − ETA da próxima reposição)
 *   urgencia = clamp(1 − cobertura_na_chegada / prazo_critico_dias, 0, 1) × peso_criticidade(fase)
 *
 * Itens duráveis (cobertores): a "cobertura" é a fração das pessoas que já têm o item,
 * convertida em dias equivalentes (fração × prazo), para usar a mesma escala.
 */
import type { Calculado, Dado, Insumo } from './tipos';
import { comoInsumo, type IdParametro, type Parametros } from './parametros';

export type Fase = 'prontidao' | 'cheia' | 'baixando';
export const FASES: { id: Fase; rotulo: string; descricao: string }[] = [
  {
    id: 'prontidao',
    rotulo: 'Prontidão',
    descricao: 'Sem cheia ativa: estoque estratégico pré-posicionado.',
  },
  { id: 'cheia', rotulo: 'Cheia ativa', descricao: 'Água, cobertores e alimentos primeiro.' },
  {
    id: 'baixando',
    rotulo: 'Água baixando',
    descricao: 'Higiene, limpeza e prevenção de leptospirose sobem.',
  },
];

export type IdItem = 'agua' | 'alimentos' | 'higiene' | 'cobertores' | 'papel_roupas';

export interface DefItem {
  id: IdItem;
  nome: string;
  unidade: string;
  tipo: 'consumivel' | 'duravel';
  consumo?: IdParametro;
  prazo: IdParametro;
  pesos: Record<Fase, number>;
  /** Frase humana para o estoque. */
  humano: (estoque: number) => string;
}

export const ITENS: DefItem[] = [
  {
    id: 'agua',
    nome: 'Água potável',
    unidade: 'L',
    tipo: 'consumivel',
    consumo: 'consumo_agua_l',
    prazo: 'prazo_agua',
    pesos: { prontidao: 0.9, cheia: 1.0, baixando: 0.9 },
    humano: (e) => `${Math.round(e / 5)} galões de 5 L`,
  },
  {
    id: 'alimentos',
    nome: 'Alimentos',
    unidade: 'rações (2.100 kcal)',
    tipo: 'consumivel',
    consumo: 'consumo_racao',
    prazo: 'prazo_alimentos',
    pesos: { prontidao: 0.9, cheia: 0.8, baixando: 0.7 },
    humano: (e) => `${Math.round(e)} refeições-dia completas`,
  },
  {
    id: 'higiene',
    nome: 'Higiene e limpeza',
    unidade: 'kits pessoa-mês',
    tipo: 'consumivel',
    consumo: 'consumo_higiene_kit',
    prazo: 'prazo_higiene',
    pesos: { prontidao: 0.5, cheia: 0.6, baixando: 0.8 },
    humano: (e) => `${Math.round(e)} kits de higiene`,
  },
  {
    id: 'cobertores',
    nome: 'Cobertores e colchões',
    unidade: 'un',
    tipo: 'duravel',
    prazo: 'prazo_cobertores',
    pesos: { prontidao: 0.5, cheia: 0.7, baixando: 0.5 },
    humano: (e) => `${Math.round(e)} cobertores`,
  },
  {
    id: 'papel_roupas',
    nome: 'Papel higiênico e roupas',
    unidade: 'rolos',
    tipo: 'consumivel',
    consumo: 'consumo_papel_rolo',
    prazo: 'prazo_papel',
    pesos: { prontidao: 0.2, cheia: 0.3, baixando: 0.4 },
    humano: (e) => `${Math.round(e)} rolos`,
  },
];

export const itemPorId = (id: IdItem): DefItem => ITENS.find((i) => i.id === id)!;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Fórmula pura (testada): dias de cobertura de um item consumível. */
export function coberturaDias(estoque: number, pessoas: number, consumoPessoaDia: number): number {
  if (pessoas <= 0 || consumoPessoaDia <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, estoque) / (pessoas * consumoPessoaDia);
}

/** Fórmula pura (testada): dias equivalentes de um item durável (1 por pessoa). */
export function coberturaDuravel(estoque: number, pessoas: number, prazo: number): number {
  if (pessoas <= 0) return Number.POSITIVE_INFINITY;
  const fracao = Math.max(0, estoque) / pessoas;
  return fracao >= 1 ? Number.POSITIVE_INFINITY : fracao * prazo;
}

/** Fórmula pura (testada): índice de urgência 0–1. */
export function indiceUrgencia(cobertura: number, prazo: number, peso: number): number {
  if (!Number.isFinite(cobertura)) return 0;
  return clamp(1 - cobertura / prazo, 0, 1) * peso;
}

export interface UrgenciaItem {
  item: IdItem;
  estoque: number;
  cobertura: Calculado;
  coberturaNaChegada: Calculado;
  urgencia: Calculado;
  critico: boolean;
  prazo: number;
  /** Quanto falta para chegar ao prazo crítico (na unidade do item). */
  deficit: number;
}

export interface EntradaUrgencia {
  item: IdItem;
  estoque: Dado<number>;
  pessoas: Dado<number> | Calculado;
  etaDias: Calculado | null;
  fase: Fase;
  parametros: Parametros;
  pesos?: Partial<Record<IdItem, Partial<Record<Fase, number>>>>;
}

const num = (d: Dado<number> | Calculado): number => (typeof d.valor === 'number' ? d.valor : 0);
const insumoDe = (rotulo: string, d: Dado<number> | Calculado): Insumo =>
  'formula' in d ? { tipo: 'calculado', rotulo, calculado: d } : { tipo: 'dado', rotulo, dado: d };

export function urgenciaItem(e: EntradaUrgencia): UrgenciaItem {
  const def = itemPorId(e.item);
  const prazo = e.parametros[def.prazo];
  const peso = e.pesos?.[e.item]?.[e.fase] ?? def.pesos[e.fase];
  const pessoas = num(e.pessoas);
  const estoque = num(e.estoque);
  const consumo = def.consumo ? e.parametros[def.consumo] : 1;

  const cob =
    def.tipo === 'duravel'
      ? coberturaDuravel(estoque, pessoas, prazo)
      : coberturaDias(estoque, pessoas, consumo);
  const insumosCob: Insumo[] = [
    insumoDe('Estoque', e.estoque),
    insumoDe('Pessoas abrigadas', e.pessoas),
    ...(def.consumo ? [comoInsumo(def.consumo, consumo)] : [comoInsumo(def.prazo, prazo)]),
  ];
  const cobertura: Calculado = {
    valor: Number.isFinite(cob) ? cob : 999,
    unidade: 'dias',
    formula:
      def.tipo === 'duravel'
        ? 'cobertura = min(estoque ÷ pessoas, 1) × prazo crítico'
        : 'cobertura_dias = estoque ÷ (pessoas × consumo por pessoa/dia)',
    insumos: insumosCob,
  };
  const eta = e.etaDias ? e.etaDias.valor : 0;
  const cobChegada = Number.isFinite(cob) ? Math.max(0, cob - eta) : cob;
  const coberturaNaChegada: Calculado = {
    valor: Number.isFinite(cobChegada) ? cobChegada : 999,
    unidade: 'dias',
    formula: 'cobertura na chegada = cobertura − tempo até a próxima reposição (rota)',
    insumos: [
      { tipo: 'calculado', rotulo: 'Cobertura', calculado: cobertura },
      ...(e.etaDias
        ? [{ tipo: 'calculado' as const, rotulo: 'ETA da rota', calculado: e.etaDias }]
        : []),
    ],
  };
  const u = indiceUrgencia(cobChegada, prazo, peso);
  const urgencia: Calculado = {
    valor: u,
    unidade: 'índice 0–1',
    formula: 'urgência = clamp(1 − cobertura ÷ prazo crítico, 0, 1) × peso(fase)',
    insumos: [
      { tipo: 'calculado', rotulo: 'Cobertura na chegada', calculado: coberturaNaChegada },
      comoInsumo(def.prazo, prazo),
      {
        tipo: 'parametro',
        rotulo: `Peso — ${def.nome} (${e.fase})`,
        parametro: {
          id: `peso_${def.id}_${e.fase}`,
          rotulo: `Peso de criticidade (${e.fase})`,
          valor: peso,
          unidade: '×',
        },
      },
    ],
  };
  const necessario = def.tipo === 'duravel' ? pessoas : pessoas * consumo * (prazo + eta);
  return {
    item: e.item,
    estoque,
    cobertura,
    coberturaNaChegada,
    urgencia,
    critico: Number.isFinite(cobChegada) && cobChegada < prazo,
    prazo,
    deficit: Math.max(0, necessario - estoque),
  };
}
