/**
 * Ilha "bastidores": a arquitetura em camadas empilhadas — Fontes → Dados → Motor → Telas.
 * Na tela Fontes as placas se separam e partículas sobem entre elas. Cada partícula representa
 * números com fonte de uma camada (HISTÓRICO, ATUAL, PREVISÃO, SIMULADO), na proporção real do
 * inventário dos JSONs. Os rótulos trazem as contagens reais (inventário + contagem do código no build).
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Rotulo } from './Rotulo';
import { ILHAS } from './mundo';
import { CAMADAS, type Camada } from '../engine/tipos';
import { corCamada } from '../ui/cores';
import { camadasArquitetura, INVENTARIO } from '../modules/fontes/arquitetura';
import { useOperacao } from '../store';
import { cor } from '../ui/cores';

const LARG = 17;
const PROF = 10;
const ESP = 0.5;
const N_MAX = 160;

export function Bastidores3D() {
  const ativo = useOperacao((s) => s.tela) === 'fontes';
  const reduzido = useOperacao((s) => s.movimentoReduzido);
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const placas = useRef<(THREE.Group | null)[]>([]);
  const gap = useRef(0.8);
  const part = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const bordas = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(LARG, ESP, PROF)), []);

  // partículas por camada de dado, proporcionais ao inventário real
  const particulas = useMemo(() => {
    const total = INVENTARIO.dados || 1;
    const lista: { camada: Camada; x: number; z: number; fase: number; vel: number }[] = [];
    for (const c of CAMADAS) {
      const n = Math.max(1, Math.round((INVENTARIO.porCamada[c] / total) * N_MAX));
      for (let i = 0; i < n; i++) {
        // determinístico (sem Math.random): espalha em espiral dourada
        const k = lista.length;
        const r = Math.sqrt((k + 0.5) / N_MAX) * 0.42;
        const a = k * 2.399963;
        lista.push({
          camada: c,
          x: Math.cos(a) * r * LARG,
          z: Math.sin(a) * r * PROF,
          fase: (k * 0.618) % 1,
          vel: 0.12 + ((k * 37) % 11) / 90,
        });
      }
    }
    return lista;
  }, []);
  const cores = useMemo(
    () => particulas.map((p) => new THREE.Color(corCamada(p.camada))),
    [particulas],
  );

  useFrame((_, dt) => {
    const alvo = ativo ? 4.2 : 0.8;
    gap.current = reduzido ? alvo : THREE.MathUtils.damp(gap.current, alvo, 2.4, dt);
    placas.current.forEach((g, i) => {
      if (g) g.position.y = 0.4 + i * gap.current;
    });
    const m = part.current;
    if (!m) return;
    const alturaTotal = 3 * gap.current;
    const agora = performance.now() / 1000;
    particulas.forEach((p, i) => {
      const t = pausado || reduzido ? p.fase : (p.fase + agora * p.vel) % 1;
      tmp.position.set(p.x, 0.7 + t * alturaTotal, p.z);
      tmp.scale.setScalar(ativo ? 1 : 0.001);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={ILHAS.bastidores}>
      <mesh position={[0, -0.1, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color={cor('fundo-2')} />
      </mesh>
      {camadasArquitetura().map((c, i) => (
        <group
          key={c.id}
          ref={(el) => {
            placas.current[i] = el;
          }}
          position={[0, 0.4 + i * 0.8, 0]}
        >
          <mesh>
            <boxGeometry args={[LARG, ESP, PROF]} />
            <meshStandardMaterial
              color={c.cor}
              transparent
              opacity={0.42}
              emissive={c.cor}
              emissiveIntensity={0.12}
              depthWrite={false}
            />
          </mesh>
          <lineSegments geometry={bordas}>
            <lineBasicMaterial color={c.cor} />
          </lineSegments>
          <Rotulo
            visivel={ativo}
            position={[-LARG / 2 - 0.6, 0, PROF / 2]}
            distanceFactor={26}
            style={{ transform: 'translate(-100%, -50%)' }}
          >
            <div className="whitespace-nowrap rounded bg-fundo-0/85 px-2 py-1 text-right text-[12px] leading-tight text-texto ring-1 ring-linha">
              <div className="font-display text-[16px]" style={{ color: c.cor }}>
                {i + 1}. {c.nome}
              </div>
              {c.linhas.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </Rotulo>
        </group>
      ))}
      <instancedMesh
        ref={(m) => {
          part.current = m;
          if (!m) return;
          particulas.forEach((_, i) => m.setColorAt(i, cores[i]!));
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }}
        args={[undefined, undefined, particulas.length]}
      >
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <Rotulo visivel={ativo} position={[0, 15.5, 0]} center distanceFactor={30}>
        <div className="whitespace-nowrap text-center [text-shadow:0_2px_6px_var(--color-fundo-0)]">
          <div className="font-display text-[20px] text-texto">Fontes → Dados → Motor → Telas</div>
          <div className="flex justify-center gap-3 text-[12px]">
            {CAMADAS.map((c) => (
              <span key={c} style={{ color: corCamada(c) }}>
                ● {c === 'HISTORICO' ? 'HISTÓRICO' : c === 'PREVISAO' ? 'PREVISÃO' : c}{' '}
                {INVENTARIO.porCamada[c]}
              </span>
            ))}
          </div>
        </div>
      </Rotulo>
    </group>
  );
}
