/** Ilhas do mundo 3D além da bacia: quadra, prateleira do abrigo e kit explodido (organograma e bastidores nas fases 6 e 8). */
import { Quadra3D } from './Quadra3D';
import { Prateleira3D } from './Prateleira3D';
import { Kit3D } from './Kit3D';

export function Ilhas() {
  return (
    <>
      <Quadra3D />
      <Prateleira3D />
      <Kit3D />
    </>
  );
}
