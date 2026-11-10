/**
 * Leitor único dos tokens de cor em JavaScript (gráficos Recharts, canvas 2D e, via src/three/tema.ts,
 * os materiais do Three.js). As cores vivem só em src/styles/tokens.css.
 */
import type { Camada } from '../engine/tipos';

export type Token =
  | 'preto'
  | 'branco'
  | 'fundo-0'
  | 'fundo-1'
  | 'fundo-2'
  | 'fundo-3'
  | 'texto'
  | 'texto-2'
  | 'texto-3'
  | 'claro'
  | 'linha-fraca'
  | 'linha'
  | 'linha-forte'
  | 'superficie'
  | 'superficie-2'
  | 'superficie-3'
  | 'alerta'
  | 'atencao'
  | 'ok'
  | 'agua'
  | 'agua-funda'
  | 'agua-brilho'
  | 'pedra-1'
  | 'pedra-2'
  | 'pedra-3'
  | 'pedra-4'
  | 'pedra-5'
  | 'cinza-1'
  | 'cinza-2'
  | 'cinza-3'
  | 'cinza-4';

const cache = new Map<Token, string>();

/** Valor do token em hexadecimal. Fora do navegador (testes do motor) devolve um cinza neutro. */
export function cor(t: Token): string {
  const salvo = cache.get(t);
  if (salvo) return salvo;
  if (typeof document === 'undefined') return 'gray';
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-${t}`).trim();
  if (v) cache.set(t, v);
  return v || 'gray';
}

/** Token opaco com transparência (0 a 1), para canvas 2D e gradientes. */
export function corAlfa(t: Token, alfa: number): string {
  const base = cor(t);
  if (!base.startsWith('#') || base.length !== 7) return base;
  return `${base}${Math.round(Math.max(0, Math.min(1, alfa)) * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/** Token em forma de variável CSS, para estilos inline. */
export const varCor = (t: Token) => `var(--color-${t})`;

/** As camadas de dado não têm mais cor própria: distinguem-se por tom de cinza, símbolo e texto. */
export const TOKEN_CAMADA: Record<Camada, Token> = {
  HISTORICO: 'cinza-3',
  ATUAL: 'cinza-1',
  PREVISAO: 'cinza-2',
  SIMULADO: 'cinza-4',
};
export const SIMBOLO_CAMADA: Record<Camada, string> = {
  HISTORICO: '◆',
  ATUAL: '●',
  PREVISAO: '◐',
  SIMULADO: '◇',
};
export const corCamada = (c: Camada) => cor(TOKEN_CAMADA[c]);

/** Termômetro de urgência: vermelho abaixo do prazo crítico, âmbar em atenção, verde coberto. */
export const corUrgencia = (u: number, critico: boolean) =>
  critico && u >= 0.5 ? varCor('alerta') : u >= 0.25 ? varCor('atencao') : varCor('ok');

/** Séries dos gráficos: escala de cinzas (a identidade vem do rótulo direto, não da cor). */
export const TOKENS_SERIE: Token[] = ['cinza-1', 'cinza-2', 'cinza-3', 'cinza-4'];
export const corSerie = (i: number) => cor(TOKENS_SERIE[i % TOKENS_SERIE.length]!);
