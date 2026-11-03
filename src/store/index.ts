/**
 * Store único da operação (Zustand). Guarda só a ENTRADA da simulação (estado base + eventos);
 * todo o resto é derivado por `simular()` e memoizado. Assim, uma mudança em qualquer área
 * aparece em todas as outras, e desfazer uma Carta de Crise é só remover o evento da lista.
 */
import { create } from 'zustand';
import { useMemo } from 'react';
import { DADOS } from '../data/carregar';
import {
  simular,
  type AjusteCoordenador,
  type Entrada,
  type EventoAtivo,
  type Resultado,
} from '../engine/simulacao';
import { CENARIOS, type BoletimAtual, type CenarioId } from '../engine/cenarios';
import { PARAMETROS_PADRAO, type IdParametro } from '../engine/parametros';
import { VOLUNTARIOS_PADRAO, type Zona } from '../engine/producao';
import type { Fase, IdItem } from '../engine/urgencia';

export type Qualidade = 'alta' | 'media' | '2d';

export interface Mensagem {
  uid: string;
  em: string;
  de: string;
  para: string;
  texto: string;
}

export interface Estado {
  entrada: Entrada;
  tela: string;
  qualidade: Qualidade;
  movimentoReduzido: boolean;
  animacoesPausadas: boolean;
  apresentacao: { ativa: boolean; etapa: number };
  sugestaoModoLeve: boolean;
  setSugestaoModoLeve: (v: boolean) => void;
  abrigoSelecionado: string | null;
  setAbrigoSelecionado: (id: string | null) => void;
  painelRecolhido: boolean;
  setPainelRecolhido: (v: boolean) => void;
  mensagens: Mensagem[];
  bilhetes: string[];
  organograma: Record<string, string>;
  cronometro: { inicio: number | null; acumuladoMs: number };
  marcos: string[];
  setNomePapel: (papel: string, nome: string) => void;
  iniciarCronometro: () => void;
  pausarCronometro: () => void;
  zerarCronometro: () => void;
  alternarMarco: (id: string) => void;
  // ações
  setCenario: (c: CenarioId) => void;
  setBoletim: (b: BoletimAtual) => void;
  setFase: (f: Fase) => void;
  setParametro: (id: IdParametro, v: number) => void;
  setPeso: (item: IdItem, fase: Fase, v: number) => void;
  setVoluntarios: (z: Zona, v: number) => void;
  alternarBloqueio: (aresta: string) => void;
  setImportarBloqueios: (v: boolean) => void;
  setNivel: (estacao: string, v: number | null) => void;
  registrarVolume: (ponto: string, deltaM3: number) => void;
  dispararCarta: (carta: string) => string;
  desfazerCarta: (uid?: string) => void;
  registrarAjuste: (a: Omit<AjusteCoordenador, 'uid' | 'em'>) => void;
  desfazerAjuste: (uid: string) => void;
  enviarMensagem: (m: Omit<Mensagem, 'uid' | 'em'>) => void;
  adicionarBilhete: (texto: string) => void;
  setTela: (t: string) => void;
  setQualidade: (q: Qualidade) => void;
  setAnimacoesPausadas: (v: boolean) => void;
  setApresentacao: (a: Partial<Estado['apresentacao']>) => void;
  restaurarPadroes: () => void;
}

const agoraISO = () => new Date().toISOString();
let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const entradaInicial = (cenario: CenarioId = 'case'): Entrada => {
  const c = CENARIOS.find((x) => x.id === cenario)!;
  return {
    cenario,
    boletim: '2026-07',
    fase: c.faseInicial,
    parametros: { ...PARAMETROS_PADRAO },
    pesos: {},
    voluntarios: { ...VOLUNTARIOS_PADRAO },
    bloqueiosManuais: [],
    importarBloqueiosReais: false,
    ajustes: [],
    eventos: [],
    niveis: {},
    volumes: {},
    agora: agoraISO(),
  };
};

/** localStorage só para conveniências deste navegador (nomes do organograma); sempre com try/catch. */
const lerLocal = <T>(chave: string, padrao: T): T => {
  try {
    const v = window.localStorage.getItem(chave);
    return v ? (JSON.parse(v) as T) : padrao;
  } catch {
    return padrao;
  }
};
const gravarLocal = (chave: string, v: unknown) => {
  try {
    window.localStorage.setItem(chave, JSON.stringify(v));
  } catch {
    /* modo privado ou armazenamento bloqueado: segue sem persistir */
  }
};

