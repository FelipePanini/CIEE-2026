/**
 * Ilha "quadra": a quadra poliesportiva da escola-base com a linha descarga → triagem → montagem →
 * estação do bilhete → expedição. Caixas em fluxo (instancing) andam na vazão de cada zona; voluntários
 * como figuras simples (um por voluntário); a zona gargalo pulsa e acumula fila.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useOperacao, useResultado } from '../store';
import { ZONAS } from '../engine/producao';
import { ILHAS } from './mundo';

const LARG = 30; // m (quadra de ~28 × 16 m)
const PROF = 17;
const CORES_ZONA = ['#8cc7c5', '#bd8413', '#2fa8a3', '#8f7ae0', '#e8603f'];
const MAX_CAIXAS = 90;
const MAX_VOL = 60;
const xZona = (i: number) => -LARG / 2 + 3 + i * ((LARG - 6) / (ZONAS.length - 1));

export function Quadra3D() {
  const r = useResultado();
  const rotulos = useOperacao((s) => s.tela) === 'quadra';
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const pr = r.producao;
  const gargaloIdx = ZONAS.findIndex((z) => z.id === pr.gargalo);
  const maxVazao = Math.max(...pr.porZona.map((z) => z.kitsHora), 1);

  // caixas: cada uma tem posição s (0..1 ao longo da linha). Velocidade local ∝ vazão da zona.
  const caixas = useRef<THREE.InstancedMesh>(null);
  const estado = useMemo(
    () => Array.from({ length: MAX_CAIXAS }, (_, i) => ({ s: i / MAX_CAIXAS, lane: (i % 3) - 1 })),
    [],
  );
  const mtx = useMemo(() => new THREE.Object3D(), []);
  const vel = pr.porZona.map((z) => 0.02 + (z.kitsHora / maxVazao) * 0.06);
  const nCaixas = Math.min(MAX_CAIXAS, Math.max(12, Math.round(r.custos.kitsTotal / 8)));

  const pulso = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }, dt) => {
    const m = caixas.current;
    if (m) {
      for (let i = 0; i < MAX_CAIXAS; i++) {
        const c = estado[i]!;
        const zona = Math.min(ZONAS.length - 1, Math.floor(c.s * ZONAS.length));
        if (!pausado) {
          // fila antes do gargalo: as caixas desaceleram perto dele
          const antesGargalo = zona === gargaloIdx - 1 || zona === gargaloIdx;
          c.s += dt * vel[zona]! * (antesGargalo ? 0.55 : 1);
          if (c.s > 1) c.s -= 1;
        }
        const x = -LARG / 2 + 3 + c.s * (LARG - 6);
        mtx.position.set(x, 0.95, c.lane * 0.55);
        mtx.scale.setScalar(i < nCaixas ? 1 : 0);
        mtx.updateMatrix();
        m.setMatrixAt(i, mtx.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
    if (pulso.current)
      pulso.current.emissiveIntensity =
        0.35 + (pausado ? 0 : Math.sin(clock.elapsedTime * 4) * 0.3);
  });

  // voluntários: uma figura por voluntário, distribuída ao redor da sua zona
  const vols = useRef<THREE.InstancedMesh>(null);
  const cabecas = useRef<THREE.InstancedMesh>(null);
  const posVol = useMemo(() => {
    const out: [number, number][] = [];
    pr.porZona.forEach((z, i) => {
      for (let k = 0; k < Math.min(z.voluntarios, 14); k++) {
        const lado = k % 2 ? 1 : -1;
        out.push([xZona(i) + ((k >> 1) % 3) * 0.9 - 0.9, lado * (2 + Math.floor(k / 6) * 0.9)]);
      }
    });
    return out.slice(0, MAX_VOL);
  }, [pr.porZona]);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < MAX_VOL; i++) {
      const p = posVol[i];
      o.position.set(p ? p[0] : 0, 0.75, p ? p[1] : 0);
      o.scale.setScalar(p ? 1 : 0);
      o.updateMatrix();
      vols.current?.setMatrixAt(i, o.matrix);
      o.position.y = 1.75;
      o.updateMatrix();
      cabecas.current?.setMatrixAt(i, o.matrix);
    }
    if (vols.current) vols.current.instanceMatrix.needsUpdate = true;
    if (cabecas.current) cabecas.current.instanceMatrix.needsUpdate = true;
  }, [posVol]);

  return (
    <group position={ILHAS.quadra}>
      {/* piso e marcações da quadra */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <planeGeometry args={[LARG + 4, PROF + 4]} />
        <meshStandardMaterial color="#1f4350" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <planeGeometry args={[LARG, PROF]} />
        <meshStandardMaterial color="#d9774f" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[2.6, 2.75, 48]} />
        <meshBasicMaterial color="#f3efe6" />
      </mesh>
      {/* paredes baixas (maquete) */}
      {[
        [0, -PROF / 2 - 2, LARG + 4, 0.3],
        [0, PROF / 2 + 2, LARG + 4, 0.3],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x!, 1, z!]}>
          <boxGeometry args={[w!, 2, d!]} />
          <meshStandardMaterial color="#f3efe6" transparent opacity={0.35} />
        </mesh>
      ))}
      {/* esteira da linha */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[LARG - 4, 0.8, 2.4]} />
        <meshStandardMaterial color="#17343d" />
      </mesh>
      {/* zonas */}
      {pr.porZona.map((z, i) => {
        const gargalo = i === gargaloIdx;
        return (
          <group key={z.zona} position={[xZona(i), 0, 0]}>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
              <planeGeometry args={[4.4, PROF - 2]} />
              <meshStandardMaterial
                ref={gargalo ? pulso : undefined}
                color={CORES_ZONA[i]}
                emissive={gargalo ? '#ef6a4b' : '#000000'}
                transparent
                opacity={0.55}
              />
            </mesh>
            {/* coluna de vazão: altura ∝ kits/h */}
            <mesh position={[0, 0.4 + (z.kitsHora / maxVazao) * 2.5, -PROF / 2 + 1.5]}>
              <boxGeometry args={[1.2, (z.kitsHora / maxVazao) * 5, 0.6]} />
              <meshStandardMaterial color={gargalo ? '#ef6a4b' : '#8cc7c5'} />
            </mesh>
            {rotulos && (
              <Html
                position={[0, 3.6, -PROF / 2 + 1.5]}
                center
                distanceFactor={26}
                zIndexRange={[5, 0]}
                className="pointer-events-none select-none"
              >
                <div
                  className={`whitespace-nowrap rounded px-2 py-1 text-center text-[12px] leading-tight ${gargalo ? 'bg-coral-500 text-navy-950' : 'bg-navy-950/85 text-creme-100'}`}
                >
                  <strong>{ZONAS[i]!.nome}</strong>
                  <div>
                    {Math.round(z.kitsHora)} kits/h · {z.voluntarios} vol.
                  </div>
                  {gargalo && <div className="font-bold">GARGALO</div>}
                </div>
              </Html>
            )}
          </group>
        );
      })}
      <instancedMesh ref={caixas} args={[undefined, undefined, MAX_CAIXAS]}>
        <boxGeometry args={[0.5, 0.36, 0.42]} />
        <meshStandardMaterial color="#c89a63" />
      </instancedMesh>
      <instancedMesh ref={vols} args={[undefined, undefined, MAX_VOL]}>
        <capsuleGeometry args={[0.22, 0.8, 4, 8]} />
        <meshStandardMaterial color="#2fa8a3" />
      </instancedMesh>
      <instancedMesh ref={cabecas} args={[undefined, undefined, MAX_VOL]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color="#f3efe6" />
      </instancedMesh>
      {rotulos && (
        <Html
          position={[0, 5.5, PROF / 2 + 1]}
          center
          distanceFactor={30}
          zIndexRange={[5, 0]}
          className="pointer-events-none select-none"
        >
          <div className="font-display whitespace-nowrap text-[18px] text-creme-100 [text-shadow:0_2px_6px_#0b1e26]">
            Linha da quadra: {Math.round(pr.kitsHora.valor)} kits/h
          </div>
        </Html>
      )}
    </group>
  );
}
