/**
 * npm run gerar-contexto
 * Lê os contornos dos estados coletados (data/brutos/geodata-br-uf-*.json, espelho público da malha do IBGE),
 * simplifica (Douglas-Peucker) e grava public/geo/estados.json para o mapa de contexto do zoom out.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const UFS = [
  ['rs', 'Rio Grande do Sul'],
  ['sc', 'Santa Catarina'],
  ['pr', 'Paraná'],
  ['sp', 'São Paulo'],
  ['ms', 'Mato Grosso do Sul'],
  ['mg', 'Minas Gerais'],
  ['rj', 'Rio de Janeiro'],
] as const;
type Ponto = [number, number];
const TOLERANCIA_GRAUS = 0.025; // ~2,5 km: suficiente para o zoom de país/corredor
const AREA_MINIMA = 0.02; // graus²: descarta ilhotas

function simplificar(p: Ponto[], tol: number): Ponto[] {
  if (p.length < 3) return p;
  const manter = new Uint8Array(p.length);
  manter[0] = manter[p.length - 1] = 1;
  const pilha: [number, number][] = [[0, p.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop()!;
    const [ax, ay] = p[a]!;
    const [bx, by] = p[b]!;
    const dx = bx - ax;
    const dy = by - ay;
    const n = Math.hypot(dx, dy) || 1e-12;
    let maior = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      // anel fechado: o primeiro e o último ponto coincidem, então mede a distância ao ponto inicial
      const d =
        n < 1e-9
          ? Math.hypot(p[i]![0] - ax, p[i]![1] - ay)
          : Math.abs(dy * (p[i]![0] - ax) - dx * (p[i]![1] - ay)) / n;
      if (d > maior) {
        maior = d;
        idx = i;
      }
    }
    if (maior > tol && idx > 0) {
      manter[idx] = 1;
      pilha.push([a, idx], [idx, b]);
    }
  }
  return p.filter((_, i) => manter[i]);
}

const area = (p: Ponto[]) =>
  Math.abs(
    p.reduce(
      (s, [x, y], i) => s + x * p[(i + 1) % p.length]![1] - p[(i + 1) % p.length]![0] * y,
      0,
    ),
  ) / 2;

const manifesto = JSON.parse(readFileSync('data/brutos/manifesto.json', 'utf8')) as Record<
  string,
  { url: string; data_consulta: string }
>;
const estados = [];
for (const [uf, nome] of UFS) {
  const arq = join('data/brutos', `geodata-br-uf-${uf}.json`);
  if (!existsSync(arq)) {
    console.warn(`! sem ${arq} — rode a coleta-bruta`);
    continue;
  }
  const gj = JSON.parse(readFileSync(arq, 'utf8')) as {
    features?: { geometry: { type: string; coordinates: unknown } }[];
    geometry?: { type: string; coordinates: unknown };
  };
  const poligonos: Ponto[][] = [];
  for (const f of gj.features ?? (gj.geometry ? [{ geometry: gj.geometry }] : [])) {
    const multi =
      f.geometry.type === 'Polygon'
        ? [f.geometry.coordinates as Ponto[][]]
        : (f.geometry.coordinates as Ponto[][][]);
    for (const pol of multi) {
      const externo = pol[0]!;
      if (area(externo) < AREA_MINIMA) continue;
      const s = simplificar(externo, TOLERANCIA_GRAUS).map(
        ([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000] as Ponto,
      );
      if (s.length >= 4) poligonos.push(s);
    }
  }
  estados.push({ uf: uf.toUpperCase(), nome, poligonos });
  console.log(
    `${uf.toUpperCase()}: ${poligonos.length} polígono(s), ${poligonos.reduce((s, p) => s + p.length, 0)} pontos`,
  );
}
const ref = manifesto['geodata-br-uf-rs'];
writeFileSync(
  'public/geo/estados.json',
  JSON.stringify({
    fonte:
      'Contornos estaduais em GeoJSON — giuliano-macedo/geodata-br-states (derivado da malha estadual do IBGE)',
    url: 'https://github.com/giuliano-macedo/geodata-br-states',
    data_consulta: ref?.data_consulta?.slice(0, 10) ?? null,
    nota: `Simplificado (tolerância ${TOLERANCIA_GRAUS}°) para o mapa de contexto; não usar para medir áreas.`,
    estados,
  }),
);
console.log(`✓ public/geo/estados.json (${estados.length} estados)`);
