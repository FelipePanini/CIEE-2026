/**
 * Carta de Crise em 3D: quando uma carta é aplicada, uma carta vira na frente da câmera e o impacto se
 * propaga em pulsos pelo organograma e em ondas no mapa (no local afetado).
 */
import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DADOS } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import { flag } from '../config/flags';
import { dispararPulso } from './Organograma3D';
import type { Carta } from '../data/schema';
import type { AreaOrg } from '../modules/administracao/organograma';
import { cor } from '../ui/cores';

export const impactosMapa: { lat: number; lon: number; t0: number; cor: string }[] = [];

const COR = { atencao: cor('atencao'), alerta: cor('alerta'), critico: cor('alerta') } as const;

function locaisDoImpacto(
  c: Carta,
  locais: { id: string; lat: number; lon: number }[],
): [number, number][] {
  const out: [number, number][] = [];
  const no = (id: string) => DADOS.redeViaria.nos.find((n) => n.id === id);
  for (const ef of c.efeitos as Record<string, unknown>[]) {
    if (ef.tipo === 'pessoas') {
      const l = locais.find((x) => x.id === ef.local);
      if (l) out.push([l.lat, l.lon]);
    }
    if (ef.tipo === 'lotar_ponto') {
      const n = no(ef.ponto as string);
      if (n) out.push([n.lat, n.lon]);
    }
    if (ef.tipo === 'nivel') {
      const e = DADOS.rios.estacoes.find((x) => x.id === ef.estacao);
      if (e) out.push([e.lat, e.lon]);
    }
    if (ef.tipo === 'bloquear')
      for (const a of ef.arestas as string[]) {
        const ar = DADOS.redeViaria.arestas.find((x) => x.id === a);
        const d = ar && no(ar.de);
        const p = ar && no(ar.para);
        if (d && p) out.push([(d.lat + p.lat) / 2, (d.lon + p.lon) / 2]);
      }
  }
  if (!out.length) for (const l of locais.slice(0, 4)) out.push([l.lat, l.lon]);
  return out;
}

export function CartaCrise3D() {
  const r = useResultado();
  const reduzido = useOperacao((s) => s.movimentoReduzido);
  const recolhido = useOperacao((s) => s.painelRecolhido);
  const apresentando = useOperacao((s) => s.apresentacao.ativa);
  const camera = useThree((s) => s.camera);
  const grupo = useRef<THREE.Group>(null);
  const [carta, setCarta] = useState<Carta | null>(null);
  const t0 = useRef(0);
  const n = r.decisoes.length;
  const anterior = useRef(n);
  useEffect(() => {
    if (n > anterior.current) {
      const d = r.decisoes[n - 1]!;
      const c = DADOS.cartas.cartas.find((x) => x.titulo === d.titulo) ?? null;
      setCarta(c);
      t0.current = performance.now() / 1000;
      if (c) {
        dispararPulso('todas', COR[c.severidade]);
        dispararPulso(c.area === 'lider' ? 'todas' : (c.area as AreaOrg), COR[c.severidade]);
        for (const [lat, lon] of locaisDoImpacto(c, r.locais))
          impactosMapa.push({ lat, lon, t0: t0.current, cor: COR[c.severidade] });
      }
    }
    anterior.current = n;
  }, [n, r.decisoes, r.locais]);

  useFrame(() => {
    const g = grupo.current;
    if (!g) return;
    // com o vidro ligado o card é o painel de vidro em HTML (src/ui/AvisosVidro.tsx); aqui ficam só os pulsos
    g.visible = !!carta && !flag('vidro');
    if (!carta) return;
    const t = performance.now() / 1000 - t0.current;
    if (t > 4.2) {
      setCarta(null);
      return;
    }
    // segue a câmera: 9 unidades à frente
    // painel aberto à direita → carta à esquerda; na apresentação o texto fica à esquerda → carta à direita
    const desloc = apresentando ? 2.4 : recolhido || window.innerWidth < 900 ? 0 : -2.3;
    const frente = new THREE.Vector3(desloc, 0, -9).applyQuaternion(camera.quaternion);
    g.position.copy(camera.position).add(frente);
    g.quaternion.copy(camera.quaternion);
    const virada = reduzido ? 1 : Math.min(1, t / 0.9);
    g.rotateY(Math.PI * (1 - THREE.MathUtils.smootherstep(virada, 0, 1)));
    const saida = t > 3.4 ? (t - 3.4) / 0.8 : 0;
    g.scale.setScalar((apresentando ? 0.8 : 1) * (1 - saida * 0.9));
  });

  return (
    <group ref={grupo} renderOrder={10} visible={false}>
      <mesh>
        <boxGeometry args={[5.2, 3.2, 0.06]} />
        <meshBasicMaterial color={cor('texto')} depthTest={false} />
      </mesh>
      <mesh position={[0, 1.45, 0.04]}>
        <boxGeometry args={[5.2, 0.3, 0.02]} />
        <meshBasicMaterial
          color={carta ? COR[carta.severidade] : cor('alerta')}
          depthTest={false}
        />
      </mesh>
      <Html
        transform
        position={[0, 0, 0.06]}
        distanceFactor={4.2}
        zIndexRange={[1000, 900]}
        className="pointer-events-none select-none"
      >
        {/* o cartão inteiro também em HTML, do tamanho da carta 3D (5,2 × 3,2): cobre os rótulos do
            mapa, porque o DOM fica sempre acima do WebGL */}
        <div
          className="h-[283px] w-[460px] overflow-hidden rounded-sm bg-claro text-left text-fundo-0"
          style={{ display: carta && !flag('vidro') ? 'block' : 'none' }}
        >
          {carta && (
            <>
              <div className="h-[26px]" style={{ background: COR[carta.severidade] }} />
              <div className="flex flex-col gap-1.5 px-5 py-3">
                <p className="text-[13px] font-bold uppercase tracking-[0.2em]">
                  Carta de Crise · {carta.severidade}
                </p>
                <p className="font-display text-[30px] leading-tight">{carta.titulo}</p>
                <p className="text-[16px] leading-snug">{carta.descricao}</p>
                {carta.inspirado_em && (
                  <p className="self-start rounded bg-cinza-2 px-1.5 py-0.5 text-[12px] font-bold uppercase text-fundo-0">
                    inspirado em fato real
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Html>
    </group>
  );
}

/** Ondas de impacto no mapa (anéis que se expandem no local afetado pela carta). */
export function OndasImpacto({
  posicao,
}: {
  posicao: (lat: number, lon: number) => THREE.Vector3;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const agora = performance.now() / 1000;
    for (let i = impactosMapa.length - 1; i >= 0; i--)
      if (agora - impactosMapa[i]!.t0 > 4) impactosMapa.splice(i, 1);
    g.children.forEach((c, i) => {
      const imp = impactosMapa[i];
      const m = c as THREE.Mesh;
      if (!imp) {
        m.visible = false;
        return;
      }
      const t = (agora - imp.t0) % 1.6;
      m.visible = true;
      m.position.copy(posicao(imp.lat, imp.lon)).add(new THREE.Vector3(0, 0.3, 0));
      m.scale.setScalar(1 + t * 5);
      (m.material as THREE.MeshBasicMaterial).color.set(imp.cor);
      (m.material as THREE.MeshBasicMaterial).opacity = 1 - t / 1.6;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} visible={false}>
          <ringGeometry args={[0.6, 0.85, 40]} />
          <meshBasicMaterial transparent opacity={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
