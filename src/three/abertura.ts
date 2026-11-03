/**
 * Relógio compartilhado da abertura do Modo Apresentação: a água sobe do nível normal até o pico de
 * maio/2024 enquanto os contadores (municípios, desabrigados) sobem junto. O 3D (useFrame) e o HTML
 * (requestAnimationFrame) leem o mesmo progresso, então água e números andam sincronizados.
 */
export const DURACAO_ABERTURA_S = 9;

const relogio: { t0: number | null; instantaneo: boolean } = { t0: null, instantaneo: false };

export function iniciarAbertura(instantaneo = false) {
  relogio.t0 = performance.now() / 1000;
  relogio.instantaneo = instantaneo;
}

export function encerrarAbertura() {
  relogio.t0 = null;
}

/** null fora da abertura; 0→1 durante (com easing), 1 depois de terminar enquanto a etapa durar. */
export function progressoAbertura(): number | null {
  if (relogio.t0 === null) return null;
  if (relogio.instantaneo) return 1;
  const t = Math.min(1, Math.max(0, (performance.now() / 1000 - relogio.t0) / DURACAO_ABERTURA_S));
  // espera 0,8 s de voo antes de a água começar a subir
  const u = Math.min(1, Math.max(0, (t * DURACAO_ABERTURA_S - 0.8) / (DURACAO_ABERTURA_S - 0.8)));
  return u * u * (3 - 2 * u);
}
