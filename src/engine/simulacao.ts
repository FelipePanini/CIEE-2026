/**
 * Motor da simulação — o coração da visão sistêmica.
 *
 *   resultado = simular(dados, entrada)
 *
 * A entrada é o estado base (cenário, fase, parâmetros, ajustes do coordenador) + a lista de eventos
 * ativos (Cartas de Crise). Tudo que aparece nas telas deriva daqui: um bloqueio de rota aumenta o
 * ETA, que reduz a cobertura na chegada, que sobe a urgência, que muda a meta de arrecadação, o custo,
 * o semáforo das áreas e a central de alertas. Desfazer uma carta = tirá-la da lista e recalcular.
 */
import type { Dados } from '../data/carregar';
import type { Calculado, Dado, Insumo } from './tipos';
import type { Parametros } from './parametros';
import { ITENS, urgenciaItem, type Fase, type IdItem, type UrgenciaItem } from './urgencia';
import {
  capacidadeQuadra,
  CENARIOS,
  eventoReferencia,
  montarLocais,
  type BoletimAtual,
  type CenarioId,
  type LocalCenario,
} from './cenarios';
import { criarGrafo, type Aresta } from './rotas/grafo';
import { dijkstra, type Caminho } from './rotas/dijkstra';
import { sequenciarParadas } from './rotas/tsp2opt';
import { calcularKit, type ResultadoKit } from './kit';
import { freteAntt, prevenirVsReagir, type PrevenirReagir } from './custos';
import { calcularProducao, type ResultadoProducao, type Zona } from './producao';

export interface EventoAtivo {
  /** id único da instância (permite a mesma carta duas vezes). */
  uid: string;
  carta: string;
  em: string;
}

export interface AjusteCoordenador {
  uid: string;
  local: string;
  item: IdItem;
  estoque: number;
  pessoas?: number;
  em: string;
  nota?: string;
}

export interface Entrada {
  cenario: CenarioId;
  boletim: BoletimAtual;
  fase: Fase;
  parametros: Parametros;
  pesos: Partial<Record<IdItem, Partial<Record<Fase, number>>>>;
  voluntarios: Record<Zona, number>;
  bloqueiosManuais: string[];
  importarBloqueiosReais: boolean;
  ajustes: AjusteCoordenador[];
  eventos: EventoAtivo[];
  niveis: Partial<Record<string, number>>;
  /** hora de referência da simulação (ISO) — usada nos alertas */
  agora: string;
}

export interface LocalResultado extends LocalCenario {
  pessoasN: number;
  capacidade: Calculado;
  acimaCapacidade: boolean;
  urgencias: UrgenciaItem[];
  urgenciaMax: number;
  itemMaisUrgente: IdItem;
  eta: Calculado | null;
  semRota: boolean;
  base: string | null;
  kitsNecessarios: number;
  voluntarioReferencia: string;
}

export interface PontoResultado {
  id: string;
  parceiro: string;
  municipio: number;
  lat: number;
  lon: number;
  volume: Dado<number>;
  capacidade: number;
  ocupacao: Calculado;
  lotado: boolean;
  base: string | null;
  metas: { item: IdItem; quantidade: number; unidade: string; prioridade: number }[];
}

export interface Parada {
  no: string;
  tipo: 'coleta' | 'entrega' | 'base';
  chegadaH: number;
}

export interface RotaResultado {
  base: string;
  veiculo: {
    id: string;
    categoria: string;
    capacidadeKg: number;
    janela: [string, string];
    parceiro: string;
  } | null;
  paradas: Parada[];
  trechos: Caminho[];
  km: Calculado;
  horas: number;
  cabeNaJanela: boolean;
  viagens: number;
  frete: Calculado;
  inalcancaveis: string[];
}

export interface Alerta {
  id: string;
  em: string;
  nivel: 'info' | 'atencao' | 'alerta' | 'critico';
  area: 'administracao' | 'comercio' | 'logistica' | 'producao' | 'lider';
  titulo: string;
  mensagem: string;
  origem?: string;
}

export interface SugestaoParceiro {
  local: string;
  item: IdItem;
  parceiro: string;
  distanciaKm: number;
  disponivel: number;
  compromisso?: string;
}

