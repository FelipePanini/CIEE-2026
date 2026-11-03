/** Grafo não direcionado da rede viária da operação. */
export interface Aresta {
  id: string;
  de: string;
  para: string;
  km: number;
  velocidadeKmh: number;
  via: string;
}

export interface Grafo {
  nos: string[];
  arestas: Aresta[];
  adj: Map<string, { para: string; aresta: Aresta }[]>;
}

export function criarGrafo(
  nos: string[],
  arestas: Aresta[],
  bloqueadas: ReadonlySet<string> = new Set(),
): Grafo {
  const adj = new Map<string, { para: string; aresta: Aresta }[]>();
  for (const n of nos) adj.set(n, []);
  for (const a of arestas) {
    if (bloqueadas.has(a.id)) continue;
    adj.get(a.de)?.push({ para: a.para, aresta: a });
    adj.get(a.para)?.push({ para: a.de, aresta: a });
  }
  return { nos, arestas, adj };
}

export const horasAresta = (a: Aresta) => a.km / a.velocidadeKmh;
