/** Ilhas do mundo 3D além da bacia: quadra, prateleira do abrigo, kit explodido, organograma e bastidores. */
import { Quadra3D } from './Quadra3D';
import { Prateleira3D } from './Prateleira3D';
import { Kit3D } from './Kit3D';
import { Organograma3D } from './Organograma3D';
import { Bastidores3D } from './Bastidores3D';

export function Ilhas() {
  return (
    <>
      <Quadra3D />
      <Prateleira3D />
      <Kit3D />
      <Organograma3D />
      <Bastidores3D />
    </>
  );
}
