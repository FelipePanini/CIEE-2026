/**
 * Mapa 2D da bacia (fallback do 3D): relevo sombreado do Copernicus DEM + rios e rodovias (OSM)
 * + nós da operação. Projeção equirretangular no recorte do relevo.
 */
import { useEffect, useState, type ReactNode } from 'react';
import meta from '../../public/geo/relevo.json';

export type LL = [number, number];
const { bbox } = meta;
const LARG = 1000;
const ALT = Math.round((LARG * meta.altura) / meta.largura);

export const projetar = ([lat, lon]: LL): [number, number] => [
  ((lon - bbox.oeste) / (bbox.leste - bbox.oeste)) * LARG,
  ((bbox.norte - lat) / (bbox.norte - bbox.sul)) * ALT,
];

type Linhas = Record<string, LL[][]>;
let cacheGeo: Promise<{ rios: Linhas; rodovias: Linhas }> | null = null;
export function carregarGeo() {
  cacheGeo ??= Promise.all([
    fetch('/geo/rios.json').then((r) => r.json()),
    fetch('/geo/rodovias.json').then((r) => r.json()),
  ]).then(([rios, rodovias]) => ({ rios: rios as Linhas, rodovias: rodovias as Linhas }));
  return cacheGeo;
}

export function useGeo() {
  const [geo, setGeo] = useState<{ rios: Linhas; rodovias: Linhas } | null>(null);
  useEffect(() => {
    let vivo = true;
    carregarGeo()
      .then((g) => vivo && setGeo(g))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return geo;
}

const caminho = (pts: LL[]) =>
  pts
    .map(
      (p, i) =>
        `${i ? 'L' : 'M'}${projetar(p)
          .map((v) => v.toFixed(1))
          .join(',')}`,
    )
    .join('');

export interface PinoMapa {
  id: string;
  ll: LL;
  rotulo?: string;
  cor: string;
  raio: number;
  forma?: 'circulo' | 'quadrado' | 'losango';
  titulo?: string;
  pulsar?: boolean;
}

export interface LinhaMapa {
  id: string;
  pts: LL[];
  cor: string;
  largura: number;
  tracejado?: boolean;
  titulo?: string;
  onClick?: () => void;
}

interface Props {
  pinos?: PinoMapa[];
  linhas?: LinhaMapa[];
  /** recorte em [lat, lon] (sul, oeste, norte, leste); padrão = bacia inteira */
  recorte?: [number, number, number, number];
  mostrarRodovias?: boolean;
  rotuloAria: string;
  children?: ReactNode;
  className?: string;
  alturaMax?: string;
}

export function MapaSVG({
  pinos = [],
  linhas = [],
  recorte,
  mostrarRodovias = true,
  rotuloAria,
  children,
  className = '',
  alturaMax = '62vh',
}: Props) {
  const geo = useGeo();
  let vb = `0 0 ${LARG} ${ALT}`;
  if (recorte) {
    const [x0, y0] = projetar([recorte[2], recorte[1]]);
    const [x1, y1] = projetar([recorte[0], recorte[3]]);
    vb = `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
  }
  const escala = recorte
    ? (projetar([recorte[0], recorte[3]])[0] - projetar([recorte[2], recorte[1]])[0]) / LARG
    : 1;
  return (
    <svg
      viewBox={vb}
      role="img"
      aria-label={rotuloAria}
      className={`h-auto w-full rounded-xl bg-navy-950 ${className}`}
      style={{ maxHeight: alturaMax }}
      preserveAspectRatio="xMidYMid meet"
    >
      <image
        href="/geo/relevo-2d.png"
        x={0}
        y={0}
        width={LARG}
        height={ALT}
        preserveAspectRatio="none"
        opacity={0.62}
      />
      {geo &&
        Object.entries(geo.rios).flatMap(([nome, partes]) =>
          partes.map((p, i) => (
            <path
              key={nome + i}
              d={caminho(p)}
              fill="none"
              stroke="#6fb3b1"
              strokeWidth={(nome === 'Rio Jacuí' || nome === 'Rio Taquari' ? 2.4 : 1.6) * escala}
              strokeLinecap="round"
              opacity={0.85}
            />
          )),
        )}
      {geo &&
        mostrarRodovias &&
        Object.entries(geo.rodovias).flatMap(([ref, partes]) =>
          partes.map((p, i) => (
            <path
              key={ref + i}
              d={caminho(p)}
              fill="none"
              stroke="#f3efe6"
              strokeWidth={1.1 * escala}
              opacity={0.45}
            />
          )),
        )}
      {linhas.map((l) => (
        <path
          key={l.id}
          d={caminho(l.pts)}
          fill="none"
          stroke={l.cor}
          strokeWidth={l.largura * escala}
          strokeDasharray={l.tracejado ? `${6 * escala} ${4 * escala}` : undefined}
          strokeLinecap="round"
          onClick={l.onClick}
          style={l.onClick ? { cursor: 'pointer' } : undefined}
        >
          {l.titulo && <title>{l.titulo}</title>}
        </path>
      ))}
      {pinos.map((p) => {
        const [x, y] = projetar(p.ll);
        const r = p.raio * escala;
        return (
          <g key={p.id} transform={`translate(${x},${y})`}>
            {p.titulo && <title>{p.titulo}</title>}
            {p.pulsar && <circle r={r * 2.2} fill={p.cor} opacity={0.25} className="anima-pulso" />}
            {p.forma === 'quadrado' ? (
              <rect
                x={-r}
                y={-r}
                width={r * 2}
                height={r * 2}
                rx={r * 0.3}
                fill={p.cor}
                stroke="#0b1e26"
                strokeWidth={1.5 * escala}
              />
            ) : p.forma === 'losango' ? (
              <rect
                x={-r}
                y={-r}
                width={r * 2}
                height={r * 2}
                transform="rotate(45)"
                fill={p.cor}
                stroke="#0b1e26"
                strokeWidth={1.5 * escala}
              />
            ) : (
              <circle r={r} fill={p.cor} stroke="#0b1e26" strokeWidth={1.5 * escala} />
            )}
            {p.rotulo && (
              <text
                x={r + 4 * escala}
                y={4 * escala}
                fontSize={17 * escala}
                fill="#f3efe6"
                stroke="#0b1e26"
                strokeWidth={3 * escala}
                paintOrder="stroke"
                fontWeight={600}
              >
                {p.rotulo}
              </text>
            )}
          </g>
        );
      })}
      {children}
    </svg>
  );
}
