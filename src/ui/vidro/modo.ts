/**
 * Como o vidro é desenhado, conforme a qualidade gráfica e a flag `vidro`:
 *   refracao — liquidglass de verdade (modo Alta): no Chrome refrata o Canvas 3D atrás
 *   blur     — `backdrop-filter: blur()` simples (modo Média)
 *   solido   — superfície translúcida sem filtro (modo 2D, flag desligada)
 */
import { useEffect } from 'react';
import { useFlag } from '../../config/flags';
import { useOperacao } from '../../store';
import { carregarVidro } from './carregar';

export type ModoVidro = 'refracao' | 'blur' | 'solido';

export function useModoVidro(): ModoVidro {
  const ligado = useFlag('vidro');
  const qualidade = useOperacao((s) => s.qualidade);
  if (!ligado || qualidade === '2d') return 'solido';
  return qualidade === 'alta' ? 'refracao' : 'blur';
}

/** Chamado uma vez no App: publica o modo em <html data-vidro> e carrega a lib quando precisa. */
export function useVidroGlobal() {
  const modo = useModoVidro();
  useEffect(() => {
    document.documentElement.dataset.vidro = modo;
    if (modo === 'refracao') void carregarVidro();
  }, [modo]);
}

/** Quantas superfícies refratam o fundo agora (orçamento: no máximo 8). */
export const contarVidros = () => document.querySelectorAll('.lg-surface').length;
