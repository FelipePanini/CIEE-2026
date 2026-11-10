/**
 * Feature flags da rodada 2. Cada novidade pode ser desligada em 1 segundo, sem novo deploy:
 *   - pela URL:  ?flags=-vidro,-corredorSP   (− desliga, + liga; fica salvo neste navegador)
 *   - pelo painel de debug (tecla F)
 *   - ?flags=padrao volta tudo ao padrão
 * Flag desligada = comportamento da v1 naquele ponto.
 */
import { create } from 'zustand';

export const FLAGS_PADRAO = {
  /** Liquid glass (liquidglass.dev). Desligada: superfícies translúcidas simples. */
  vidro: true,
  /** Navegação em dock de vidro embaixo. Desligada: menu lateral da v1. */
  dock: true,
  /** Barra superior em três zonas. Desligada: cabeçalho da v1. */
  barraNova: true,
  /** Zoom out leva ao mapa do Sul/Sudeste. Desligada: câmera presa à bacia. */
  contextoBrasil: true,
  /** Corredor Jaguariúna (SP) → RS. */
  corredorSP: true,
  /** Rótulos 3D com colisão, LOD e cards colapsáveis. Desligada: rótulos da v1. */
  rotulosInteligentes: true,
  /** Panorama com frase-síntese, KPIs, medidores e top 5. Desligada: Panorama da v1. */
  panoramaV2: true,
} as const;

export type Flag = keyof typeof FLAGS_PADRAO;
export type Flags = Record<Flag, boolean>;
export const NOMES_FLAGS = Object.keys(FLAGS_PADRAO) as Flag[];
const CHAVE = 'cc-flags';

/** Aplica uma lista "-a,+b" sobre um conjunto de flags (função pura, testada). */
export function aplicarLista(base: Flags, lista: string): Flags {
  const out = { ...base };
  for (const bruto of lista.split(',')) {
    const item = bruto.trim();
    if (!item) continue;
    const liga = !item.startsWith('-');
    const nome = item.replace(/^[+-]/, '') as Flag;
    if (nome in FLAGS_PADRAO) out[nome] = liga;
  }
  return out;
}

function iniciais(): Flags {
  let flags: Flags = { ...FLAGS_PADRAO };
  if (typeof window === 'undefined') return flags;
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo) flags = { ...flags, ...(JSON.parse(salvo) as Partial<Flags>) };
  } catch {
    /* armazenamento bloqueado: segue com o padrão */
  }
  const url = new URLSearchParams(window.location.search).get('flags');
  if (url === 'padrao') flags = { ...FLAGS_PADRAO };
  else if (url) flags = aplicarLista(flags, url);
  if (url) gravar(flags);
  return flags;
}

function gravar(f: Flags) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(f));
  } catch {
    /* sem persistência */
  }
}

export const useFlags = create<{ flags: Flags; set: (f: Flag, v: boolean) => void }>((set) => ({
  flags: iniciais(),
  set: (f, v) =>
    set((s) => {
      const flags = { ...s.flags, [f]: v };
      gravar(flags);
      return { flags };
    }),
}));

export const useFlag = (f: Flag): boolean => useFlags((s) => s.flags[f]);
export const flag = (f: Flag): boolean => useFlags.getState().flags[f];
