/**
 * Sequência de paradas: vizinho mais próximo + melhoria 2-opt.
 * Rota aberta que começa no depósito (quadra-base) e volta a ele.
 */
export type Custo = (a: string, b: string) => number;

export function vizinhoMaisProximo(deposito: string, paradas: string[], custo: Custo): string[] {
  const resta = new Set(paradas.filter((p) => p !== deposito));
  const rota = [deposito];
  let atual = deposito;
  while (resta.size) {
    let melhor: string | null = null;
    let cMin = Infinity;
    for (const p of resta) {
      const c = custo(atual, p);
      if (c < cMin) {
        cMin = c;
        melhor = p;
      }
    }
    if (melhor === null || !Number.isFinite(cMin)) break; // paradas inalcançáveis ficam de fora
    rota.push(melhor);
    resta.delete(melhor);
    atual = melhor;
  }
  rota.push(deposito);
  return rota;
}

export function custoRota(rota: string[], custo: Custo): number {
  let s = 0;
  for (let i = 0; i < rota.length - 1; i++) s += custo(rota[i]!, rota[i + 1]!);
  return s;
}

/** 2-opt: inverte trechos enquanto houver ganho. Mantém o depósito nas pontas. */
export function doisOpt(rota: string[], custo: Custo, maxIter = 200): string[] {
  let melhor = rota.slice();
  let cMelhor = custoRota(melhor, custo);
  let melhorou = true;
  let it = 0;
  while (melhorou && it++ < maxIter) {
    melhorou = false;
    for (let i = 1; i < melhor.length - 2; i++) {
      for (let k = i + 1; k < melhor.length - 1; k++) {
        const nova = [
          ...melhor.slice(0, i),
          ...melhor.slice(i, k + 1).reverse(),
          ...melhor.slice(k + 1),
        ];
        const c = custoRota(nova, custo);
        if (c + 1e-9 < cMelhor) {
          melhor = nova;
          cMelhor = c;
          melhorou = true;
        }
      }
    }
  }
  return melhor;
}

export const sequenciarParadas = (deposito: string, paradas: string[], custo: Custo) =>
  doisOpt(vizinhoMaisProximo(deposito, paradas, custo), custo);
