/**
 * Zoom como narrativa: país → corredor → bacia → cidade. A distância da câmera é atualizada a cada
 * quadro (sem re-render); o nível só muda quando cruza um limite, e é isso que os componentes escutam.
 * Também define qual "cena" do mundo cada tela mostra, para nada de outra tela aparecer ao afastar.
 */
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { useOperacao } from '../store';

export type NivelZoom = 'cidade' | 'bacia' | 'corredor' | 'pais';
/** Distância câmera→alvo em que cada nível termina. */
export const LIMITE_ZOOM = { cidade: 48, bacia: 300, corredor: 950 } as const;

export const zoom = { dist: 120 };
export const useZoom = create<{ nivel: NivelZoom }>(() => ({ nivel: 'bacia' }));

export function nivelDaDistancia(d: number): NivelZoom {
  return d < LIMITE_ZOOM.cidade
    ? 'cidade'
    : d < LIMITE_ZOOM.bacia
      ? 'bacia'
      : d < LIMITE_ZOOM.corredor
        ? 'corredor'
        : 'pais';
}

export function atualizarZoom(dist: number) {
  zoom.dist = dist;
  const nivel = nivelDaDistancia(dist);
  if (nivel !== useZoom.getState().nivel) useZoom.setState({ nivel });
}

export type Cena = 'bacia' | 'quadra' | 'prateleira' | 'kit' | 'organograma' | 'bastidores';
const CENA_DA_TELA: Record<string, Cena> = {
  urgencia: 'prateleira',
  quadra: 'quadra',
  gastos: 'kit',
  administracao: 'organograma',
  fontes: 'bastidores',
};
export const cenaDaTela = (tela: string): Cena => CENA_DA_TELA[tela] ?? 'bacia';

/** A cena fica visível na própria tela e por um instante depois de sair (durante o voo da câmera). */
export function useCenaVisivel(cena: Cena, margemMs = 1300): boolean {
  const ativa = useOperacao((s) => cenaDaTela(s.tela) === cena);
  const [visivel, setVisivel] = useState(ativa);
  useEffect(() => {
    if (ativa) {
      setVisivel(true);
      return;
    }
    const id = window.setTimeout(() => setVisivel(false), margemMs);
    return () => window.clearTimeout(id);
  }, [ativa, margemMs]);
  return ativa || visivel;
}
