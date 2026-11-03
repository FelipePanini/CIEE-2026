import type { CenarioId } from '../engine/cenarios';
import { ILHAS, paraMundo, type Preset } from './mundo';

const em = (
  ilha: keyof typeof ILHAS,
  pos: [number, number, number],
  alvo: [number, number, number] = [0, 0, 0],
): Preset => {
  const o = ILHAS[ilha];
  return {
    pos: [o[0] + pos[0], o[1] + pos[1], o[2] + pos[2]],
    alvo: [o[0] + alvo[0], o[1] + alvo[1], o[2] + alvo[2]],
  };
};

/** Foco regional do cenário: RMPA (case) ou Vale do Taquari (atual). */
function foco(cenario: CenarioId): [number, number] {
  return cenario === 'atual'
    ? paraMundo(-29.45, -51.95)
    : cenario === 'case'
      ? paraMundo(-29.97, -51.22)
      : paraMundo(-29.75, -51.6);
}

export const PRESET_TELA: Record<string, (c: CenarioId) => Preset> = {
  panorama: () => ({ pos: [0, 82, 92], alvo: [2, 0, 4] }),
  'linha-do-tempo': () => ({ pos: [-8, 68, 84], alvo: [0, 0, 0] }),
  urgencia: () => em('prateleira', [0, 11, 24], [0, 3.5, 0]),
  arrecadacao: (c) => {
    const [x, z] = foco(c);
    return { pos: [x + 8, 24, z + 30], alvo: [x, 0, z] };
  },
  rotas: () => ({ pos: [4, 52, 64], alvo: [4, 0, 2] }),
  quadra: () => em('quadra', [0, 26, 34], [0, 0, 1]),
  gastos: () => em('kit', [0, 9, 21], [0, 3.6, 0]),
  administracao: () => em('organograma', [0, 26, 34], [0, 2, 0]),
  parceiros: (c) => {
    const [x, z] = foco(c);
    return { pos: [x + 4, 40, z + 48], alvo: [x, 0, z] };
  },
  fontes: () => em('bastidores', [0, 20, 36], [0, 6, 0]),
};

export function presetDaTela(
  tela: string,
  cenario: CenarioId,
  etapaApresentacao: number | null,
): Preset {
  void etapaApresentacao;
  return (PRESET_TELA[tela] ?? PRESET_TELA.panorama!)(cenario);
}
