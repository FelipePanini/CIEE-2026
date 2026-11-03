/**
 * Tipos centrais da Central de Comando.
 *
 * Regra nº 1: todo número exibido vem de um `Dado` (com fonte, url, datas e camada),
 * de um `Parametro` (critério do grupo, editável) ou de um `Calculado` (que carrega
 * a procedência dos insumos). Nada de número solto na interface.
 */

export const CAMADAS = ['HISTORICO', 'ATUAL', 'PREVISAO', 'SIMULADO'] as const;
export type Camada = (typeof CAMADAS)[number];

export const A_CONFIRMAR = 'A CONFIRMAR' as const;
export type ACONFIRMAR = typeof A_CONFIRMAR;

export interface Dado<T = number> {
  valor: T | ACONFIRMAR;
  unidade: string;
  /** Ex.: "Defesa Civil RS — boletim 23/07/2026" */
  fonte: string;
  /** Obrigatório fora da camada SIMULADO. */
  url: string | null;
  /** Data (AAAA-MM-DD), data-hora ISO ou período "AAAA-MM-DD/AAAA-MM-DD". */
  data_referencia: string;
  /** Data em que a fonte foi consultada (AAAA-MM-DD). */
  data_consulta: string;
  camada: Camada;
  nota?: string;
  /** Fontes adicionais que corroboram o número. */
  confirmacoes?: { fonte: string; url: string }[];
}

/** Parâmetro de modelagem decidido pelo grupo (editável no painel de configuração). */
export interface Parametro {
  id: string;
  rotulo: string;
  valor: number;
  unidade: string;
  descricao: string;
  /** Faixa permitida no controle deslizante. */
  min: number;
  max: number;
  passo: number;
  /** Referência real que embasou o critério (ex.: Manual Esfera). */
  referencia?: Dado;
}

/** Insumo de um valor calculado: aponta para um Dado, um Parametro ou outro Calculado. */
export type Insumo =
  | { tipo: 'dado'; rotulo: string; dado: Dado<number | string> }
  | {
      tipo: 'parametro';
      rotulo: string;
      parametro: Pick<Parametro, 'id' | 'rotulo' | 'valor' | 'unidade'>;
    }
  | { tipo: 'calculado'; rotulo: string; calculado: Calculado };

/** Número derivado pelo motor. A camada exibida é a dos insumos (ver camadas.ts). */
export interface Calculado {
  valor: number;
  unidade: string;
  formula: string;
  insumos: Insumo[];
}

export type Valor = Dado<number> | Calculado;

export const ehDado = (v: unknown): v is Dado<unknown> =>
  typeof v === 'object' && v !== null && 'camada' in v && 'fonte' in v && 'valor' in v;

export const ehCalculado = (v: unknown): v is Calculado =>
  typeof v === 'object' && v !== null && 'formula' in v && 'insumos' in v;

export const numero = (d: Dado<number> | Calculado | undefined | null): number | null => {
  if (!d) return null;
  return typeof d.valor === 'number' ? d.valor : null;
};
