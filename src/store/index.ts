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
  mensagens: Mensagem[];
  bilhetes: string[];
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
    agora: agoraISO(),
  };
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
    mensagens: [],
    bilhetes: [
      'Vocês não estão sozinhos. — voluntária da triagem',
      'Força, Rio Grande! — doador de Canoas',
      'Cada caixa foi montada com cuidado. — equipe da linha',
    ],
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
