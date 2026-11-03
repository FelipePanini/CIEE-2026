/**
 * Geometria do mundo 3D: projeção lat/lon → unidades da cena, relevo (Copernicus DEM) e níveis de água.
 * A bacia ocupa ~100 unidades de largura na origem; as outras "ilhas" (quadra, organograma,
 * bastidores) ficam deslocadas no mesmo mundo e a câmera viaja entre elas.
 */
import meta from '../../public/geo/relevo.json';

export const BBOX = meta.bbox;
export const LARGURA_MUNDO = 100;
const latMedia = ((BBOX.norte + BBOX.sul) / 2) * (Math.PI / 180);
const kmPorGrauLon = 111.32 * Math.cos(latMedia);
const kmLargura = (BBOX.leste - BBOX.oeste) * kmPorGrauLon;
const kmAltura = (BBOX.norte - BBOX.sul) * 110.57;
export const UNIDADES_POR_KM = LARGURA_MUNDO / kmLargura;
export const PROFUNDIDADE_MUNDO = kmAltura * UNIDADES_POR_KM;
/** Exagero vertical da maquete (relevo real × E). */
export const EXAGERO = 7;
export const Y_POR_METRO = (UNIDADES_POR_KM / 1000) * EXAGERO;

const cLon = (BBOX.oeste + BBOX.leste) / 2;
const cLat = (BBOX.norte + BBOX.sul) / 2;

export function paraMundo(lat: number, lon: number): [number, number] {
  return [(lon - cLon) * kmPorGrauLon * UNIDADES_POR_KM, (cLat - lat) * 110.57 * UNIDADES_POR_KM];
}

export interface Relevo {
  largura: number;
  altura: number;
  z: Int16Array;
}

let cache: Promise<Relevo> | null = null;
export function carregarRelevo(): Promise<Relevo> {
  cache ??= fetch('/geo/relevo.bin')
    .then((r) => r.arrayBuffer())
    .then((b) => ({ largura: meta.largura, altura: meta.altura, z: new Int16Array(b) }));
  return cache;
}

/** Elevação (m) do DEM em lat/lon, com interpolação bilinear. */
export function elevacao(r: Relevo, lat: number, lon: number): number {
  const fx = ((lon - BBOX.oeste) / (BBOX.leste - BBOX.oeste)) * (r.largura - 1);
  const fy = ((BBOX.norte - lat) / (BBOX.norte - BBOX.sul)) * (r.altura - 1);
  const x0 = Math.max(0, Math.min(r.largura - 2, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(r.altura - 2, Math.floor(fy)));
  const tx = fx - x0;
  const ty = fy - y0;
  const v = (x: number, y: number) => r.z[y * r.largura + x]!;
  return (
    v(x0, y0) * (1 - tx) * (1 - ty) +
    v(x0 + 1, y0) * tx * (1 - ty) +
    v(x0, y0 + 1) * (1 - tx) * ty +
    v(x0 + 1, y0 + 1) * tx * ty
  );
}

/** Menor elevação num raio (m) em torno do ponto — aproxima a superfície do rio no DEM. */
export function elevacaoMinima(r: Relevo, lat: number, lon: number, raioKm = 1.2): number {
  let min = Infinity;
  const dLat = raioKm / 110.57;
  const dLon = raioKm / kmPorGrauLon;
  for (let i = -4; i <= 4; i++)
    for (let j = -4; j <= 4; j++)
      min = Math.min(min, elevacao(r, lat + (i / 4) * dLat, lon + (j / 4) * dLon));
  return min;
}

/** Paleta da maquete por elevação (navy → piscina → creme). */
export function corElevacao(m: number): [number, number, number] {
  const a = [0.13, 0.27, 0.3];
  const b = [0.33, 0.52, 0.5];
  const c = [0.86, 0.82, 0.74];
  const t = Math.min(1, Math.sqrt(Math.max(0, m) / 900));
  const mix = (x: number[], y: number[], k: number) =>
    x.map((v, i) => v + (y[i]! - v) * k) as [number, number, number];
  return t < 0.35 ? mix(a, b, t / 0.35) : mix(b, c, (t - 0.35) / 0.65);
}

/** Presets de câmera por tela: [posição, alvo]. Transição suave (~1 s) entre eles. */
export type Preset = { pos: [number, number, number]; alvo: [number, number, number] };

export const ILHAS = {
  bacia: [0, 0, 0] as [number, number, number],
  quadra: [180, 0, 0] as [number, number, number],
  prateleira: [180, 0, 70] as [number, number, number],
  kit: [180, 0, -70] as [number, number, number],
  organograma: [-170, 0, 0] as [number, number, number],
  bastidores: [0, 0, -190] as [number, number, number],
};
