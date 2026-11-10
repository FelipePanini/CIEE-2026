/**
 * Camada de previsão (cenário Prontidão): o RS inteiro com chuva prevista acima da média no trimestre
 * (INMET/INPE: até +200 mm em OND/2026). A densidade da chuva é proporcional à anomalia prevista;
 * abrigos com estoque pré-posicionado suficiente acendem em verde.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DADOS } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import {
  LARGURA_MUNDO,
  PROFUNDIDADE_MUNDO,
  elevacao,
  paraMundo,
  Y_POR_METRO,
  type Relevo,
} from './mundo';
import { Rotulo } from './Rotulo';
import { cor } from '../ui/cores';

const prog = DADOS.previsao.prognosticos.find((p) => p.id === 'inmet-ond-2026')!;
const anomalia = prog.indicadores.find((i) => i.id === 'anomalia_chuva_max')!.dado;
const ANOM = typeof anomalia.valor === 'number' ? anomalia.valor : 0;
const N_GOTAS = Math.round(ANOM * 4); // 200 mm → 800 gotas

export function Prontidao3D({ relevo }: { relevo: Relevo }) {
  const cenario = useOperacao((s) => s.entrada.cenario);
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const r = useResultado();
  const ativo = cenario === 'prontidao';
  const gotas = useRef<THREE.InstancedMesh>(null);
  const pos = useMemo(
    () =>
      Array.from({ length: N_GOTAS }, () => [
        (Math.random() - 0.5) * LARGURA_MUNDO,
        Math.random() * 30,
        (Math.random() - 0.5) * PROFUNDIDADE_MUNDO,
      ]),
    [],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const m = gotas.current;
    if (!m) return;
    m.visible = ativo;
    if (!ativo) return;
    for (let i = 0; i < N_GOTAS; i++) {
      const p = pos[i]!;
      if (!pausado) p[1]! -= dt * 14;
      if (p[1]! < 0) p[1] = 30;
      o.position.set(p[0]!, p[1]! + 5, p[2]!);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 7, 0]} visible={ativo}>
        <planeGeometry args={[LARGURA_MUNDO, PROFUNDIDADE_MUNDO]} />
        <meshBasicMaterial color={cor('cinza-2')} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <instancedMesh ref={gotas} args={[undefined, undefined, N_GOTAS]} visible={ativo}>
        <boxGeometry args={[0.05, 0.9, 0.05]} />
        <meshBasicMaterial color={cor('cinza-2')} transparent opacity={0.55} />
      </instancedMesh>
      {r.locais.map((l) => {
        const [x, z] = paraMundo(l.lat, l.lon);
        const y = Math.max(0, elevacao(relevo, l.lat, l.lon)) * Y_POR_METRO;
        const pronto = l.urgenciaMax < 0.25;
        return (
          <mesh key={l.id} position={[x, y + 0.2, z]} rotation-x={-Math.PI / 2} visible={ativo}>
            <ringGeometry args={[1, 1.5, 32]} />
            <meshBasicMaterial
              color={pronto ? cor('ok') : cor('atencao')}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      })}
      <Rotulo visivel={ativo} position={[-30, 16, -30]} center distanceFactor={90}>
        <div className="w-64 rounded-lg bg-fundo-0/90 p-2 text-center text-[12px] leading-snug text-texto ring-1 ring-linha-forte">
          <strong className="text-texto-2">PREVISÃO · out–dez/2026</strong>
          <div>Chuva até +{ANOM} mm acima da média no RS (INMET/INPE)</div>
          <div className="text-[10px] text-texto-2">
            Anéis verdes: abrigos com estoque pré-posicionado; âmbar: ainda falta estoque
          </div>
        </div>
      </Rotulo>
    </group>
  );
}
