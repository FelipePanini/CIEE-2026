import type { Camada } from '../engine/tipos';

/** Cor de cada camada (mesma dos selos) para pontos, gráficos e 3D. */
export const COR_CAMADA: Record<Camada, string> = {
  HISTORICO: '#b9a98c',
  ATUAL: '#ef6a4b',
  PREVISAO: '#8cc7c5',
  SIMULADO: '#c6b4e6',
};

/** Paleta dos slides do grupo (docs/referencia/slides-acao-social-rs.pdf). */
export const PALETA = {
  navy950: '#0b1e26',
  navy900: '#102a35',
  navy800: '#17343d',
  navy700: '#1f4350',
  coral: '#ef6a4b',
  coralClaro: '#f3876d',
  creme: '#f3efe6',
  piscina: '#8cc7c5',
  piscinaClara: '#b5dcdb',
  alerta: '#f2b84b',
  ok: '#6cc28f',
} as const;