export interface Resultado {
  cenario: (typeof CENARIOS)[number];
  fase: Fase;
  nivelAlerta: number;
  locais: LocalResultado[];
  pontos: PontoResultado[];
  rotas: RotaResultado[];
  arestasBloqueadas: string[];
  arestas: Aresta[];
  kit: ResultadoKit;
  producao: ResultadoProducao;
  custos: {
    kitsTotal: number;
    compras: Calculado;
    frete: Calculado;
    economiaParceiros: Calculado;
    total: Calculado;
    orcamento: Dado<number>;
    usoOrcamento: Calculado;
    pessoasAtendidas: number;
    custoPorFamilia: Calculado;
    pixEmKits: Calculado;
    prevenirReagir: PrevenirReagir | null;
  };
  sugestoes: SugestaoParceiro[];
  alertas: Alerta[];
  semaforo: Record<
    'administracao' | 'comercio' | 'logistica' | 'producao',
    'verde' | 'amarelo' | 'vermelho'
  >;
  kpis: { pessoas: number; critico: number; kitsHora: number; custoKit: number };
  decisoes: {
    uid: string;
    em: string;
    titulo: string;
    resposta: string;
    inspirado?: { texto: string; url: string };
  }[];
  frio: boolean;
  niveis: Record<string, number>;
  atrasoGlobalH: number;
}

const hav = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
const num = (d: Dado<number> | Calculado) => (typeof d.valor === 'number' ? d.valor : 0);
const VOLUNTARIOS_REF = [
  'Equipe Âmbar',
  'Equipe Ipê',
  'Equipe Guaíba',
  'Equipe Taquari',
  'Equipe Jacuí',
  'Equipe Farol',
  'Equipe Ponte',
  'Equipe Horizonte',
  'Equipe Abraço',
];

type Efeito = Record<string, unknown> & { tipo: string };

