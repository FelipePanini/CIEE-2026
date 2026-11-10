/**
 * Tipos dos custom elements do liquidglass (public/vendor/liquidglass/components.js) para o JSX.
 * O resto do app não usa estes elementos diretamente: só os wrappers de src/ui/vidro.
 */
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type Base = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  class?: string;
  /** seletor do backdrop a refratar, ou "none" */
  backdrop?: string;
  radius?: string | number;
  refraction?: string | number;
  bezel?: string | number;
  curvature?: string | number;
  chroma?: string | number;
  blur?: string | number;
  specular?: string | number;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lg-panel': Base & { tone?: 'light' };
      'lg-button': Base & {
        tone?: 'clear' | 'tinted' | 'light';
        disabled?: boolean;
        type?: string;
      };
      'lg-segmented': Base & { value?: string; label?: string };
      'lg-switch': Base & { checked?: boolean; disabled?: boolean };
      'lg-slider': Base & {
        min?: number | string;
        max?: number | string;
        step?: number | string;
        value?: number | string;
        label?: string;
        disabled?: boolean;
      };
      'lg-dock': Base;
    }
  }
}

export interface LgSegmentedEl extends HTMLElement {
  value: string;
  refresh(): void;
}
export interface LgSliderEl extends HTMLElement {
  value: number;
}
export interface LgSwitchEl extends HTMLElement {
  checked: boolean;
}
export interface ModuloLiquidGlass {
  toast: (
    mensagem: string,
    opcoes?: {
      icon?: 'check' | 'info' | 'alert' | 'bell' | null;
      duration?: number;
      container?: HTMLElement;
      tone?: 'dark' | 'light';
      backdrop?: string;
    },
  ) => { close(): void; element: HTMLElement };
}
