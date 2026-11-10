/**
 * Ponte entre o Canvas e a camada de rótulos em HTML: a câmera atual e o tamanho do palco.
 * Um componente dentro do Canvas atualiza isto a cada quadro; a camada de rótulos só lê.
 */
import { useFrame, useThree } from '@react-three/fiber';
import type { Camera } from 'three';

export const visao: { camera: Camera | null; largura: number; altura: number } = {
  camera: null,
  largura: 0,
  altura: 0,
};

export function SincroniaCamera() {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    visao.camera = camera;
    visao.largura = size.width;
    visao.altura = size.height;
  });
  return null;
}

/** Projeta um ponto do mundo na tela. Devolve null se estiver atrás da câmera. */
export function projetar(
  x: number,
  y: number,
  z: number,
): { sx: number; sy: number; dist: number } | null {
  const cam = visao.camera;
  if (!cam) return null;
  const v = cam.matrixWorldInverse.elements;
  const p = cam.projectionMatrix.elements;
  const vx = v[0]! * x + v[4]! * y + v[8]! * z + v[12]!;
  const vy = v[1]! * x + v[5]! * y + v[9]! * z + v[13]!;
  const vz = v[2]! * x + v[6]! * y + v[10]! * z + v[14]!;
  const cw = p[3]! * vx + p[7]! * vy + p[11]! * vz + p[15]!;
  if (cw <= 0.001) return null;
  const cx = (p[0]! * vx + p[4]! * vy + p[8]! * vz + p[12]!) / cw;
  const cy = (p[1]! * vx + p[5]! * vy + p[9]! * vz + p[13]!) / cw;
  return {
    sx: (cx * 0.5 + 0.5) * visao.largura,
    sy: (1 - (cy * 0.5 + 0.5)) * visao.altura,
    dist: Math.hypot(vx, vy, vz),
  };
}

export function posicaoCamera(): [number, number, number] | null {
  const m = visao.camera?.matrixWorld.elements;
  return m ? [m[12]!, m[13]!, m[14]!] : null;
}
