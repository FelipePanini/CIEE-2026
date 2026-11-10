/**
 * Rótulo HTML no mundo 3D que nunca é desmontado durante o uso: ao trocar de tela ele só fica oculto.
 * (Desmontar o Html do drei em produção gerava "removeChild" no React — manter montado evita isso.)
 */
import { Html } from '@react-three/drei';
import type { ComponentProps, ReactNode } from 'react';
import { flag } from '../config/flags';

const FLAG_ROTULOS = flag('rotulosInteligentes');

type Props = Omit<ComponentProps<typeof Html>, 'children'> & {
  visivel: boolean;
  children: ReactNode;
  /**
   * Rótulo do mapa da bacia. Com a flag `rotulosInteligentes` ligada ele não é desenhado aqui:
   * a camada de rótulos (src/three/rotulos) cuida de colisão, LOD e oclusão.
   */
  mapa?: boolean;
};

export function Rotulo({
  visivel,
  children,
  zIndexRange = [5, 0],
  className = 'pointer-events-none select-none',
  mapa = false,
  ...resto
}: Props) {
  // a flag é lida uma vez no carregamento (trocar flag recarrega a página), então o Html nunca
  // é montado e desmontado durante o uso
  if (mapa && FLAG_ROTULOS) return null;
  return (
    <Html zIndexRange={zIndexRange} className={className} {...resto}>
      <div style={{ display: visivel ? 'block' : 'none' }}>{children}</div>
    </Html>
  );
}
