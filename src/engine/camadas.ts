import type { Calculado, Camada, Dado, Insumo } from './tipos';

/** Ordem de incerteza: um valor calculado herda a camada mais incerta dos seus insumos. */
const ORDEM: Record<Camada, number> = { HISTORICO: 0, ATUAL: 1, PREVISAO: 2, SIMULADO: 3 };

export const ROTULO_CAMADA: Record<Camada, string> = {
  HISTORICO: 'HISTÓRICO',
  ATUAL: 'ATUAL',
  PREVISAO: 'PREVISÃO',
  SIMULADO: 'SIMULADO',
};

export interface Procedencia {
  /** Camadas presentes nos insumos-folha. */
  camadas: Camada[];
  /** Camada mais incerta entre os insumos. */
  dominante: Camada | null;
  /** Usa algum parâmetro "critério do grupo"? */
  usaParametro: boolean;
  /** Dados-folha distintos (para listar fontes no tooltip). */
  dados: Dado<number | string>[];
  parametros: { id: string; rotulo: string; valor: number; unidade: string }[];
}

function percorrer(insumos: Insumo[], acc: Procedencia, vistos: Set<unknown>): void {
  for (const i of insumos) {
    if (i.tipo === 'dado') {
      if (!vistos.has(i.dado)) {
        vistos.add(i.dado);
        acc.dados.push(i.dado);
        if (!acc.camadas.includes(i.dado.camada)) acc.camadas.push(i.dado.camada);
      }
    } else if (i.tipo === 'parametro') {
      acc.usaParametro = true;
      if (!acc.parametros.some((p) => p.id === i.parametro.id)) acc.parametros.push(i.parametro);
    } else {
      percorrer(i.calculado.insumos, acc, vistos);
    }
  }
}

export function procedencia(c: Calculado): Procedencia {
  const acc: Procedencia = {
    camadas: [],
    dominante: null,
    usaParametro: false,
    dados: [],
    parametros: [],
  };
  percorrer(c.insumos, acc, new Set());
  acc.camadas.sort((a, b) => ORDEM[a] - ORDEM[b]);
  acc.dominante = acc.camadas.length ? acc.camadas[acc.camadas.length - 1]! : null;
  return acc;
}

/** Rótulo do selo de um Dado, com a data do boletim na camada ATUAL e o período na PREVISÃO. */
export function rotuloSelo(d: Pick<Dado<unknown>, 'camada' | 'data_referencia' | 'fonte'>): string {
  const base = ROTULO_CAMADA[d.camada];
  if (d.camada === 'ATUAL') {
    const boletim = /boletim|aviso|defesa civil/i.test(d.fonte) ? 'boletim ' : '';
    return `${base} · ${boletim}${formatarDataCurta(d.data_referencia)}`;
  }
  if (d.camada === 'PREVISAO') return `${base} · ${formatarPeriodo(d.data_referencia)}`;
  if (d.camada === 'HISTORICO') return `${base} · ${d.data_referencia.slice(0, 4)}`;
  return base;
}

export function formatarDataCurta(iso: string): string {
  const [ini] = iso.split('/');
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(ini ?? '');
  if (!m) return /^\d{4}$/.test(ini ?? '') ? (ini as string) : iso;
  return m[3] ? `${m[3]}/${m[2]}/${m[1]}` : `${m[2]}/${m[1]}`;
}

export function formatarPeriodo(periodo: string): string {
  const [a, b] = periodo.split('/');
  if (!b) return formatarDataCurta(periodo);
  const meses = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const fa = /^(\d{4})-(\d{2})/.exec(a ?? '');
  const fb = /^(\d{4})-(\d{2})/.exec(b);
  if (!fa || !fb) return periodo;
  const ma = meses[Number(fa[2]) - 1];
  const mb = meses[Number(fb[2]) - 1];
  return fa[1] === fb[1] ? `${ma}–${mb}/${fb[1]}` : `${ma}/${fa[1]}–${mb}/${fb[1]}`;
}
