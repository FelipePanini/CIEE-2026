import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  carregarRelevo,
  corElevacao,
  LARGURA_MUNDO,
  PROFUNDIDADE_MUNDO,
  Y_POR_METRO,
  type Relevo,
} from './mundo';

export function useRelevo(): Relevo | null {
  const [r, setR] = useState<Relevo | null>(null);
  useEffect(() => {
    let vivo = true;
    carregarRelevo()
      .then((x) => vivo && setR(x))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return r;
}

/** Terreno da bacia a partir do DEM reduzido. `passo` define a resolução (2 = alta, 3 = média). */
export function Terreno({ relevo, passo = 3 }: { relevo: Relevo; passo?: number }) {
  const geo = useMemo(() => {
    const w = Math.floor((relevo.largura - 1) / passo) + 1;
    const h = Math.floor((relevo.altura - 1) / passo) + 1;
    const g = new THREE.PlaneGeometry(LARGURA_MUNDO, PROFUNDIDADE_MUNDO, w - 1, h - 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const cores = new Float32Array(pos.count * 3);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        const m =
          relevo.z[
            Math.min(relevo.altura - 1, j * passo) * relevo.largura +
              Math.min(relevo.largura - 1, i * passo)
          ]!;
        pos.setY(k, Math.max(0, m) * Y_POR_METRO);
        const c = m <= 1 ? [0.08, 0.2, 0.25] : corElevacao(m);
        cores[k * 3] = c[0]!;
        cores[k * 3 + 1] = c[1]!;
        cores[k * 3 + 2] = c[2]!;
      }
    g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
    g.computeVertexNormals();
    return g;
  }, [relevo, passo]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
    </mesh>
  );
}
