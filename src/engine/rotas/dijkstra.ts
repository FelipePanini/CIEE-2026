import { horasAresta, type Aresta, type Grafo } from './grafo';

export interface Caminho {
  nos: string[];
  arestas: Aresta[];
  km: number;
  horas: number;
}

/** Menor caminho (por tempo de viagem) entre dois nós. Retorna null se não houver rota. */
export function dijkstra(
  g: Grafo,
  origem: string,
  destino: string,
  peso: (a: Aresta) => number = horasAresta,
): Caminho | null {
  if (origem === destino) return { nos: [origem], arestas: [], km: 0, horas: 0 };
  const dist = new Map<string, number>([[origem, 0]]);
  const ant = new Map<string, { no: string; aresta: Aresta }>();
  const visitado = new Set<string>();
  const fila: [number, string][] = [[0, origem]];
  while (fila.length) {
    let iMin = 0;
    for (let i = 1; i < fila.length; i++) if (fila[i]![0] < fila[iMin]![0]) iMin = i;
    const [d, u] = fila.splice(iMin, 1)[0]!;
    if (visitado.has(u)) continue;
    visitado.add(u);
    if (u === destino) break;
    for (const { para, aresta } of g.adj.get(u) ?? []) {
      const nd = d + peso(aresta);
      if (nd < (dist.get(para) ?? Infinity)) {
        dist.set(para, nd);
        ant.set(para, { no: u, aresta });
        fila.push([nd, para]);
      }
    }
  }
  if (!dist.has(destino)) return null;
  const nos = [destino];
  const arestas: Aresta[] = [];
  while (nos[0] !== origem) {
    const a = ant.get(nos[0]!)!;
    arestas.unshift(a.aresta);
    nos.unshift(a.no);
  }
  return {
    nos,
    arestas,
    km: arestas.reduce((s, a) => s + a.km, 0),
    horas: arestas.reduce((s, a) => s + horasAresta(a), 0),
  };
}

/** Matriz de menores caminhos entre um conjunto de nós (para a sequência de paradas). */
export function matrizCaminhos(g: Grafo, nos: string[]): Map<string, Map<string, Caminho | null>> {
  const m = new Map<string, Map<string, Caminho | null>>();
  for (const a of nos) {
    const linha = new Map<string, Caminho | null>();
    for (const b of nos)
      linha.set(b, a === b ? { nos: [a], arestas: [], km: 0, horas: 0 } : dijkstra(g, a, b));
    m.set(a, linha);
  }
  return m;
}