const movimentoReduzidoInicial = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const useOperacao = create<Estado>((set, get) => {
  const mudar = (f: (e: Entrada) => Partial<Entrada>) =>
    set((s) => ({ entrada: { ...s.entrada, ...f(s.entrada), agora: agoraISO() } }));
  return {
    entrada: entradaInicial(),
    tela: 'panorama',
    qualidade: 'alta',
    movimentoReduzido: movimentoReduzidoInicial(),
    animacoesPausadas: movimentoReduzidoInicial(),
    apresentacao: { ativa: false, etapa: 0 },
    sugestaoModoLeve: false,
    setSugestaoModoLeve: (sugestaoModoLeve) => set({ sugestaoModoLeve }),
    abrigoSelecionado: null,
    setAbrigoSelecionado: (abrigoSelecionado) => set({ abrigoSelecionado }),
    painelRecolhido: false,
    setPainelRecolhido: (painelRecolhido) => set({ painelRecolhido }),
    mensagens: [],
    bilhetes: [
      'Vocês não estão sozinhos. — voluntária da triagem',
      'Força, Rio Grande! — doador de Canoas',
      'Cada caixa foi montada com cuidado. — equipe da linha',
    ],
    organograma:
      typeof window === 'undefined' ? {} : lerLocal<Record<string, string>>('cc-organograma', {}),
    cronometro: { inicio: null, acumuladoMs: 0 },
    marcos: [],
    setNomePapel: (papel, nome) =>
      set((s) => {
        const organograma = { ...s.organograma, [papel]: nome.slice(0, 40) };
        gravarLocal('cc-organograma', organograma);
        return { organograma };
      }),
    iniciarCronometro: () =>
      set((s) =>
        s.cronometro.inicio ? s : { cronometro: { ...s.cronometro, inicio: Date.now() } },
      ),
    pausarCronometro: () =>
      set((s) =>
        s.cronometro.inicio
          ? {
              cronometro: {
                inicio: null,
                acumuladoMs: s.cronometro.acumuladoMs + Date.now() - s.cronometro.inicio,
              },
            }
          : s,
      ),
    zerarCronometro: () => set({ cronometro: { inicio: null, acumuladoMs: 0 } }),
    alternarMarco: (id) =>
      set((s) => ({
        marcos: s.marcos.includes(id) ? s.marcos.filter((x) => x !== id) : [...s.marcos, id],
      })),
    setCenario: (cenario) =>
      set((s) => {
        const c = CENARIOS.find((x) => x.id === cenario)!;
        return {
          entrada: {
            ...s.entrada,
            cenario,
            fase: c.faseInicial,
            eventos: [],
            bloqueiosManuais: [],
            importarBloqueiosReais: false,
            niveis: {},
            agora: agoraISO(),
          },
        };
      }),
    setBoletim: (boletim) => mudar(() => ({ boletim })),
    setFase: (fase) => mudar(() => ({ fase })),
    setParametro: (id, v) => mudar((e) => ({ parametros: { ...e.parametros, [id]: v } })),
    setPeso: (item, fase, v) =>
      mudar((e) => ({ pesos: { ...e.pesos, [item]: { ...e.pesos[item], [fase]: v } } })),
    setVoluntarios: (z, v) =>
      mudar((e) => ({ voluntarios: { ...e.voluntarios, [z]: Math.max(0, Math.round(v)) } })),
    alternarBloqueio: (a) =>
      mudar((e) => ({
        bloqueiosManuais: e.bloqueiosManuais.includes(a)
          ? e.bloqueiosManuais.filter((x) => x !== a)
          : [...e.bloqueiosManuais, a],
      })),
    setImportarBloqueios: (v) => mudar(() => ({ importarBloqueiosReais: v })),
    setNivel: (estacao, v) =>
      mudar((e) => {
        const niveis = { ...e.niveis };
        if (v === null) delete niveis[estacao];
        else niveis[estacao] = v;
        return { niveis };
      }),
    registrarVolume: (ponto, d) =>
      mudar((e) => ({
        volumes: { ...e.volumes, [ponto]: Math.round(((e.volumes?.[ponto] ?? 0) + d) * 10) / 10 },
      })),
    dispararCarta: (carta) => {
      const ev: EventoAtivo = { uid: uid('carta'), carta, em: agoraISO() };
      mudar((e) => ({ eventos: [...e.eventos, ev] }));
      return ev.uid;
    },
    desfazerCarta: (u) =>
      mudar((e) => ({
        eventos: u ? e.eventos.filter((x) => x.uid !== u) : e.eventos.slice(0, -1),
      })),
    registrarAjuste: (a) =>
      mudar((e) => ({ ajustes: [...e.ajustes, { ...a, uid: uid('aj'), em: agoraISO() }] })),
    desfazerAjuste: (u) => mudar((e) => ({ ajustes: e.ajustes.filter((x) => x.uid !== u) })),
    enviarMensagem: (m) =>
      set((s) => ({
        mensagens: [{ ...m, uid: uid('msg'), em: agoraISO() }, ...s.mensagens].slice(0, 50),
      })),
    adicionarBilhete: (texto) => set((s) => ({ bilhetes: [texto, ...s.bilhetes].slice(0, 30) })),
    setTela: (tela) => set({ tela }),
    setQualidade: (qualidade) => set({ qualidade }),
    setAnimacoesPausadas: (animacoesPausadas) => set({ animacoesPausadas }),
    setApresentacao: (a) => set((s) => ({ apresentacao: { ...s.apresentacao, ...a } })),
    restaurarPadroes: () => set({ entrada: entradaInicial(get().entrada.cenario) }),
  };
});

/** Resultado derivado da entrada atual (memoizado por referência da entrada). */
export function useResultado(): Resultado {
  const entrada = useOperacao((s) => s.entrada);
  return useMemo(() => simular(DADOS, entrada), [entrada]);
}

// acesso para testes end-to-end (Playwright) e para o Modo Apresentação
declare global {
  interface Window {
    __ccStore?: typeof useOperacao;
  }
}
if (typeof window !== 'undefined') window.__ccStore = useOperacao;
