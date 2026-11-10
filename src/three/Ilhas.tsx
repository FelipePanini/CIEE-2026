/**
 * Ilhas do mundo 3D além da bacia: quadra, prateleira do abrigo, kit explodido, organograma e
 * bastidores. Cada uma só é desenhada na própria tela (e durante o voo da câmera), para que ao
 * afastar o zoom não apareçam objetos de outras telas flutuando.
 */
import type { ReactNode } from 'react';
import { Quadra3D } from './Quadra3D';
import { Prateleira3D } from './Prateleira3D';
import { Kit3D } from './Kit3D';
import { Organograma3D } from './Organograma3D';
import { Bastidores3D } from './Bastidores3D';
import { useCenaVisivel, type Cena } from './zoom';

export function CenaDoMundo({ nome, children }: { nome: Cena; children: ReactNode }) {
  const visivel = useCenaVisivel(nome);
  return <group visible={visivel}>{children}</group>;
}

export function Ilhas() {
  return (
    <>
      <CenaDoMundo nome="quadra">
        <Quadra3D />
      </CenaDoMundo>
      <CenaDoMundo nome="prateleira">
        <Prateleira3D />
      </CenaDoMundo>
      <CenaDoMundo nome="kit">
        <Kit3D />
      </CenaDoMundo>
      <CenaDoMundo nome="organograma">
        <Organograma3D />
      </CenaDoMundo>
      <CenaDoMundo nome="bastidores">
        <Bastidores3D />
      </CenaDoMundo>
    </>
  );
}
