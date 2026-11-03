/**
 * Ilha "kit explodido": a caixa abre e cada item flutua com preço e fonte — de onde vem cada real.
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DADOS } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import { ILHAS } from './mundo';

const COR_CAT = {
  alimentos: '#c89a63',
  higiene: '#8f7ae0',
  limpeza: '#bd8413',
  agua: '#2fa8a3',
  abrigo: '#e8603f',
} as const;
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function Kit3D() {
  const r = useResultado();
  const tela = useOperacao((s) => s.tela);
  const reduzido = useOperacao((s) => s.movimentoReduzido);
  const grupo = useRef<THREE.Group>(null);
  const tampa = useRef<THREE.Mesh>(null);
  const abertura = useRef(0);
  const linhas = r.kit.linhas.filter((l) => l.qtd > 0);
  useFrame((_, dt) => {
    const alvo = tela === 'gastos' ? 1 : 0;
    abertura.current = reduzido ? alvo : THREE.MathUtils.damp(abertura.current, alvo, 2.2, dt);
    const a = abertura.current;
    if (tampa.current) {
      tampa.current.rotation.x = -a * 1.9;
      tampa.current.position.y = 1.05 + a * 0.4;
    }
    grupo.current?.children.forEach((c, i) => {
      const ang = (i / linhas.length) * Math.PI * 2;
      const raio = 1 + a * 4.2;
      c.position.set(
        Math.cos(ang) * raio,
        0.6 + a * (2.6 + (i % 3) * 0.9),
        Math.sin(ang) * raio * 0.55,
      );
      c.rotation.y += dt * 0.3;
    });
  });
  return (
    <group position={ILHAS.kit}>
      {/* caixa */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.4, 1, 1.8]} />
        <meshStandardMaterial color="#c89a63" />
      </mesh>
      <mesh ref={tampa} position={[0, 1.05, -0.9]}>
        <boxGeometry args={[2.4, 0.08, 1.8]} />
        <meshStandardMaterial color="#d8ab74" />
      </mesh>
      <group ref={grupo}>
        {linhas.map((l) => {
          const p = DADOS.precos.produtos.find((x) => x.id === l.produto);
          const cor = COR_CAT[p?.categoria ?? 'alimentos'];
          return (
            <group key={l.produto}>
              <mesh>
                {p?.categoria === 'agua' ? (
                  <cylinderGeometry args={[0.28, 0.28, 0.7, 12]} />
                ) : (
                  <boxGeometry args={[0.55, 0.45, 0.4]} />
                )}
                <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={0.15} />
              </mesh>
              {tela === 'gastos' && (
                <Html
                  position={[0, 0.7, 0]}
                  center
                  distanceFactor={12}
                  zIndexRange={[5, 0]}
                  className="pointer-events-none select-none"
                >
                  <div className="whitespace-nowrap rounded bg-navy-950/85 px-1.5 py-0.5 text-center text-[11px] leading-tight text-creme-100">
                    <strong>{p?.nome ?? l.produto}</strong>
                    <div>
                      {l.qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ×{' '}
                      {l.preco && typeof l.preco.valor === 'number'
                        ? brl(l.preco.valor)
                        : 'A CONFIRMAR'}
                    </div>
                    <div className="text-[9px] text-piscina-300">
                      {(l.preco?.fonte ?? '').split('—')[0]}
                    </div>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
      {tela === 'gastos' && (
        <Html
          position={[0, 8.2, 0]}
          center
          distanceFactor={14}
          zIndexRange={[5, 0]}
          className="pointer-events-none select-none"
        >
          <div className="whitespace-nowrap text-center [text-shadow:0_2px_6px_#0b1e26]">
            <div className="font-display text-[22px] text-creme-100">
              Kit família: {brl(r.kit.custo.valor)}
            </div>
            <div className="text-[12px] text-creme-200">
              {brl(r.kit.custoPorPessoaDia.valor)} por pessoa/dia ·{' '}
              {Math.round(r.kit.kcalPessoaDia.valor)} kcal/pessoa/dia (TACO)
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
