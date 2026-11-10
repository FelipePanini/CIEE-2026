/**
 * Mapa de contexto do zoom out: Sul e Sudeste do Brasil em baixo relevo (contornos estaduais do IBGE).
 * Os estados são "terra" acima do mar de base; ao afastar a câmera além da bacia, as divisas e os
 * nomes aparecem com fade. É o palco do corredor Jaguariúna (SP) → RS.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { BBOX, paraMundo } from './mundo';
import { corTres } from './tema';
import { Y_MAR } from './Horizonte';
import { LIMITE_ZOOM, zoom } from './zoom';

export interface EstadosGeo {
  fonte: string;
  url: string;
  data_consulta: string | null;
  estados: { uf: string; nome: string; poligonos: [number, number][][] }[];
}

let cache: Promise<EstadosGeo | null> | null = null;
export const carregarEstados = () =>
  (cache ??= fetch('/geo/estados.json')
    .then((r) => (r.ok ? (r.json() as Promise<EstadosGeo>) : null))
    .catch(() => null));

export function useEstados() {
  const [e, setE] = useState<EstadosGeo | null>(null);
  useEffect(() => {
    let vivo = true;
    void carregarEstados().then((x) => vivo && setE(x));
    return () => {
      vivo = false;
    };
  }, []);
  return e;
}

const Y_TERRA = -0.04;

export function Contexto3D() {
  const geo = useEstados();
  const linhas = useRef<THREE.Group>(null);
  const terra = useMemo(() => {
    if (!geo) return null;
    const formas = geo.estados.flatMap((e) =>
      e.poligonos.map((pol) => {
        const s = new THREE.Shape();
        pol.forEach(([lon, lat], i) => {
          const [x, z] = paraMundo(lat, lon);
          if (i === 0) s.moveTo(x, -z);
          else s.lineTo(x, -z);
        });
        return s;
      }),
    );
    const g = new THREE.ExtrudeGeometry(formas, { depth: Y_TERRA - Y_MAR, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [geo]);
  useEffect(() => () => terra?.dispose(), [terra]);
  const divisas = useMemo(
    () =>
      geo?.estados.flatMap((e) =>
        e.poligonos.map((pol, i) => ({
          id: `${e.uf}-${i}`,
          uf: e.uf,
          pts: pol.map(([lon, lat]) => {
            const [x, z] = paraMundo(lat, lon);
            return [x, 0.05, z] as [number, number, number];
          }),
        })),
      ) ?? [],
    [geo],
  );
  const moldura = useMemo(() => {
    const [x0, z0] = paraMundo(BBOX.norte, BBOX.oeste);
    const [x1, z1] = paraMundo(BBOX.sul, BBOX.leste);
    return [
      [x0, 0.4, z0],
      [x1, 0.4, z0],
      [x1, 0.4, z1],
      [x0, 0.4, z1],
      [x0, 0.4, z0],
    ] as [number, number, number][];
  }, []);
  // divisas e moldura aparecem com fade quando a câmera passa do nível "bacia"
  useFrame(() => {
    const g = linhas.current;
    if (!g) return;
    const t = THREE.MathUtils.smoothstep(
      zoom.dist,
      LIMITE_ZOOM.bacia * 0.55,
      LIMITE_ZOOM.bacia * 1.15,
    );
    g.visible = t > 0.01;
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && 'opacity' in m) m.opacity = t * ((o.userData.forca as number | undefined) ?? 0.7);
    });
  });
  if (!terra) return null;
  return (
    <group>
      <mesh geometry={terra} position={[0, Y_MAR, 0]}>
        <meshStandardMaterial color={corTres('pedra-1')} roughness={1} metalness={0} />
      </mesh>
      <group ref={linhas} visible={false}>
        {divisas.map((d) => (
          <Line
            key={d.id}
            points={d.pts}
            color={corTres(d.uf === 'RS' ? 'cinza-2' : 'cinza-3')}
            lineWidth={d.uf === 'RS' ? 1.6 : 1}
            transparent
            opacity={0}
            userData={{ forca: d.uf === 'RS' ? 0.9 : 0.55 }}
          />
        ))}
        <Line
          points={moldura}
          color={corTres('texto')}
          lineWidth={1.4}
          transparent
          opacity={0}
          userData={{ forca: 0.8 }}
        />
      </group>
    </group>
  );
}
