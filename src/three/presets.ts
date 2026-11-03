import type { CenarioId } from '../engine/cenarios';
import { ILHAS, paraMundo, type Preset } from './mundo';
import { ETAPAS } from '../modules/apresentacao/etapas';

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
  // na situação atual a crise está no Vale do Taquari: a câmera desce sobre ele
  panorama: (c) => {
    if (c !== 'atual') return { pos: [0, 82, 92], alvo: [2, 0, 4] };
    const [x, z] = foco(c);
    return { pos: [x + 10, 50, z + 62], alvo: [x + 6, 0, z + 6] };
  },
  'linha-do-tempo': () => ({ pos: [-4, 80, 92], alvo: [3, 0, 3] }),
  urgencia: () => em('prateleira', [0, 11, 24], [0, 3.5, 0]),
  arrecadacao: (c) => {
    const [x, z] = foco(c);
    return { pos: [x + 8, 24, z + 30], alvo: [x, 0, z] };
  },
  rotas: () => ({ pos: [4, 52, 64], alvo: [4, 0, 2] }),
  quadra: () => em('quadra', [0, 26, 34], [0, 0, 1]),
  gastos: () => em('kit', [0, 9, 21], [0, 3.6, 0]),
  administracao: () => em('organograma', [0, 26, 34], [0, 2, 0]),
  // a rede de parceiros cobre as duas regiões (RMPA e Vale): visão da bacia inteira
  parceiros: () => ({ pos: [3, 78, 90], alvo: [3, 0, 4] }),
  // alvo à esquerda do centro da pilha: os rótulos (à esquerda das placas) não ficam sob a navegação
  fontes: () => em('bastidores', [-7, 22, 40], [-7, 5, 0]),
};

/** Abertura do Modo Apresentação: começa alto e longe e desce até a RMPA enquanto a água sobe. */
export const VOO_ABERTURA: { inicio: Preset; fim: Preset } = {
  inicio: { pos: [-70, 190, 230], alvo: [0, 0, 0] },
  fim: { pos: [4, 52, 66], alvo: [12, 0, 12] },
};
/** Encerramento: a bacia inteira vista de longe. */
const ENCERRAMENTO: Preset = { pos: [0, 118, 150], alvo: [0, 0, 6] };

export function presetDaTela(
  tela: string,
  cenario: CenarioId,
  etapaApresentacao: number | null,
): Preset {
  const especial = etapaApresentacao === null ? undefined : ETAPAS[etapaApresentacao]?.camera;
  if (especial === 'abertura') return VOO_ABERTURA.fim;
  // bastidores na apresentação: um pouco mais longe e mais alto, para o texto caber embaixo
  if (etapaApresentacao !== null && tela === 'fontes')
    return em('bastidores', [0, 25, 56], [0, 0.5, 0]);
  if (especial === 'encerramento') return ENCERRAMENTO;
  return (PRESET_TELA[tela] ?? PRESET_TELA.panorama!)(cenario);
}

export const cameraEspecial = (etapa: number | null) =>
  etapa === null ? undefined : ETAPAS[etapa]?.camera;
