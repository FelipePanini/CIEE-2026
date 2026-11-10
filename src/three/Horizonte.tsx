/**
 * O mundo não acaba na borda do mapa: um céu em gradiente (esfera invertida) e um "mar" de base até
 * o horizonte, que somem no fog exponencial da cor do fundo. Não existe "fora do mapa" preto.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { corTres } from './tema';

export const Y_MAR = -0.6;

export function Horizonte() {
  const ceu = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uBaixo: { value: corTres('fundo-3').clone() },
          uAlto: { value: corTres('fundo-0').clone() },
        },
        vertexShader:
          'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 uBaixo; uniform vec3 uAlto; varying vec3 vDir; void main(){ float t = smoothstep(-0.05, 0.45, vDir.y); gl_FragColor = vec4(mix(uBaixo, uAlto, t), 1.0); }',
      }),
    [],
  );
  return (
    <>
      <mesh material={ceu} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[4200, 32, 16]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, Y_MAR, 0]}>
        <circleGeometry args={[4200, 64]} />
        <meshStandardMaterial color={corTres('fundo-1')} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}
