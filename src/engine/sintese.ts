/**
 * Panorama em 5 segundos: frase-síntese, KPIs e "o que mudou", todos derivados dos dados.
 * Funções puras. Cada número sai junto com o seu Dado (ou Calculado), então a tela mostra a fonte.
 */
import type { Dados } from '../data/carregar';
import type { Resultado } from './simulacao';
import { A_CONFIRMAR, type Calculado, type Dado } from './tipos';

const num = (d: { valor: unknown } | undefined | null): number | null =>
  d && typeof d.valor === 'number' ? d.valor : null;

export interface Trecho {
  /** texto antes do número */
  antes: string;
  dado?: Dado<number> | Calculado;
  /** como escrever o número */
  formato?: 'int' | 'm' | 'mm' | 'pct';
  depois: string;
  tom?: 'alerta' | 'ok';
}

type Evento = Dados['eventos']['eventos'][number];
export const eventoPorId = (d: Dados, id: string | null): Evento | null =>
  d.eventos.eventos.find((e) => e.id === id) ?? null;
export const eventoAnterior = (d: Dados, id: string | null): Evento | null => {
  const i = d.eventos.eventos.findIndex((e) => e.id === id);
  return i > 0 ? d.eventos.eventos[i - 1]! : null;
};

/** Pessoas fora de casa no evento: dado do boletim, ou desabrigados + desalojados. */
export function foraDeCasa(ev: Evento): Dado<number> | Calculado | null {
  const direto = ev.indicadores.fora_de_casa;
  if (direto && num(direto) !== null) return direto;
  const a = ev.indicadores.desabrigados;
  const b = ev.indicadores.desalojados;
  if (num(a) === null || num(b) === null) return null;
  return {
    valor: num(a)! + num(b)!,
    unidade: 'pessoas',
    formula: 'fora de casa = desabrigados + desalojados',
    insumos: [
      { tipo: 'dado', rotulo: 'Desabrigados', dado: a },
      { tipo: 'dado', rotulo: 'Desalojados', dado: b },
    ],
  };
}

/** Folga de cada rio em relação à cota de inundação (negativa = acima da cota). */
export function folgaDosRios(
  d: Dados,
  r: Resultado,
  reais?: Partial<Record<string, Dado<number>>>,
) {
  return d.rios.estacoes.flatMap((est) => {
    const cota = num(est.cota_inundacao);
    const nivel = r.niveis[est.id];
    if (cota === null || nivel === undefined) return [];
    const real = reais?.[est.id] ?? est.nivel_atual;
    const simulado = Math.abs(nivel - (num(real) ?? nivel)) > 0.005;
    const folga: Calculado = {
      valor: Math.round((cota - nivel) * 100) / 100,
      unidade: 'm',
      formula: simulado
        ? 'folga = cota de inundação − nível simulado no painel'
        : 'folga = cota de inundação − nível atual (ANA)',
      insumos: [
        { tipo: 'dado', rotulo: 'Cota de inundação', dado: est.cota_inundacao },
        { tipo: 'dado', rotulo: 'Nível atual (ANA)', dado: real },
      ],
    };
    return [{ estacao: est.id, rio: est.rio, nivel, cota, folga, simulado }];
  });
}

export function riosAcimaDaCota(d: Dados, r: Resultado): Calculado {
  const f = folgaDosRios(d, r);
  return {
    valor: f.filter((x) => x.folga.valor <= 0).length,
    unidade: `de ${f.length} réguas`,
    formula: 'réguas com nível ≥ cota de inundação',
    insumos: f.map((x) => ({ tipo: 'calculado' as const, rotulo: x.rio, calculado: x.folga })),
  };
}

export function abrigosAtivos(r: Resultado): Calculado {
  const ativos = r.locais.filter((l) => l.pessoasN > 0);
  return {
    valor: ativos.length,
    unidade: 'abrigos e quadras',
    formula: 'locais da operação com pessoas abrigadas no cenário',
    insumos: ativos
      .slice(0, 6)
      .map((l) => ({
        tipo: 'dado' as const,
        rotulo: l.nome,
        dado: l.pessoas as Dado<number>,
      }))
      .filter((i) => 'camada' in i.dado),
  };
}

