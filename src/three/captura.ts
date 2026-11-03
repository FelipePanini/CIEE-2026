/**
 * Ponte sem three.js entre o Canvas e a interface: o Palco registra uma função que renderiza o quadro
 * atual e devolve o PNG (usado no card do LinkedIn). Sem 3D (modo 2D), devolve null.
 */
let capturador: (() => string | null) | null = null;

export function registrarCaptura(f: (() => string | null) | null) {
  capturador = f;
}

export function capturarQuadro3D(): string | null {
  try {
    return capturador?.() ?? null;
  } catch {
    return null;
  }
}
