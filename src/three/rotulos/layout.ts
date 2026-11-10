/**
 * Colisão de rótulos em espaço de tela (função pura, testada).
 * Ordena por prioridade (1 = mais importante) e coloca um a um; quem bate em alguém já colocado some.
 * Quem já estava visível ganha uma pequena vantagem (histerese), para o mapa não "piscar".
 */
export interface CaixaRotulo {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  prioridade: number;
  /** distância à câmera: desempata a favor do mais próximo */
  distancia: number;
  visivelAntes?: boolean;
  /** fixo: sempre colocado (ex.: card expandido), só bloqueia os outros */
  fixo?: boolean;
}

export const colidem = (a: CaixaRotulo, b: CaixaRotulo, margem = 4) =>
  a.x < b.x + b.w + margem &&
  b.x < a.x + a.w + margem &&
  a.y < b.y + b.h + margem &&
  b.y < a.y + a.h + margem;

export function resolverColisoes(itens: CaixaRotulo[], margem = 4): Set<string> {
  const ordem = [...itens].sort(
    (a, b) =>
      Number(!!b.fixo) - Number(!!a.fixo) ||
      a.prioridade - (a.visivelAntes ? 0.3 : 0) - (b.prioridade - (b.visivelAntes ? 0.3 : 0)) ||
      a.distancia - b.distancia,
  );
  const colocados: CaixaRotulo[] = [];
  const visiveis = new Set<string>();
  for (const it of ordem) {
    if (!it.fixo && colocados.some((c) => colidem(it, c, margem))) continue;
    colocados.push(it);
    visiveis.add(it.id);
  }
  return visiveis;
}

/** Pares de caixas que se sobrepõem (usado nos testes de ponta a ponta; deve ser sempre 0). */
export function contarSobreposicoes(caixas: CaixaRotulo[]): number {
  let n = 0;
  for (let i = 0; i < caixas.length; i++)
    for (let j = i + 1; j < caixas.length; j++) if (colidem(caixas[i]!, caixas[j]!, 0)) n++;
  return n;
}
