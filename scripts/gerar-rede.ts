/**
 * Gera a rede viária simplificada da operação (≈25 nós) a partir da geometria real das rodovias no
 * OpenStreetMap (data/brutos/osm-rodovias*.json) e das localizações reais de escolas, abrigos e bairros.
 *
 *  - Trechos de rodovia: km = comprimento do caminho mais curto sobre a geometria OSM entre os nós.
 *  - Último trecho urbano (rodovia → escola/abrigo/ponto): distância em linha reta × 1,3, marcado "estimado".
 *
 * Saídas: data/rede-viaria.json · public/geo/rotas.json (geometria das arestas) ·
 *         public/geo/rodovias.json e public/geo/rios.json (linhas simplificadas para o mapa 3D)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = process.cwd();
const BRUTOS = join(RAIZ, 'data', 'brutos');
const C = new Date().toISOString().slice(0, 10);

type LL = [number, number]; // [lat, lon]
interface Way {
  nodes: number[];
  geometry: { lat: number; lon: number }[];
  tags: Record<string, string>;
}

const hav = (a: LL, b: LL) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

function lerWays(arquivo: string): Way[] {
  const p = join(BRUTOS, arquivo);
  if (!existsSync(p)) return [];
  return (JSON.parse(readFileSync(p, 'utf8')) as { elements: Way[] }).elements.filter(
    (e) => e.nodes && e.geometry,
  );
}

const ways = [...lerWays('osm-rodovias.json'), ...lerWays('osm-rodovias-estaduais.json')];
const refsDe = (w: Way) =>
  (w.tags.ref ?? '')
    .split(';')
    .map((r) => r.trim().replace(/^RS-/, 'ERS-'))
    .filter(Boolean);

// ── grafo OSM ────────────────────────────────────────────────────────────────
const pos = new Map<number, LL>();
const refsNo = new Map<number, Set<string>>();
const adj = new Map<number, Map<number, number>>();
const ligar = (a: number, b: number, km: number) => {
  if (!adj.has(a)) adj.set(a, new Map());
  if (!adj.has(b)) adj.set(b, new Map());
  const atual = adj.get(a)!.get(b);
  if (atual === undefined || km < atual) {
    adj.get(a)!.set(b, km);
    adj.get(b)!.set(a, km);
  }
};
for (const w of ways) {
  const refs = refsDe(w);
  w.nodes.forEach((id, i) => {
    const g = w.geometry[i]!;
    pos.set(id, [g.lat, g.lon]);
    if (!refsNo.has(id)) refsNo.set(id, new Set());
    refs.forEach((r) => refsNo.get(id)!.add(r));
    if (i > 0) ligar(w.nodes[i - 1]!, id, hav(pos.get(w.nodes[i - 1]!)!, [g.lat, g.lon]));
  });
}
// costura: as alças (motorway_link) não foram baixadas; liga nós de rodovias diferentes a até 400 m
{
  const cel = 0.004;
  const grade = new Map<string, number[]>();
  const chave = (ll: LL) => `${Math.floor(ll[0] / cel)},${Math.floor(ll[1] / cel)}`;
  for (const [id, ll] of pos) {
    const k = chave(ll);
    if (!grade.has(k)) grade.set(k, []);
    grade.get(k)!.push(id);
  }
  for (const [id, ll] of pos) {
    const [ci, cj] = chave(ll).split(',').map(Number) as [number, number];
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++)
        for (const o of grade.get(`${ci + di},${cj + dj}`) ?? []) {
          if (o <= id) continue;
          const ra = refsNo.get(id)!;
          const rb = refsNo.get(o)!;
          const mesmas = [...ra].some((r) => rb.has(r));
          const d = hav(ll, pos.get(o)!);
          // mesma rodovia: fecha lacunas pequenas (pistas duplas, pontes); rodovias diferentes: alças
          if (d < (mesmas ? 0.25 : 0.4)) ligar(id, o, d * 1.2);
        }
  }
}

function snap(ll: LL, ref?: string): number {
  let melhor = -1;
  let dmin = Infinity;
  for (const [id, p] of pos) {
    if (ref && !refsNo.get(id)!.has(ref)) continue;
    const d = hav(ll, p);
    if (d < dmin) {
      dmin = d;
      melhor = id;
    }
  }
  return melhor;
}

function dijkstra(origem: number, destino: number): { km: number; caminho: number[] } | null {
  const dist = new Map<number, number>([[origem, 0]]);
  const ant = new Map<number, number>();
  const fila: [number, number][] = [[0, origem]];
  const visto = new Set<number>();
  while (fila.length) {
    fila.sort((a, b) => a[0] - b[0]);
    const [d, u] = fila.shift()!;
    if (visto.has(u)) continue;
    visto.add(u);
    if (u === destino) break;
    for (const [v, w] of adj.get(u) ?? []) {
      const nd = d + w;
      if (nd < (dist.get(v) ?? Infinity)) {
        dist.set(v, nd);
        ant.set(v, u);
        fila.push([nd, v]);
      }
    }
  }
  if (!dist.has(destino)) return null;
  const caminho = [destino];
  while (caminho[0] !== origem) caminho.unshift(ant.get(caminho[0]!)!);
  return { km: dist.get(destino)!, caminho };
}

// Douglas–Peucker simples em graus
function simplificar(pts: LL[], tol = 0.0012): LL[] {
  if (pts.length < 3) return pts;
  const dist = (p: LL, a: LL, b: LL) => {
    const [x, y] = [p[1], p[0]];
    const [x1, y1] = [a[1], a[0]];
    const [x2, y2] = [b[1], b[0]];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  };
  let idx = 0;
  let dmax = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = dist(pts[i]!, pts[0]!, pts[pts.length - 1]!);
    if (d > dmax) {
      dmax = d;
      idx = i;
    }
  }
  if (dmax <= tol) return [pts[0]!, pts[pts.length - 1]!];
  return [
    ...simplificar(pts.slice(0, idx + 1), tol).slice(0, -1),
    ...simplificar(pts.slice(idx), tol),
  ];
}
const r5 = (n: number) => Math.round(n * 1e5) / 1e5;

// ── definição da rede da operação ────────────────────────────────────────────
interface NoDef {
  id: string;
  nome: string;
  tipo: 'coleta' | 'quadra' | 'abrigo' | 'entroncamento';
  ll: LL;
  ref?: string;
}
const json = <T>(p: string): T => JSON.parse(readFileSync(join(RAIZ, p), 'utf8')) as T;
const escolas = json<{ escolas: { id: string; nome: string; lat: number; lon: number }[] }>(
  'data/escolas-base.json',
).escolas;
const abrigos = json<{ abrigos: { id: string; nome: string; lat: number; lon: number }[] }>(
  'data/abrigos.json',
).abrigos;
const parceiros = json<{
  parceiros: {
    id: string;
    nome: string;
    tipo_ajuda: string;
    lat: number;
    lon: number;
    ponto_coleta?: string;
  }[];
}>('data/simulado/parceiros.json').parceiros;

// Entroncamentos/acessos: ponto de referência aproximado é "grudado" no nó OSM mais próximo da rodovia indicada.
const ENTRONCAMENTOS: NoDef[] = [
  {
    id: 'e-lajeado',
    nome: 'Lajeado — acesso BR-386',
    tipo: 'entroncamento',
    ll: [-29.4591, -51.9644],
    ref: 'BR-386',
  },
  {
    id: 'e-estrela',
    nome: 'Estrela — acesso BR-386 (ponte sobre o Taquari)',
    tipo: 'entroncamento',
    ll: [-29.4935, -51.9562],
    ref: 'BR-386',
  },
  {
    id: 'e-tabai',
    nome: 'Tabaí — entroncamento BR-386 / BR-287',
    tipo: 'entroncamento',
    ll: [-29.7052, -51.6535],
    ref: 'BR-386',
  },
  {
    id: 'e-montenegro',
    nome: 'Montenegro — entroncamento BR-386 / BR-470',
    tipo: 'entroncamento',
    ll: [-29.7589, -51.5931],
    ref: 'BR-386',
  },
  {
    id: 'e-canoas-386',
    nome: 'Canoas — entroncamento BR-386 / BR-116',
    tipo: 'entroncamento',
    ll: [-29.875, -51.18],
    ref: 'BR-386',
  },
  {
    id: 'e-esteio-448',
    nome: 'Esteio/Sapucaia — BR-116 / BR-448',
    tipo: 'entroncamento',
    ll: [-29.84, -51.17],
    ref: 'BR-448',
  },
  {
    id: 'e-canoas-centro',
    nome: 'Canoas — BR-116 (centro)',
    tipo: 'entroncamento',
    ll: [-29.917, -51.178],
    ref: 'BR-116',
  },
  {
    id: 'e-poa-norte',
    nome: 'Porto Alegre — BR-116 / BR-290 (Freeway)',
    tipo: 'entroncamento',
    ll: [-29.972, -51.19],
    ref: 'BR-290',
  },
  {
    id: 'e-poa-448',
    nome: 'Porto Alegre — início da BR-448 (Rodovia do Parque)',
    tipo: 'entroncamento',
    ll: [-29.965, -51.2],
    ref: 'BR-448',
  },
  {
    id: 'e-ponte-guaiba',
    nome: 'Ponte do Guaíba / Rio Jacuí (BR-116 / BR-290)',
    tipo: 'entroncamento',
    ll: [-29.994, -51.279],
    ref: 'BR-290',
  },
  {
    id: 'e-eldorado',
    nome: 'Eldorado do Sul — BR-290 / BR-116',
    tipo: 'entroncamento',
    ll: [-30.005, -51.31],
    ref: 'BR-290',
  },
  {
    id: 'e-guaiba',
    nome: 'Guaíba — BR-116',
    tipo: 'entroncamento',
    ll: [-30.11, -51.33],
    ref: 'BR-116',
  },
];

// Trechos de rodovia (pares de nós ligados pela geometria real)
const TRECHOS: [string, string, string][] = [
  ['e-lajeado', 'e-estrela', 'BR-386'],
  ['e-estrela', 'e-tabai', 'BR-386'],
  ['e-tabai', 'e-montenegro', 'BR-386'],
  ['e-montenegro', 'e-canoas-386', 'BR-386'],
  ['e-canoas-386', 'e-esteio-448', 'BR-116'],
  ['e-canoas-386', 'e-canoas-centro', 'BR-116'],
  ['e-canoas-centro', 'e-poa-norte', 'BR-116'],
  ['e-esteio-448', 'e-poa-448', 'BR-448'],
  ['e-poa-448', 'e-poa-norte', 'BR-290'],
  ['e-poa-norte', 'e-ponte-guaiba', 'BR-116/BR-290'],
  ['e-ponte-guaiba', 'e-eldorado', 'BR-116/BR-290'],
  ['e-eldorado', 'e-guaiba', 'BR-116'],
];

const nosOp: NoDef[] = [
  ...ENTRONCAMENTOS,
  ...escolas.map((e) => ({
    id: e.id,
    nome: e.nome,
    tipo: 'quadra' as const,
    ll: [e.lat, e.lon] as LL,
  })),
  ...abrigos
    .filter((a) => !escolas.some((e) => e.id === a.id))
    .map((a) => ({ id: a.id, nome: a.nome, tipo: 'abrigo' as const, ll: [a.lat, a.lon] as LL })),
  ...parceiros
    .filter((p) => p.ponto_coleta)
    .map((p) => ({
      id: p.ponto_coleta!,
      nome: `Ponto de coleta — ${p.nome}`,
      tipo: 'coleta' as const,
      ll: [p.lat, p.lon] as LL,
    })),
];

const snapId = new Map<string, number>();
for (const n of ENTRONCAMENTOS) {
  const id = snap(n.ll, n.ref);
  snapId.set(n.id, id);
  n.ll = pos.get(id)!;
}

const URL_OSM = 'https://www.openstreetmap.org/';
const arestas: unknown[] = [];
const geometrias: Record<string, LL[]> = {};
for (const [de, para, via] of TRECHOS) {
  const r = dijkstra(snapId.get(de)!, snapId.get(para)!);
  if (!r) {
    console.warn(`sem caminho OSM ${de} → ${para}`);
    continue;
  }
  const id = `${de}__${para}`;
  geometrias[id] = simplificar(
    r.caminho.map((n) => pos.get(n)!),
    0.0006,
  ).map(([a, b]) => [r5(a), r5(b)]);
  arestas.push({
    id,
    de,
    para,
    via,
    km: {
      valor: Math.round(r.km * 10) / 10,
      unidade: 'km',
      fonte: `OpenStreetMap — comprimento da geometria da ${via}`,
      url: URL_OSM,
      data_referencia: C,
      data_consulta: C,
      camada: 'ATUAL',
      nota: 'Calculado sobre a geometria das rodovias no OSM (Overpass API). Alças de acesso aproximadas.',
    },
    velocidade_kmh: 60,
  });
}

// último trecho: cada quadra/abrigo/ponto se liga aos 2 entroncamentos mais próximos
for (const n of nosOp.filter((x) => x.tipo !== 'entroncamento')) {
  const prox = ENTRONCAMENTOS.map((e) => ({ e, d: hav(n.ll, e.ll) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  for (const { e, d } of prox) {
    if (d > 60) continue;
    const id = `${n.id}__${e.id}`;
    geometrias[id] = [n.ll, e.ll].map(([a, b]) => [r5(a), r5(b)]);
    arestas.push({
      id,
      de: n.id,
      para: e.id,
      via: 'vias urbanas',
      km: {
        valor: Math.round(d * 1.3 * 10) / 10,
        unidade: 'km',
        fonte: 'Estimativa: distância em linha reta × 1,3 (último trecho urbano)',
        url: URL_OSM,
        data_referencia: C,
        data_consulta: C,
        camada: 'ATUAL',
        nota: 'Distância estimada. Rodar npm run gerar-rotas na Action (OSRM) para obter a distância pelas ruas.',
      },
      velocidade_kmh: 30,
    });
  }
}

const bloqueiosArq = join(RAIZ, 'data', 'rede-viaria.json');
const anteriores = existsSync(bloqueiosArq)
  ? ((JSON.parse(readFileSync(bloqueiosArq, 'utf8')) as { bloqueios_reais?: unknown[] })
      .bloqueios_reais ?? [])
  : [];

writeFileSync(
  bloqueiosArq,
  JSON.stringify(
    {
      metodo_distancia:
        'Trechos de rodovia: comprimento da geometria OSM (Overpass). Último trecho urbano: linha reta × 1,3 (estimado).',
      nos: nosOp.map((n) => ({
        id: n.id,
        nome: n.nome,
        tipo: n.tipo,
        lat: r5(n.ll[0]),
        lon: r5(n.ll[1]),
        ...(n.ref ? { ref: n.ref } : {}),
      })),
      arestas,
      bloqueios_reais: anteriores,
    },
    null,
    2,
  ) + '\n',
);
writeFileSync(join(RAIZ, 'public', 'geo', 'rotas.json'), JSON.stringify(geometrias));

// linhas para o mapa: rodovias e rios simplificados
const linhas = (arqs: string[], chave: (w: Way) => string | null, tol: number) => {
  const out: Record<string, LL[][]> = {};
  for (const a of arqs)
    for (const w of lerWays(a)) {
      const k = chave(w);
      if (!k) continue;
      (out[k] ??= []).push(
        simplificar(
          w.geometry.map((g) => [g.lat, g.lon] as LL),
          tol,
        ).map(([x, y]) => [r5(x), r5(y)]),
      );
    }
  return out;
};
writeFileSync(
  join(RAIZ, 'public', 'geo', 'rodovias.json'),
  JSON.stringify(
    linhas(
      ['osm-rodovias.json', 'osm-rodovias-estaduais.json'],
      (w) => refsDe(w)[0] ?? null,
      0.002,
    ),
  ),
);
writeFileSync(
  join(RAIZ, 'public', 'geo', 'rios.json'),
  JSON.stringify(linhas(['osm-rios.json'], (w) => w.tags.name ?? null, 0.0015)),
);
console.log(`✓ rede: ${nosOp.length} nós, ${arestas.length} arestas`);
