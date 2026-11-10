/**
 * Ilha "organograma vivo": o Líder no centro e as 4 áreas em órbita, com os papéis do Diário de Bordo.
 * Cada alerta, mensagem ou Carta de Crise dispara pulsos de luz pelas conexões (líder → área → papéis).
 * A cor de cada área é o semáforo calculado pelo motor.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Rotulo } from './Rotulo';
import { useOperacao, useResultado } from '../store';
import { AREAS_ORG, PAPEIS, type AreaOrg } from '../modules/administracao/organograma';
import { ILHAS } from './mundo';
import { cor } from '../ui/cores';

const COR_SEM = { verde: cor('ok'), amarelo: cor('atencao'), vermelho: cor('alerta') } as const;
const RAIO = 9;
const AREAS = AREAS_ORG.filter((a) => a.id !== 'lider');

interface Pulso {
  area: AreaOrg;
  t0: number;
  cor: string;
}

/** Fila global de pulsos (também alimentada pela Carta de Crise). */
export const pulsosOrg: Pulso[] = [];
export function dispararPulso(area: AreaOrg | 'todas', corPulso = cor('atencao')) {
  const agora = performance.now() / 1000;
  const alvos = area === 'todas' ? AREAS.map((a) => a.id) : [area];
  for (const a of alvos) pulsosOrg.push({ area: a, t0: agora, cor: corPulso });
}

export function Organograma3D() {
  const r = useResultado();
  const tela = useOperacao((s) => s.tela);
  const nomes = useOperacao((s) => s.organograma);
  const mensagens = useOperacao((s) => s.mensagens);
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const rot = useRef<THREE.Group>(null);
  const esferas = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const rotulos = tela === 'administracao';

  // novos alertas/mensagens → pulsos
  const nAlertas = r.alertas.length;
  const ultimo = useRef({ alertas: nAlertas, msgs: mensagens.length });
  useEffect(() => {
    if (mensagens.length > ultimo.current.msgs) {
      const m = mensagens[0]!;
      dispararPulso(
        (AREAS.some((a) => a.id === m.para) ? m.para : 'todas') as AreaOrg | 'todas',
        cor('cinza-2'),
      );
    }
    if (nAlertas > ultimo.current.alertas) {
      const novo = r.alertas[r.alertas.length - 1];
      dispararPulso(
        novo && novo.area !== 'lider' ? (novo.area as AreaOrg) : 'todas',
        cor('alerta'),
      );
    }
    ultimo.current = { alertas: nAlertas, msgs: mensagens.length };
  }, [nAlertas, mensagens, r.alertas]);

  const posArea = (i: number): [number, number, number] => {
    const a = (i / AREAS.length) * Math.PI * 2 + Math.PI / 4;
    return [Math.cos(a) * RAIO, 1.2, Math.sin(a) * RAIO];
  };

  useFrame((_, dt) => {
    if (rot.current && !pausado) rot.current.rotation.y += dt * 0.08;
    const m = esferas.current;
    if (!m) return;
    const agora = performance.now() / 1000;
    let k = 0;
    for (let i = pulsosOrg.length - 1; i >= 0; i--)
      if (agora - pulsosOrg[i]!.t0 > 2.2) pulsosOrg.splice(i, 1);
    for (const p of pulsosOrg) {
      if (k >= 40) break;
      const idx = AREAS.findIndex((a) => a.id === p.area);
      const [x, y, z] = posArea(idx);
      const t = Math.min(1, (agora - p.t0) / 1.2);
      tmp.position.set(x * t, 3.2 + (y - 3.2) * t, z * t);
      tmp.scale.setScalar(0.5 + Math.sin(t * Math.PI) * 0.4);
      tmp.updateMatrix();
      m.setMatrixAt(k, tmp.matrix);
      m.setColorAt(k, new THREE.Color(p.cor));
      k++;
    }
    m.count = k;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <group position={ILHAS.organograma}>
      <mesh position={[0, -0.05, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[RAIO + 6, 64]} />
        <meshStandardMaterial color={cor('fundo-2')} />
      </mesh>
      {/* Líder do Projeto */}
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color={cor('texto')}
          emissive={cor('texto')}
          emissiveIntensity={0.35}
        />
      </mesh>
      <Rotulo
        visivel={rotulos}
        position={[0, 5.4, 0]}
        center
        distanceFactor={30}
        zIndexRange={[5, 0]}
        className="pointer-events-none select-none"
      >
        <div className="whitespace-nowrap rounded bg-texto px-2 py-1 text-center text-[13px] font-bold text-fundo-0">
          Líder do Projeto{nomes.lider ? ` · ${nomes.lider}` : ''}
        </div>
      </Rotulo>
      <group ref={rot}>
        {AREAS.map((a, i) => {
          const p = posArea(i);
          const sem = r.semaforo[a.id as keyof typeof r.semaforo];
          const papeis = PAPEIS.filter((x) => x.area === a.id);
          return (
            <group key={a.id}>
              <Line
                points={[[0, 3.2, 0], p]}
                color={cor('cinza-2')}
                lineWidth={2}
                transparent
                opacity={0.8}
              />
              <mesh position={p}>
                <sphereGeometry args={[1, 24, 24]} />
                <meshStandardMaterial
                  color={COR_SEM[sem]}
                  emissive={COR_SEM[sem]}
                  emissiveIntensity={sem === 'vermelho' ? 0.5 : 0.2}
                />
              </mesh>
              {papeis.map((pp, j) => {
                const ang = (j / papeis.length) * Math.PI * 2;
                const q: [number, number, number] = [
                  p[0] + Math.cos(ang) * 2.6,
                  0.5,
                  p[2] + Math.sin(ang) * 2.6,
                ];
                return (
                  <group key={pp.id}>
                    <Line
                      points={[p, q]}
                      color={cor('cinza-2')}
                      lineWidth={1}
                      transparent
                      opacity={0.5}
                    />
                    <mesh position={q}>
                      <sphereGeometry args={[0.35, 12, 12]} />
                      <meshStandardMaterial color={cor('texto')} />
                    </mesh>
                  </group>
                );
              })}
              <Rotulo
                visivel={rotulos}
                position={[p[0], p[1] + 2, p[2]]}
                center
                distanceFactor={30}
                zIndexRange={[5, 0]}
                className="pointer-events-none select-none"
              >
                <div className="whitespace-nowrap rounded bg-fundo-0/85 px-2 py-1 text-center text-[12px] leading-tight text-texto ring-1 ring-linha-forte">
                  <strong>{a.nome}</strong>
                  {papeis.map((pp) => (
                    <div key={pp.id} className="text-[10px] text-texto-2">
                      {pp.titulo}
                      {nomes[pp.id] ? ` · ${nomes[pp.id]}` : ''}
                    </div>
                  ))}
                </div>
              </Rotulo>
            </group>
          );
        })}
        <instancedMesh ref={esferas} args={[undefined, undefined, 40]}>
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
      </group>
    </group>
  );
}
