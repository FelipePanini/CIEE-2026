/**
 * Plano de água por estação (Guaíba/Cais Mauá e Taquari/Lajeado), controlado pelos sliders de nível.
 * Altura do plano = superfície do rio no DEM + (nível − nível de referência). O teste de profundidade
 * faz o resto: onde o terreno fica abaixo do plano, aparece a mancha de inundação.
 * Aproximação visual de maquete — não é um modelo hidráulico.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Rotulo } from './Rotulo';
import { DADOS } from '../data/carregar';
import { useNivelAtual } from '../store';
import { elevacaoMinima, paraMundo, Y_POR_METRO, UNIDADES_POR_KM, type Relevo } from './mundo';
import type { Dado } from '../engine/tipos';
import { progressoAbertura } from './abertura';
import { cor } from '../ui/cores';

const n = (d?: Dado) => (d && typeof d.valor === 'number' ? d.valor : null);

export const RAIO_KM: Record<string, number> = { 'guaiba-cais-maua': 34, 'taquari-lajeado': 20 };

/** Nível de referência (água "normal"): nível normal oficial ou a mediana da série recente da ANA. */
export function nivelReferencia(estacao: string): number {
  const est = DADOS.rios.estacoes.find((e) => e.id === estacao)!;
  const oficial = n(est.nivel_normal);
  if (oficial !== null) return oficial;
  const serie = DADOS.seriesRios.series.find((s) => s.estacao === estacao && s.camada === 'ATUAL');
  const v = (serie?.pontos ?? []).map((p) => p[1]).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)]! : 0;
}

/** Pico de maio/2024 na estação (HISTÓRICO, telemetria ANA) — alvo da água na abertura. */
export function pico2024(estacao: string): number {
  return (
    n(
      DADOS.eventos.eventos
        .find((e) => e.id === '2024-05')!
        .picos.find((p) => p.estacao === estacao)?.nivel,
    ) ?? nivelReferencia(estacao)
  );
}

/** Nível mostrado agora: o do motor, ou o da subida animada durante a abertura da apresentação. */
function nivelExibido(estacao: string, nivel: number): { v: number; abertura: boolean } {
  const p = progressoAbertura();
  if (p === null) return { v: nivel, abertura: false };
  const ref = nivelReferencia(estacao);
  return { v: ref + (pico2024(estacao) - ref) * p, abertura: true };
}

const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const frag = `uniform vec3 uCor; uniform float uOpac; uniform float uTempo; varying vec2 vUv;
void main(){ float d = distance(vUv, vec2(0.5)) * 2.0; float borda = 1.0 - smoothstep(0.78, 1.0, d);
float onda = 0.012 * sin((vUv.x * 0.7 + vUv.y) * 140.0 + uTempo);
gl_FragColor = vec4(uCor + onda, uOpac * borda); }`;

export function PlanoAgua({
  relevo,
  estacao,
  nivel,
  cor: corAgua = cor('agua'),
}: {
  relevo: Relevo;
  estacao: string;
  nivel: number;
  cor?: string;
}) {
  const est = DADOS.rios.estacoes.find((e) => e.id === estacao)!;
  const [x, z] = paraMundo(est.lat, est.lon);
  const base = useMemo(() => elevacaoMinima(relevo, est.lat, est.lon), [relevo, est.lat, est.lon]);
  const ref = nivelReferencia(estacao);
  const yAgua = Math.max(0, base + (nivel - ref)) * Y_POR_METRO + 0.02;
  const raio = RAIO_KM[estacao]! * UNIDADES_POR_KM;
  const uniforms = useMemo(
    () => ({
      uCor: { value: new THREE.Color(corAgua) },
      uOpac: { value: 0.78 },
      uTempo: { value: 0 },
    }),
    [corAgua],
  );
  const malha = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    uniforms.uTempo.value += dt * 1.5;
    const m = malha.current;
    if (!m) return;
    // a água acompanha o nível com suavização (slider, Carta de Crise) e sobe na abertura
    const { v, abertura } = nivelExibido(estacao, nivel);
    const alvo = Math.max(0, base + (v - ref)) * Y_POR_METRO + 0.02;
    m.position.y = abertura ? alvo : THREE.MathUtils.damp(m.position.y, alvo, 4, dt);
  });
  return (
    <mesh ref={malha} position={[x, yAgua, z]} rotation-x={-Math.PI / 2} renderOrder={2}>
      <circleGeometry args={[raio, 96]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/** Régua 3D na estação: marcas da cota de inundação, do pico de 2024 e do nível atual. */
export function Regua3D({
  relevo,
  estacao,
  nivel,
  rotulos = true,
}: {
  relevo: Relevo;
  estacao: string;
  nivel: number;
  rotulos?: boolean;
}) {
  const est = DADOS.rios.estacoes.find((e) => e.id === estacao)!;
  const [x, z] = paraMundo(est.lat, est.lon);
  const base = useMemo(() => elevacaoMinima(relevo, est.lat, est.lon), [relevo, est.lat, est.lon]);
  const ref = nivelReferencia(estacao);
  const y = (v: number) => Math.max(0, base + (v - ref)) * Y_POR_METRO;
  const cota = n(est.cota_inundacao)!;
  const pico = pico2024(estacao);
  const disco = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const m = disco.current;
    if (!m) return;
    const { v, abertura } = nivelExibido(estacao, nivel);
    m.position.y = abertura ? y(v) : THREE.MathUtils.damp(m.position.y, y(v), 4, dt);
  });
  const real = n(useNivelAtual(estacao)) ?? 0;
  const topo = y(pico) + 1.2;
  const marcas = [
    { v: cota, cor: cor('alerta'), t: `cota ${cota.toFixed(1).replace('.', ',')} m` },
    { v: pico, cor: cor('texto'), t: `pico 2024 ${pico.toFixed(2).replace('.', ',')} m` },
    { v: real, cor: cor('cinza-2'), t: `real agora ${real.toFixed(2).replace('.', ',')} m` },
  ];
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, topo / 2, 0]}>
        <cylinderGeometry args={[0.08, 0.08, topo, 8]} />
        <meshStandardMaterial color={cor('texto')} />
      </mesh>
      {marcas.map((m) => (
        <mesh key={m.t} position={[0, y(m.v), 0]}>
          <torusGeometry args={[0.45, 0.07, 6, 24]} />
          <meshBasicMaterial color={m.cor} />
        </mesh>
      ))}
      <mesh ref={disco} position={[0, y(nivel), 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.12, 24]} />
        <meshBasicMaterial color={nivel >= cota ? cor('alerta') : cor('agua')} />
      </mesh>
      <Rotulo
        visivel={rotulos}
        position={[0.8, topo, 0]}
        distanceFactor={60}
        zIndexRange={[5, 0]}
        className="pointer-events-none select-none"
      >
        <div className="whitespace-nowrap rounded bg-fundo-0/85 px-2 py-1 text-[11px] leading-tight text-texto ring-1 ring-linha-forte">
          <strong>{est.rio}</strong> · {nivel.toFixed(2).replace('.', ',')} m
          {marcas.map((m) => (
            <div key={m.t} style={{ color: m.cor }}>
              {m.t}
            </div>
          ))}
        </div>
      </Rotulo>
    </group>
  );
}
