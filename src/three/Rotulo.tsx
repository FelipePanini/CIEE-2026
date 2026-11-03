/**
 * Rótulo HTML no mundo 3D que nunca é desmontado durante o uso: ao trocar de tela ele só fica oculto.
 * (Desmontar o Html do drei em produção gerava "removeChild" no React — manter montado evita isso.)
 */
import { Html } from '@react-three/drei';
import type { ComponentProps, ReactNode } from 'react';

type Props = Omit<ComponentProps<typeof Html>, 'children'> & {
  visivel: boolean;
  children: ReactNode;
};

export function Rotulo({
  visivel,
  children,
  zIndexRange = [5, 0],
  className = 'pointer-events-none select-none',
  ...resto
}: Props) {
  return (
    <Html zIndexRange={zIndexRange} className={className} {...resto}>
      <div style={{ display: visivel ? 'block' : 'none' }}>{children}</div>
    </Html>
  );
}
