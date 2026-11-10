/** Cores do Three.js a partir dos mesmos tokens de src/styles/tokens.css. */
import * as THREE from 'three';
import { cor, type Token } from '../ui/cores';

const cache = new Map<Token, THREE.Color>();

export function corTres(t: Token): THREE.Color {
  let c = cache.get(t);
  if (!c) {
    c = new THREE.Color(cor(t));
    cache.set(t, c);
  }
  return c;
}

/** Componentes lineares [r, g, b] do token (para atributos de vértice). */
export const rgbTres = (t: Token): [number, number, number] =>
  corTres(t).toArray() as [number, number, number];