export function simular(dados: Dados, e: Entrada): Resultado {
  const cenario = CENARIOS.find((c) => c.id === e.cenario)!;
  const p = { ...e.parametros };
  const cartas = new Map(dados.cartas.cartas.map((c) => [c.id, c]));
  const efeitos: { ev: EventoAtivo; ef: Efeito }[] = e.eventos.flatMap((ev) =>
    (cartas.get(ev.carta)?.efeitos ?? []).map((ef) => ({ ev, ef: ef as Efeito })),
  );

  // ── 1. aplicar eventos ao estado base ──────────────────────────────────────
  let fase = e.fase;
  let nivelAlerta = cenario.alertaInicial;
  let atrasoGlobalH = 0;
  let fatorProducao = 1;
  let frio = false;
  const pesos = structuredClone(e.pesos);
  const deltaPessoas = new Map<string, number>();
  const bloqueadas = new Set(e.bloqueiosManuais);
  const pontosLotados = new Set<string>();
  const veiculosRemovidos = new Set<string>();
  const voluntarios = { ...e.voluntarios };
  const niveis: Record<string, number> = {};
  for (const est of dados.rios.estacoes) niveis[est.id] = num(est.nivel_atual);
  Object.assign(niveis, e.niveis);
  for (const { ef } of efeitos) {
    switch (ef.tipo) {
      case 'fase':
        fase = ef.valor as Fase;
        break;
      case 'alerta':
        nivelAlerta = Math.max(nivelAlerta, ef.valor as number);
        break;
      case 'atraso_global_h':
        atrasoGlobalH += ef.valor as number;
        break;
      case 'pessoas':
        deltaPessoas.set(
          ef.local as string,
          (deltaPessoas.get(ef.local as string) ?? 0) + (ef.delta as number),
        );
        break;
      case 'nivel':
        niveis[ef.estacao as string] = Math.max(
          niveis[ef.estacao as string] ?? 0,
          ef.valor as number,
        );
        break;
      case 'bloquear':
        for (const a of ef.arestas as string[]) bloqueadas.add(a);
        break;
      case 'peso': {
        const it = ef.item as IdItem;
        pesos[it] = { ...pesos[it], [fase]: ef.valor as number };
        break;
      }
      case 'espaco_frio':
        frio = true;
        break;
      case 'lotar_ponto':
        pontosLotados.add(ef.ponto as string);
        break;
      case 'remover_veiculo':
        veiculosRemovidos.add(ef.veiculo as string);
        break;
      case 'voluntarios': {
        const z = ef.zona as Zona;
        voluntarios[z] = Math.round(voluntarios[z] * (ef.fator as number));
        break;
      }
      case 'producao':
        fatorProducao *= ef.fator as number;
        break;
    }
  }
  const ref = eventoReferencia(e.cenario, e.boletim);
  if (e.importarBloqueiosReais && ref)
    for (const b of dados.redeViaria.bloqueios_reais)
      if (b.evento === ref) bloqueadas.add(b.aresta);
  for (const r of dados.rios.estacoes)
    if ((niveis[r.id] ?? 0) >= num(r.cota_inundacao)) nivelAlerta = Math.max(nivelAlerta, 2);

  // ── 2. locais e pessoas ─────────────────────────────────────────────────────
  const base = montarLocais(dados, e.cenario, e.boletim, p, frio);
  const cap = capacidadeQuadra(dados, p, frio);
  const ajustesPorLocal = new Map<string, AjusteCoordenador[]>();
  for (const a of e.ajustes)
    ajustesPorLocal.set(a.local, [...(ajustesPorLocal.get(a.local) ?? []), a]);
  const locais0 = base.map((l) => {
    let pessoas: Dado<number> | Calculado = l.pessoas;
    const delta = deltaPessoas.get(l.id);
    const ajs = ajustesPorLocal.get(l.id) ?? [];
    const ajP = [...ajs].reverse().find((a) => a.pessoas !== undefined);
    if (ajP)
      pessoas = {
        valor: ajP.pessoas!,
        unidade: 'pessoas',
        formula: 'informado pelo coordenador do abrigo',
        insumos: [],
      };
    if (delta) {
      pessoas = {
        valor: num(pessoas) + delta,
        unidade: 'pessoas',
        formula: `pessoas = base + ${delta} (Carta de Crise)`,
        insumos: [
          'formula' in pessoas
            ? { tipo: 'calculado', rotulo: 'Base', calculado: pessoas }
            : { tipo: 'dado', rotulo: 'Base', dado: pessoas },
        ],
      };
    }
    const estoque = { ...l.estoque };
    for (const a of ajs) {
      estoque[a.item] = {
        ...estoque[a.item],
        valor: a.estoque,
        fonte: 'Informado pelo coordenador do abrigo (simulado)',
        data_referencia: a.em.slice(0, 10),
        nota: a.nota,
      };
    }
    return { ...l, pessoas, estoque };
  });

  // ── 3. grafo e rotas ────────────────────────────────────────────────────────
  const arestas: Aresta[] = dados.redeViaria.arestas.map((a) => ({
    id: a.id,
    de: a.de,
    para: a.para,
    km: num(a.km),
    velocidadeKmh: a.velocidade_kmh,
    via: a.via,
  }));
  const nosIds = dados.redeViaria.nos.map((n) => n.id);
  const g = criarGrafo(nosIds, arestas, bloqueadas);
  const pos = new Map(dados.redeViaria.nos.map((n) => [n.id, [n.lat, n.lon] as [number, number]]));
  const bases = locais0.filter((l) => l.tipo === 'quadra' && pos.has(l.id));
  const regioesCenario = new Set(
    locais0.map((l) => dados.municipios.municipios.find((m) => m.ibge === l.municipio)?.regiao),
  );
  const parceirosCenario = dados.parceiros.parceiros.filter((pa) => {
    const reg = dados.municipios.municipios.find((m) => m.ibge === pa.municipio_ibge)?.regiao;
    return regioesCenario.has(reg) || reg === 'Vale do Caí';
  });
  const tempo = new Map<string, Caminho | null>();
  const caminho = (a: string, b: string) => {
    const k = `${a}|${b}`;
    if (!tempo.has(k)) tempo.set(k, dijkstra(g, a, b));
    return tempo.get(k)!;
  };
  const baseMaisProxima = (no: string): string | null => {
    let melhor: string | null = null;
    let h = Infinity;
    for (const b of bases) {
      const c = caminho(b.id, no);
      if (c && c.horas < h) {
        h = c.horas;
        melhor = b.id;
      }
    }
    return melhor;
  };

  // pontos de coleta
  const capPonto = p.capacidade_ponto_m3;
  const pontos0 = parceirosCenario
    .filter((pa) => pa.ponto_coleta && pos.has(pa.ponto_coleta))
    .map((pa) => {
      const id = pa.ponto_coleta!;
      const est = dados.estoques.estoques.find((x) => x.local === id)?.itens.volume_m3 as
        Dado<number> | undefined;
      const volume: Dado<number> = pontosLotados.has(id)
        ? { ...(est as Dado<number>), valor: capPonto, nota: 'Ponto lotado (Carta de Crise)' }
        : (est ?? {
            valor: 0,
            unidade: 'm³',
            fonte: 'Simulação',
            url: null,
            data_referencia: '2026-11-03',
            data_consulta: '2026-11-03',
            camada: 'SIMULADO',
          });
      const ocup = num(volume) / capPonto;
      return {
        id,
        parceiro: pa.nome,
        municipio: pa.municipio_ibge,
        lat: pa.lat,
        lon: pa.lon,
        volume,
        capacidade: capPonto,
        ocupacao: {
          valor: ocup,
          unidade: 'fração',
          formula: 'ocupação = volume acumulado ÷ capacidade do ponto',
          insumos: [
            { tipo: 'dado', rotulo: 'Volume', dado: volume } as Insumo,
            {
              tipo: 'parametro',
              rotulo: 'Capacidade',
              parametro: {
                id: 'capacidade_ponto_m3',
                rotulo: 'Capacidade do ponto',
                valor: capPonto,
                unidade: 'm³',
              },
            } as Insumo,
          ],
        } as Calculado,
        lotado: ocup >= 1,
        base: baseMaisProxima(id),
      };
    });

  // veículos disponíveis
  const veiculos = parceirosCenario.flatMap((pa) =>
    (pa.veiculos ?? [])
      .filter((v) => !veiculosRemovidos.has(v.id))
      .map((v) => {
        const cat = dados.veiculos.categorias.find((c) => c.id === v.categoria)!;
        return {
          id: v.id,
          categoria: v.categoria,
          capacidadeKg: num(cat.capacidade_kg),
          eixos: cat.eixos,
          janela: v.janela,
          parceiro: pa.nome,
          lat: pa.lat,
          lon: pa.lon,
        };
      }),
  );

  // atribuição de abrigos às bases e ETA
  const comPessoas = locais0.filter((l) => num(l.pessoas) > 0);
  const atribuicao = new Map<string, string | null>();
  for (const l of comPessoas)
    atribuicao.set(l.id, l.ehBase && pos.has(l.id) ? l.id : baseMaisProxima(l.id));

  const kit = calcularKit(
    new Map(dados.precos.produtos.map((x) => [x.id, x.preco])),
    new Map(Object.entries(dados.nutricao.kcal_100g)),
    p.familia_ref,
    p.dias_kit,
  );

  const rotas: RotaResultado[] = [];
  const etaPorLocal = new Map<string, number>();
  const usados = new Set<string>();
  for (const b of bases) {
    const entregas = comPessoas
      .filter((l) => atribuicao.get(l.id) === b.id && l.id !== b.id)
      .map((l) => l.id);
    const coletas = pontos0
      .filter((pt) => pt.base === b.id && (pt.lotado || num(pt.ocupacao) >= 0.5))
      .map((pt) => pt.id);
    const paradas = [...coletas, ...entregas];
    if (!paradas.length) {
      if (atribuicao.get(b.id) === b.id) etaPorLocal.set(b.id, atrasoGlobalH);
      continue;
    }
    const custo = (a: string, c: string) => caminho(a, c)?.horas ?? Infinity;
    const seq = sequenciarParadas(b.id, paradas, custo);
    const inalcancaveis = paradas.filter((x) => !seq.includes(x));
    // veículo: o mais próximo ainda não usado (ou reaproveita)
    const ordenados = [...veiculos].sort(
      (x, y) => hav(pos.get(b.id)!, [x.lat, x.lon]) - hav(pos.get(b.id)!, [y.lat, y.lon]),
    );
    const v = ordenados.find((x) => !usados.has(x.id)) ?? ordenados[0] ?? null;
    if (v) usados.add(v.id);
    let h = atrasoGlobalH;
    const trechos: Caminho[] = [];
    const lista: Parada[] = [{ no: b.id, tipo: 'base', chegadaH: h }];
    for (let i = 1; i < seq.length; i++) {
      const c = caminho(seq[i - 1]!, seq[i]!)!;
      trechos.push(c);
      h += c.horas + (i < seq.length - 1 ? 0.33 : 0); // 20 min por parada
      const no = seq[i]!;
      lista.push({
        no,
        tipo: no === b.id ? 'base' : coletas.includes(no) ? 'coleta' : 'entrega',
        chegadaH: h,
      });
      if (entregas.includes(no) && !etaPorLocal.has(no)) etaPorLocal.set(no, h);
    }
    if (atribuicao.get(b.id) === b.id) etaPorLocal.set(b.id, atrasoGlobalH);
    const km = trechos.reduce((s, c) => s + c.km, 0);
    const kmCalc: Calculado = {
      valor: km,
      unidade: 'km',
      formula:
        'km da rota = soma dos menores caminhos (Dijkstra) na sequência vizinho mais próximo + 2-opt',
      insumos: trechos
        .flatMap((c) => c.arestas)
        .slice(0, 8)
        .map((a) => ({
          tipo: 'dado' as const,
          rotulo: a.id,
          dado: dados.redeViaria.arestas.find((x) => x.id === a.id)!.km,
        })),
    };
    const kitsRota = entregas.reduce((s, id) => s + kitsPara(locais0.find((l) => l.id === id)!), 0);
    const viagens = v ? Math.max(1, Math.ceil((kitsRota * p.peso_kit_kg) / v.capacidadeKg)) : 0;
    const [ji, jf] = (v?.janela ?? ['06:00', '18:00']).map(
      (x) => Number(x.slice(0, 2)) + Number(x.slice(3)) / 60,
    );
    rotas.push({
      base: b.id,
      veiculo: v
        ? {
            id: v.id,
            categoria: v.categoria,
            capacidadeKg: v.capacidadeKg,
            janela: v.janela,
            parceiro: v.parceiro,
          }
        : null,
      paradas: lista,
      trechos,
      km: kmCalc,
      horas: h - atrasoGlobalH,
      cabeNaJanela: (h - atrasoGlobalH) * viagens <= jf! - ji!,
      viagens,
      frete: v
        ? (() => {
            const f = freteAntt(km, v.eixos, dados.frete.pisos, {
              tipo: 'calculado',
              rotulo: 'km da rota',
              calculado: kmCalc,
            });
            return {
              ...f,
              valor: f.valor * viagens,
              formula: f.formula + ` × ${viagens} viagem(ns)`,
            };
          })()
        : { valor: 0, unidade: 'R$', formula: 'sem veículo disponível', insumos: [] },
      inalcancaveis,
    });
    for (const x of inalcancaveis) etaPorLocal.set(x, Infinity);
  }

  function kitsPara(l: LocalCenario): number {
    const pessoas = num(l.pessoas);
    if (!pessoas) return 0;
    let k = 0;
    for (const it of ITENS) {
      const u = urgenciaItem({
        item: it.id,
        estoque: l.estoque[it.id],
        pessoas: l.pessoas,
        etaDias: null,
        fase,
        parametros: p,
        pesos,
      });
      const porKit = kit.repoe[it.id];
      if (porKit > 0) k = Math.max(k, Math.ceil(u.deficit / porKit));
    }
    return k;
  }

  // ── 4. urgência por item e por local ────────────────────────────────────────
  const locais: LocalResultado[] = locais0.map((l, i) => {
    const etaH = etaPorLocal.get(l.id);
    const semRota =
      num(l.pessoas) > 0 &&
      (etaH === undefined || !Number.isFinite(etaH)) &&
      !(l.ehBase && pos.has(l.id));
    const etaVal = semRota ? 72 : (etaH ?? 0);
    const eta: Calculado | null =
      num(l.pessoas) > 0
        ? {
            valor: etaVal / 24,
            unidade: 'dias',
            formula: semRota
              ? 'sem rota até o abrigo (trechos bloqueados): reposição assumida em 3 dias'
              : 'ETA = tempo de viagem na rota (Dijkstra) + paradas + atraso de alerta',
            insumos: atrasoGlobalH
              ? [
                  {
                    tipo: 'parametro',
                    rotulo: 'Atraso do alerta',
                    parametro: {
                      id: 'atraso',
                      rotulo: 'Atraso do alerta (Carta de Crise)',
                      valor: atrasoGlobalH,
                      unidade: 'h',
                    },
                  },
                ]
              : [],
          }
        : null;
    const urg = ITENS.map((it) =>
      urgenciaItem({
        item: it.id,
        estoque: l.estoque[it.id],
        pessoas: l.pessoas,
        etaDias: eta,
        fase,
        parametros: p,
        pesos,
      }),
    );
    const top = urg.reduce((a, b) => (b.urgencia.valor > a.urgencia.valor ? b : a));
    return {
      ...l,
      pessoasN: num(l.pessoas),
      capacidade: cap,
      acimaCapacidade: l.tipo === 'quadra' && num(l.pessoas) > cap.valor,
      urgencias: urg,
      urgenciaMax: top.urgencia.valor,
      itemMaisUrgente: top.item,
      eta,
      semRota,
      base: atribuicao.get(l.id) ?? null,
      kitsNecessarios: kitsPara(l),
      voluntarioReferencia: VOLUNTARIOS_REF[i % VOLUNTARIOS_REF.length]!,
    };
  });

  // ── 5. metas de arrecadação por ponto (derivadas dos déficits) ─────────────
  const pontos: PontoResultado[] = pontos0.map((pt) => {
    const servidos = locais.filter((l) => l.base === pt.base);
    const nPontos = Math.max(1, pontos0.filter((x) => x.base === pt.base).length);
    const metas = ITENS.map((it) => {
      const deficit =
        servidos.reduce((s, l) => s + l.urgencias.find((u) => u.item === it.id)!.deficit, 0) /
        nPontos;
      const prioridade = Math.max(
        0,
        ...servidos.map((l) => l.urgencias.find((u) => u.item === it.id)!.urgencia.valor),
      );
      return { item: it.id, quantidade: Math.ceil(deficit), unidade: it.unidade, prioridade };
    }).sort((a, b) => b.prioridade - a.prioridade);
    return { ...pt, metas };
  });

  // ── 6. produção ─────────────────────────────────────────────────────────────
  const kitsTotal = locais.reduce((s, l) => s + l.kitsNecessarios, 0);
  const producao = calcularProducao(voluntarios, p, fatorProducao, kitsTotal);

  // ── 7. custos ───────────────────────────────────────────────────────────────
  const opItens = dados.estoques.estoques.find((x) => x.local === 'operacao')!.itens as Record<
    string,
    Dado<number>
  >;
  const custoKitC = kit.custo;
  const compras: Calculado = {
    valor: kitsTotal * custoKitC.valor,
    unidade: 'R$',
    formula: 'compras = kits necessários × custo do kit',
    insumos: [{ tipo: 'calculado', rotulo: 'Custo do kit', calculado: custoKitC }],
  };
  const freteTotal: Calculado = {
    valor: rotas.reduce((s, r) => s + r.frete.valor, 0),
    unidade: 'R$',
    formula: 'frete = Σ piso ANTT das rotas (km × CCD + CC) × viagens',
    insumos: rotas.map((r) => ({
      tipo: 'calculado' as const,
      rotulo: `Rota ${r.base}`,
      calculado: r.frete,
    })),
  };
  const economia: Calculado = {
    valor:
      num(opItens.doacoes_produto_rs!) + Math.min(num(opItens.frete_doado_rs!), freteTotal.valor),
    unidade: 'R$',
    formula: 'economia = doações em produto + frete doado (até o frete da operação)',
    insumos: [
      { tipo: 'dado', rotulo: 'Doações em produto', dado: opItens.doacoes_produto_rs! },
      { tipo: 'dado', rotulo: 'Frete doado', dado: opItens.frete_doado_rs! },
    ],
  };
  const total: Calculado = {
    valor: Math.max(0, compras.valor + freteTotal.valor - economia.valor),
    unidade: 'R$',
    formula: 'custo total = compras + frete − economia gerada por parceiros',
    insumos: [
      { tipo: 'calculado', rotulo: 'Compras', calculado: compras },
      { tipo: 'calculado', rotulo: 'Frete', calculado: freteTotal },
      { tipo: 'calculado', rotulo: 'Economia', calculado: economia },
    ],
  };
  const orcamento = opItens.orcamento_rs!;
  const pessoasAtendidas = locais.reduce((s, l) => s + l.pessoasN, 0);
  const pix = dados.orcamento.pix_sos_rs.arrecadado!;
  let prevenirReagir: PrevenirReagir | null = null;
  if (e.cenario === 'prontidao') {
    const kitsPlanejados = Math.ceil(
      (pessoasAtendidas * p.dias_autonomia_prontidao) / (p.familia_ref * p.dias_kit),
    );
    const fretePlan = rotas.length
      ? { ...freteTotal, formula: 'frete planejado = piso ANTT das rotas com caminhão cheio' }
      : { valor: 0, unidade: 'R$', formula: 'sem rotas', insumos: [] };
    prevenirReagir = prevenirVsReagir(
      kitsPlanejados,
      custoKitC,
      fretePlan,
      p.sobrepreco_emergencial,
      p.fator_urgencia_frete,
    );
  }
  const custos = {
    kitsTotal,
    compras,
    frete: freteTotal,
    economiaParceiros: economia,
    total,
    orcamento,
    usoOrcamento: {
      valor: total.valor / Math.max(1, num(orcamento)),
      unidade: 'fração',
      formula: 'uso do orçamento = custo total ÷ orçamento da operação',
      insumos: [
        { tipo: 'calculado' as const, rotulo: 'Custo total', calculado: total },
        { tipo: 'dado' as const, rotulo: 'Orçamento', dado: orcamento },
      ],
    },
    pessoasAtendidas,
    custoPorFamilia: {
      valor: total.valor / Math.max(1, pessoasAtendidas / p.familia_ref),
      unidade: 'R$',
      formula: 'custo por família = custo total ÷ (pessoas atendidas ÷ família de referência)',
      insumos: [{ tipo: 'calculado' as const, rotulo: 'Custo total', calculado: total }],
    },
    pixEmKits: {
      valor: num(pix) / Math.max(1, custoKitC.valor),
      unidade: 'kits',
      formula: 'kits equivalentes = total arrecadado pelo PIX SOS RS ÷ custo do kit',
      insumos: [
        { tipo: 'dado' as const, rotulo: 'PIX SOS RS', dado: pix },
        { tipo: 'calculado' as const, rotulo: 'Custo do kit', calculado: custoKitC },
      ],
    },
    prevenirReagir,
  };

  // ── 8. parceiros: match automático ──────────────────────────────────────────
  const sugestoes: SugestaoParceiro[] = [];
  const chaveAlerta = nivelAlerta >= 3 ? '3-critico' : nivelAlerta >= 2 ? '2-alerta' : '1-atencao';
  for (const l of locais) {
    for (const u of l.urgencias.filter((x) => x.critico && x.urgencia.valor > 0.3)) {
      const candidatos = dados.parceiros.parceiros
        .filter((pa) => (pa.recursos[u.item] ?? 0) > 0)
        .map((pa) => ({ pa, d: hav([l.lat, l.lon], [pa.lat, pa.lon]) }))
        .sort((a, b) => a.d - b.d);
      const c = candidatos[0];
      if (c)
        sugestoes.push({
          local: l.id,
          item: u.item,
          parceiro: c.pa.id,
          distanciaKm: c.d,
          disponivel: c.pa.recursos[u.item]!,
          compromisso: c.pa.compromisso_pre_acordado[chaveAlerta],
        });
    }
  }

  // ── 9. alertas e semáforo ───────────────────────────────────────────────────
  const alertas: Alerta[] = [];
  const nomeNo = (id: string) =>
    dados.redeViaria.nos.find((n) => n.id === id)?.nome ??
    locais.find((l) => l.id === id)?.nome ??
    id;
  const nivelTxt = ['normal', 'atenção', 'alerta', 'crítico'][nivelAlerta]!;
  alertas.push({
    id: 'nivel',
    em: e.agora,
    nivel: nivelAlerta >= 3 ? 'critico' : nivelAlerta === 2 ? 'alerta' : 'atencao',
    area: 'lider',
    titulo: `Nível de alerta: ${nivelTxt.toUpperCase()}`,
    mensagem: `${cenario.nome}. Fase: ${fase}. Todas as áreas seguem o plano do nível ${nivelTxt}.`,
  });
  for (const { ev } of efeitos.filter(
    (x, i, arr) => arr.findIndex((y) => y.ev.uid === x.ev.uid) === i,
  )) {
    const c = cartas.get(ev.carta)!;
    alertas.push({
      id: `carta-${ev.uid}`,
      em: ev.em,
      nivel:
        c.severidade === 'critico' ? 'critico' : c.severidade === 'alerta' ? 'alerta' : 'atencao',
      area: c.area,
      titulo: c.titulo,
      mensagem: c.resposta_sugerida,
      origem: 'Carta de Crise',
    });
  }
  for (const pt of pontos.filter((x) => x.lotado))
    alertas.push({
      id: `lotado-${pt.id}`,
      em: e.agora,
      nivel: 'alerta',
      area: 'logistica',
      titulo: `Ponto de coleta lotado — ${pt.parceiro}`,
      mensagem: `Aviso automático para a Logística: incluir ${pt.parceiro} na próxima rota da base ${pt.base ? nomeNo(pt.base) : '—'}.`,
      origem: 'Comércio e Varejo',
    });
  for (const l of locais.filter((x) => x.semRota))
    alertas.push({
      id: `semrota-${l.id}`,
      em: e.agora,
      nivel: 'critico',
      area: 'logistica',
      titulo: `Sem rota até ${l.nome}`,
      mensagem:
        'Todos os caminhos passam por trechos bloqueados. Avaliar transporte alternativo (barco, helicóptero) ou abrir base local.',
    });
  for (const l of locais.filter((x) => x.acimaCapacidade))
    alertas.push({
      id: `cap-${l.id}`,
      em: e.agora,
      nivel: 'alerta',
      area: 'producao',
      titulo: `${l.nome} acima da capacidade Esfera`,
      mensagem: `${Math.round(l.pessoasN)} pessoas para ${cap.valor} vagas (${frio ? '4,5' : '3,5'} m² por pessoa). Redistribuir para outra quadra.`,
    });
  for (const r of rotas.filter((x) => !x.cabeNaJanela))
    alertas.push({
      id: `janela-${r.base}`,
      em: e.agora,
      nivel: 'atencao',
      area: 'logistica',
      titulo: `Rota de ${nomeNo(r.base)} não cabe na janela`,
      mensagem: `${r.viagens} viagem(ns) de ${r.horas.toFixed(1)} h excedem a janela ${r.veiculo?.janela.join('–') ?? ''}. Acionar segundo veículo.`,
    });
  const criticos = locais.flatMap((l) =>
    l.urgencias.filter((u) => u.critico && u.urgencia.valor >= 0.5).map((u) => ({ l, u })),
  );
  for (const { l, u } of criticos.slice(0, 6))
    alertas.push({
      id: `urg-${l.id}-${u.item}`,
      em: e.agora,
      nivel: u.urgencia.valor >= 0.8 ? 'critico' : 'alerta',
      area: 'comercio',
      titulo: `${ITENS.find((i) => i.id === u.item)!.nome} crítico em ${l.nome}`,
      mensagem: `Cobertura de ${u.coberturaNaChegada.valor.toFixed(1)} dia(s) na chegada da reposição; prazo crítico ${u.prazo} dia(s). Meta de arrecadação ajustada nos pontos.`,
    });

  const cor = (verm: boolean, amar: boolean) =>
    (verm ? 'vermelho' : amar ? 'amarelo' : 'verde') as 'verde' | 'amarelo' | 'vermelho';
  const horasProd = producao.horasParaDemanda?.valor ?? Infinity;
  const semaforo = {
    administracao: cor(nivelAlerta >= 3 && atrasoGlobalH > 0, nivelAlerta >= 2),
    comercio: cor(
      pontos.some((x) => x.lotado) || criticos.some((c) => c.u.urgencia.valor >= 0.8),
      criticos.length > 0,
    ),
    logistica: cor(
      locais.some((l) => l.semRota),
      rotas.some((r) => !r.cabeNaJanela) || bloqueadas.size > 0,
    ),
    producao: cor(horasProd > 24 || locais.some((l) => l.acimaCapacidade), horasProd > 8),
  };

  const decisoes = e.eventos.map((ev) => {
    const c = cartas.get(ev.carta)!;
    return {
      uid: ev.uid,
      em: ev.em,
      titulo: c.titulo,
      resposta: c.resposta_sugerida,
      inspirado: c.inspirado_em
        ? { texto: c.inspirado_em.texto, url: c.inspirado_em.url }
        : undefined,
    };
  });

  return {
    cenario,
    fase,
    nivelAlerta,
    locais,
    pontos,
    rotas,
    arestasBloqueadas: [...bloqueadas],
    arestas,
    kit,
    producao,
    custos,
    sugestoes,
    alertas,
    semaforo,
    kpis: {
      pessoas: pessoasAtendidas,
      critico: criticos.length,
      kitsHora: producao.kitsHora.valor,
      custoKit: custoKitC.valor,
    },
    decisoes,
    frio,
    niveis,
    atrasoGlobalH,
  };
}
