/**
 * Carrega a biblioteca liquidglass vendorizada (public/vendor/liquidglass) sob demanda.
 * Fica fora do bundle de propósito: é servida como arquivo estático (e pré-carregada pelo PWA),
 * exatamente como o "Get started" do site orienta para quem hospeda os dois arquivos.
 */
import type { ModuloLiquidGlass } from './lg';

const URL_LIB = '/vendor/liquidglass/components.js';
let promessa: Promise<ModuloLiquidGlass | null> | null = null;
let modulo: ModuloLiquidGlass | null = null;

export function carregarVidro(): Promise<ModuloLiquidGlass | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  promessa ??= (import(/* @vite-ignore */ URL_LIB) as Promise<ModuloLiquidGlass>)
    .then((m) => {
      modulo = m;
      document.documentElement.dataset.vidroLib = 'ok';
      return m;
    })
    .catch(() => {
      document.documentElement.dataset.vidroLib = 'falhou';
      return null;
    });
  return promessa;
}

export const vidroCarregado = () => modulo;
