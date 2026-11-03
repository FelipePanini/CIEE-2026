/**
 * Cenários: quais abrigos/quadras a operação atende e quantas pessoas há em cada um.
 *  1. case       — Porto Alegre, Canoas e Eldorado do Sul com a magnitude de 2024
 *  2. atual      — municípios do boletim mais recente da Defesa Civil (Vale do Taquari, 2026)
 *  3. prontidao  — sem cheia ativa: planeja estoque para o pior caso histórico de cada local
 */
import type { Dados } from '../data/carregar';
import type { Calculado, Dado, Insumo } from './tipos';
import type { Parametros } from './parametros';
import type { Fase, IdItem } from './urgencia';

export type CenarioId = 'case' | 'atual' | 'prontidao';
export type BoletimAtual = '2026-07' | '2026-09';

export const CENARIOS: {
  id: CenarioId;
  nome: string;
  curto: string;
  descricao: string;
  faseInicial: Fase;
  alertaInicial: number;
}[] = [
  {
    id: 'case',
    nome: 'Cenário do case',
    curto: 'Case 2024',
    faseInicial: 'cheia',
    alertaInicial: 3,
    descricao:
      'Porto Alegre, Canoas e Eldorado do Sul com a magnitude da enchente de maio de 2024.',
  },
  {
    id: 'atual',
    nome: 'Situação atual',
    curto: 'Atual 2026',
    faseInicial: 'baixando',
    alertaInicial: 2,
    descricao: 'Municípios do boletim mais recente da Defesa Civil RS — Vale do Taquari em 2026.',
  },
  {
    id: 'prontidao',
    nome: 'Prontidão',
    curto: 'Prontidão',
    faseInicial: 'prontidao',
    alertaInicial: 1,
    descricao:
      'Nenhuma cheia ativa. Previsão INMET de chuva acima da média e estoque pré-posicionado para o pior caso histórico.',
  },
];

export const NIVEIS_ALERTA = [
  { nivel: 0, nome: 'Normal', cor: '#6cc28f' },
  { nivel: 1, nome: 'Atenção', cor: '#f2b84b' },
  { nivel: 2, nome: 'Alerta', cor: '#f3876d' },
  { nivel: 3, nome: 'Crítico', cor: '#ef6a4b' },
] as const;

export interface LocalCenario {
  id: string;
  nome: string;
  tipo: 'abrigo' | 'quadra';
  municipio: number;
  lat: number;
  lon: number;
  /** Pessoas abrigadas (real ou calculado a partir de dados reais). 0 = quadra só como base de montagem. */
  pessoas: Dado<number> | Calculado;
  ehBase: boolean;
  estoque: Record<IdItem, Dado<number>>;
}

const insDado = (rotulo: string, d: Dado<number>): Insumo => ({ tipo: 'dado', rotulo, dado: d });
const num = (d: Dado<number> | undefined) => (d && typeof d.valor === 'number' ? d.valor : null);

const ZERO = (rotulo: string): Calculado => ({
  valor: 0,
  unidade: 'pessoas',
  formula: `${rotulo}: sem pessoas abrigadas neste cenário`,
  insumos: [],
});

/** Capacidade da quadra pelo Manual Esfera: área útil ÷ espaço mínimo por pessoa. */
export function capacidadeQuadra(dados: Dados, p: Parametros, frio: boolean): Calculado {
  const esp = dados.esfera.padroes[frio ? 'espaco_frio_m2' : 'espaco_min_m2']!;
  const m2 = num(esp) ?? 3.5;
  return {
    valor: Math.floor(p.area_quadra_m2 / m2),
    unidade: 'pessoas',
    formula: 'capacidade = área útil da quadra ÷ espaço mínimo por pessoa (Esfera)',
    insumos: [
      {
        tipo: 'parametro',
        rotulo: 'Área útil',
        parametro: {
          id: 'area_quadra_m2',
          rotulo: 'Área útil da quadra',
          valor: p.area_quadra_m2,
          unidade: 'm²',
        },
      },
      insDado('Espaço por pessoa', esp),
    ],
  };
}

function estoqueDe(dados: Dados, local: string): Record<IdItem, Dado<number>> {
  const e = dados.estoques.estoques.find((x) => x.local === local);
  const vazio = (u: string): Dado<number> => ({
    valor: 0,
    unidade: u,
    fonte: 'Simulação da operação (sem estoque)',
    url: null,
    data_referencia: '2026-11-03',
    data_consulta: '2026-11-03',
    camada: 'SIMULADO',
  });
  const it = (e?.itens ?? {}) as Record<string, Dado<number>>;
  return {
    agua: it.agua ?? vazio('L'),
    alimentos: it.alimentos ?? vazio('rações'),
    higiene: it.higiene ?? vazio('kits'),
    cobertores: it.cobertores ?? vazio('un'),
    papel_roupas: it.papel_roupas ?? vazio('rolos'),
  };
}