/** Frase-síntese: rio mais perto da cota · pessoas · previsão. */
export function fraseSintese(
  d: Dados,
  r: Resultado,
  eventoId: string | null,
  reais?: Partial<Record<string, Dado<number>>>,
): Trecho[] {
  const trechos: Trecho[] = [];
  const rios = folgaDosRios(d, r, reais).sort((a, b) => a.folga.valor - b.folga.valor);
  const rio = rios[0];
  if (rio) {
    const acima = rio.folga.valor <= 0;
    trechos.push({
      antes: `${rio.rio} `,
      dado: { ...rio.folga, valor: Math.abs(rio.folga.valor) },
      formato: 'm',
      depois: ` ${acima ? 'acima' : 'abaixo'} da cota${rio.simulado ? ' (nível simulado)' : ''}`,
      tom: acima ? 'alerta' : undefined,
    });
  }
  const ev = eventoPorId(d, eventoId);
  if (ev) {
    const abrigados = ev.indicadores.desabrigados;
    const fora = foraDeCasa(ev);
    if (num(abrigados) !== null)
      trechos.push({
        antes: '',
        dado: abrigados,
        formato: 'int',
        depois: ` pessoas em abrigos (${ev.rotulo_curto})`,
      });
    else if (fora)
      trechos.push({
        antes: '',
        dado: fora,
        formato: 'int',
        depois: ` pessoas fora de casa (${ev.rotulo_curto})`,
      });
    else trechos.push({ antes: `desabrigados de ${ev.rotulo_curto}: ${A_CONFIRMAR}`, depois: '' });
  } else {
    trechos.push({
      antes: 'nenhuma cheia ativa; estoque pré-posicionado para o pior caso',
      depois: '',
    });
  }
  const chuva = d.previsao.prognosticos
    .flatMap((p) => p.indicadores)
    .find((i) => i.dado.unidade === 'mm' && num(i.dado) !== null);
  if (chuva)
    trechos.push({
      antes: 'chuva até ',
      dado: chuva.dado as Dado<number>,
      formato: 'mm',
      depois: ' acima da média prevista até dezembro',
    });
  return trechos;
}

export interface Mudanca {
  rotulo: string;
  de: Dado<number> | Calculado | null;
  para: Dado<number> | Calculado | null;
  /** variação relativa (−0,24 = caiu 24%); null quando falta um dos lados */
  variacao: number | null;
  nota?: string;
}

/** O que mudou do evento/boletim anterior para o atual. */
export function mudancas(
  d: Dados,
  eventoId: string | null,
): { de: string; para: string; itens: Mudanca[] } | null {
  const atual = eventoPorId(d, eventoId);
  const antes = eventoAnterior(d, eventoId);
  if (!atual || !antes) return null;
  const par = (
    rotulo: string,
    a: Dado<number> | Calculado | null | undefined,
    b: Dado<number> | Calculado | null | undefined,
  ): Mudanca => {
    const va = num(a);
    const vb = num(b);
    return {
      rotulo,
      de: a ?? null,
      para: b ?? null,
      variacao: va !== null && vb !== null && va !== 0 ? (vb - va) / va : null,
    };
  };
  const picoMax = (ev: Evento, est: string) =>
    ev.picos
      .filter((p) => p.estacao === est)
      .sort((x, y) => (num(y.nivel) ?? 0) - (num(x.nivel) ?? 0))[0]?.nivel ?? null;
  return {
    de: antes.rotulo_curto,
    para: atual.rotulo_curto,
    itens: [
      par(
        'Municípios afetados',
        antes.indicadores.municipios_afetados,
        atual.indicadores.municipios_afetados,
      ),
      par('Desabrigados', antes.indicadores.desabrigados, atual.indicadores.desabrigados),
      par('Pessoas fora de casa', foraDeCasa(antes), foraDeCasa(atual)),
      ...d.rios.estacoes.map((e) =>
        par(`Pico do ${e.rio}`, picoMax(antes, e.id), picoMax(atual, e.id)),
      ),
    ],
  };
}

/** Série de um indicador ao longo dos eventos (para os mini gráficos); A CONFIRMAR vira null. */
export function seriePorEvento(
  d: Dados,
  valor: (ev: Evento) => number | null,
): { rotulo: string; v: number | null }[] {
  return d.eventos.eventos.map((e) => ({ rotulo: e.rotulo_curto, v: valor(e) }));
}

export interface MunicipioCritico {
  ibge: number;
  lat: number;
  lon: number;
  urgencia: number;
  pessoas: number;
  locais: number;
  item: string;
}

/** Municípios mais críticos da operação: maior urgência entre os abrigos, depois mais pessoas. */
export function municipiosCriticos(r: Resultado, n = 5): MunicipioCritico[] {
  const g = new Map<number, MunicipioCritico>();
  for (const l of r.locais) {
    if (l.pessoasN <= 0) continue;
    const m = g.get(l.municipio) ?? {
      ibge: l.municipio,
      lat: 0,
      lon: 0,
      urgencia: -1,
      pessoas: 0,
      locais: 0,
      item: l.itemMaisUrgente,
    };
    m.lat += l.lat;
    m.lon += l.lon;
    m.locais += 1;
    m.pessoas += l.pessoasN;
    if (l.urgenciaMax > m.urgencia) {
      m.urgencia = l.urgenciaMax;
      m.item = l.itemMaisUrgente;
    }
    g.set(l.municipio, m);
  }
  return [...g.values()]
    .map((m) => ({ ...m, lat: m.lat / m.locais, lon: m.lon / m.locais }))
    .sort((a, b) => b.urgencia - a.urgencia || b.pessoas - a.pessoas)
    .slice(0, n);
}
