import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import {
  carregarRelevo,
  tomElevacao,
  LARGURA_MUNDO,
  PROFUNDIDADE_MUNDO,
  Y_POR_METRO,
  type Relevo,
} from './mundo';
import { rgbTres } from './tema';

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
    const rampa = (['pedra-1', 'pedra-2', 'pedra-3', 'pedra-4', 'pedra-5'] as const).map(rgbTres);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        const m =
          relevo.z[
            Math.min(relevo.altura - 1, j * passo) * relevo.largura +
              Math.min(relevo.largura - 1, i * passo)
          ]!;
        // as bordas do DEM descem suavemente até a base: o terreno não termina num "paredão"
        const borda = Math.min(i, w - 1 - i, j, h - 1 - j) / (Math.min(w, h) * 0.07);
        const fb = Math.min(1, borda) ** 2 * (3 - 2 * Math.min(1, borda));
        pos.setY(k, Math.max(0, m) * Y_POR_METRO * fb);
        // pedra: várzea escura → serra clara, interpolando os tokens pedra-1…pedra-5
        const t = (m <= 1 ? 0 : 0.12 + tomElevacao(m) * 0.88) * fb;
        const f = t * (rampa.length - 1);
        const a = rampa[Math.floor(f)]!;
        const b = rampa[Math.min(rampa.length - 1, Math.floor(f) + 1)]!;
        const u = f - Math.floor(f);
        cores[k * 3] = a[0] + (b[0] - a[0]) * u;
        cores[k * 3 + 1] = a[1] + (b[1] - a[1]) * u;
        cores[k * 3 + 2] = a[2] + (b[2] - a[2]) * u;
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