const evento = (dados: Dados, id: string) => dados.eventos.eventos.find((e) => e.id === id)!;
const impacto = (dados: Dados, ev: string, ibge: number) =>
  evento(dados, ev).municipios.find((m) => m.ibge === ibge);

/** Média real de pessoas por abrigo no município (total abrigado ÷ número de abrigos). */
function mediaPorAbrigo(
  dados: Dados,
  ev: string,
  ibge: number,
  descontar?: Dado<number>,
): Calculado | null {
  const im = impacto(dados, ev, ibge);
  const tot = im?.desabrigados;
  const nab = im?.abrigos;
  if (!tot || !nab || num(tot) === null || num(nab) === null) return null;
  const desc = descontar ? (num(descontar) ?? 0) : 0;
  const abr = num(nab)! - (descontar ? 1 : 0);
  return {
    valor: Math.round((num(tot)! - desc) / Math.max(1, abr)),
    unidade: 'pessoas',
    formula: descontar
      ? 'pessoas = (abrigados no município − abrigado no maior abrigo) ÷ (abrigos − 1)'
      : 'pessoas = abrigados no município ÷ número de abrigos (média real)',
    insumos: [
      insDado('Abrigados no município', tot),
      insDado('Abrigos no município', nab),
      ...(descontar ? [insDado('Maior abrigo', descontar)] : []),
    ],
  };
}

/** Pessoas do município divididas pelas quadras-base nele (quando não há dado por abrigo). */
function porQuadra(dados: Dados, ev: string, ibge: number, quadras: number): Calculado | null {
  const d = impacto(dados, ev, ibge)?.desabrigados;
  if (!d || num(d) === null) return null;
  return {
    valor: Math.round(num(d)! / Math.max(1, quadras)),
    unidade: 'pessoas',
    formula: 'pessoas = desabrigados do município (boletim) ÷ quadras-base no município',
    insumos: [insDado('Desabrigados no município', d)],
  };
}

const minimo = (a: Calculado, cap: Calculado): Calculado =>
  a.valor <= cap.valor
    ? a
    : {
        valor: a.valor,
        unidade: 'pessoas',
        formula: a.formula + ' (acima da capacidade Esfera da quadra)',
        insumos: [...a.insumos, { tipo: 'calculado', rotulo: 'Capacidade Esfera', calculado: cap }],
      };

export function montarLocais(
  dados: Dados,
  cenario: CenarioId,
  boletim: BoletimAtual,
  p: Parametros,
  frio: boolean,
): LocalCenario[] {
  const cap = capacidadeQuadra(dados, p, frio);
  const esc = (id: string) => dados.escolas.escolas.find((e) => e.id === id)!;
  const abr = (id: string) => dados.abrigos.abrigos.find((a) => a.id === id)!;
  const quadra = (id: string, pessoas: Dado<number> | Calculado, ehBase = true): LocalCenario => {
    const e = esc(id);
    return {
      id,
      nome: e.nome,
      tipo: 'quadra',
      municipio: e.municipio_ibge,
      lat: e.lat,
      lon: e.lon,
      pessoas,
      ehBase,
      estoque: estoqueDe(dados, id),
    };
  };
  // Abrigos oficiais de terceiros: a operação abastece só uma parcela dos abrigados (critério do grupo).
  const abrigo = (id: string, real: Dado<number> | Calculado): LocalCenario => {
    const a = abr(id);
    const pessoas: Calculado = {
      valor: Math.round((typeof real.valor === 'number' ? real.valor : 0) * p.fracao_atendida),
      unidade: 'pessoas',
      formula: 'pessoas atendidas = abrigados no abrigo oficial × parcela atendida pela operação',
      insumos: [
        'formula' in real
          ? { tipo: 'calculado', rotulo: 'Abrigados', calculado: real }
          : insDado('Abrigados', real),
        {
          tipo: 'parametro',
          rotulo: 'Parcela atendida',
          parametro: {
            id: 'fracao_atendida',
            rotulo: 'Parcela dos abrigados atendida pela operação',
            valor: p.fracao_atendida,
            unidade: 'fração',
          },
        },
      ],
    };
    return {
      id,
      nome: a.nome,
      tipo: 'abrigo',
      municipio: a.municipio_ibge,
      lat: a.lat,
      lon: a.lon,
      pessoas,
      ehBase: false,
      estoque: estoqueDe(dados, id),
    };
  };

  if (cenario === 'case') {
    const ulbra = abr('a-canoas-ulbra').pessoas['2024-05']!;
    const poa = mediaPorAbrigo(dados, '2024-05', 4314902) ?? cap;
    const canoas = mediaPorAbrigo(dados, '2024-05', 4304606, ulbra) ?? cap;
    return [
      abrigo('a-canoas-ulbra', ulbra),
      quadra('q-canoas-marechal', minimo(canoas, cap)),
      quadra('q-poa-aramy', minimo(poa, cap)),
      quadra('q-poa-grande-oriente', minimo(poa, cap)),
      quadra('q-eldorado-getulio', {
        ...cap,
        formula:
          'Eldorado do Sul (2024): abrigados em cidades vizinhas, sem dado por abrigo → lotação pela capacidade Esfera da quadra',
      }),
    ];
  }

  if (cenario === 'atual') {
    if (boletim === '2026-09') {
      return [
        abrigo('a-lajeado-imigrante', abr('a-lajeado-imigrante').pessoas['2026-09']!),
        quadra('q-lajeado-pedro-scherer', ZERO('Quadra-base de montagem')),
        quadra('q-estrela-iee', ZERO('Quadra-base de montagem')),
        quadra('q-encantado-scalabrini', ZERO('Sem número por município no boletim de setembro')),
      ];
    }
    const enc = porQuadra(dados, '2026-07', 4306809, 1);
    const eld = impacto(dados, '2026-07', 4306767)?.desabrigados;
    return [
      abrigo('a-lajeado-imigrante', abr('a-lajeado-imigrante').pessoas['2026-07']!),
      quadra('q-lajeado-pedro-scherer', ZERO('Quadra-base de montagem')),
      quadra('q-estrela-iee', ZERO('Quadra-base de montagem')),
      quadra('q-encantado-scalabrini', enc ? minimo(enc, cap) : cap),
      ...(eld ? [quadra('q-eldorado-getulio', eld)] : []),
    ];
  }

  // prontidão: pior caso histórico de cada local (planejamento), todas as bases
  const pior = (
    lista: (Dado<number> | Calculado | null | undefined)[],
    rotulo: string,
  ): Calculado => {
    const validos = lista.filter(
      (x): x is Dado<number> | Calculado => !!x && typeof x.valor === 'number',
    );
    const max = validos.reduce<Dado<number> | Calculado | null>(
      (a, b) => (a && (a.valor as number) >= (b.valor as number) ? a : b),
      null,
    );
    return {
      valor: max ? (max.valor as number) : cap.valor,
      unidade: 'pessoas',
      formula: `planejamento = pior caso histórico de ${rotulo} (2024–2026)`,
      insumos: max
        ? [
            'formula' in max
              ? { tipo: 'calculado' as const, rotulo: 'Pior caso', calculado: max }
              : insDado('Pior caso', max),
          ]
        : [{ tipo: 'calculado', rotulo: 'Capacidade', calculado: cap }],
    };
  };
  const ulbra = abr('a-canoas-ulbra').pessoas['2024-05']!;
  return [
    abrigo('a-canoas-ulbra', pior([ulbra], 'Ulbra')),
    abrigo(
      'a-lajeado-imigrante',
      pior(
        [
          abr('a-lajeado-imigrante').pessoas['2026-07'],
          abr('a-lajeado-imigrante').pessoas['2026-09'],
        ],
        'Parque do Imigrante',
      ),
    ),
    quadra(
      'q-canoas-marechal',
      pior([minimo(mediaPorAbrigo(dados, '2024-05', 4304606, ulbra) ?? cap, cap)], 'Canoas'),
    ),
    quadra(
      'q-poa-aramy',
      pior([minimo(mediaPorAbrigo(dados, '2024-05', 4314902) ?? cap, cap)], 'Porto Alegre'),
    ),
    quadra(
      'q-poa-grande-oriente',
      pior([minimo(mediaPorAbrigo(dados, '2024-05', 4314902) ?? cap, cap)], 'Porto Alegre'),
    ),
    quadra(
      'q-eldorado-getulio',
      pior([impacto(dados, '2026-07', 4306767)?.desabrigados, cap], 'Eldorado do Sul'),
    ),
    quadra('q-encantado-scalabrini', pior([porQuadra(dados, '2026-07', 4306809, 1)], 'Encantado')),
    quadra('q-lajeado-pedro-scherer', ZERO('Quadra-base de montagem')),
    quadra('q-estrela-iee', ZERO('Quadra-base de montagem')),
  ];
}

/** Bloqueios reais do evento de referência do cenário. */
export const eventoReferencia = (c: CenarioId, b: BoletimAtual): string | null =>
  c === 'case' ? '2024-05' : c === 'atual' ? b : null;
