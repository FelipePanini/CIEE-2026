/**
 * Ilha "bacia": terreno do DEM, água por estação, réguas, pinos de abrigos/quadras/pontos
 * (altura ∝ pessoas atendidas) e as rotas como arcos animados com caminhões.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { Rotulo } from './Rotulo';
import { DADOS, municipioPorIbge } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import { elevacao, paraMundo, Y_POR_METRO, type Relevo } from './mundo';
import { Terreno } from './Terreno';
import { PlanoAgua, Regua3D } from './Agua';
import { OndasImpacto } from './CartaCrise3D';

type Geo = Record<string, [number, number][]>;
let cacheRotas: Promise<Geo> | null = null;
function useRotasGeo() {
  const [g, setG] = useState<Geo | null>(null);
  useEffect(() => {
    cacheRotas ??= fetch('/geo/rotas.json').then((r) => r.json() as Promise<Geo>);
    let vivo = true;
    cacheRotas.then((x) => vivo && setG(x)).catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return g;
}

const corUrg = (u: number, pessoas: number) =>
  !pessoas ? '#8cc7c5' : u >= 0.5 ? '#ef6a4b' : u >= 0.25 ? '#f2b84b' : '#6cc28f';

function ponto3D(relevo: Relevo, lat: number, lon: number, acima = 0): THREE.Vector3 {
  const [x, z] = paraMundo(lat, lon);
  return new THREE.Vector3(x, Math.max(0, elevacao(relevo, lat, lon)) * Y_POR_METRO + acima, z);
}

/** Pinos: quadras (prisma), abrigos (cilindro) e pontos de coleta (losango). Altura = pessoas atendidas. */
function Pinos({ relevo, rotulos }: { relevo: Relevo; rotulos: boolean }) {
  const r = useResultado();
  return (
    <group>
      {r.locais.map((l) => {
        const p = ponto3D(relevo, l.lat, l.lon);
        const h = 0.6 + Math.sqrt(l.pessoasN) / 7;
        const cor = corUrg(l.urgenciaMax, l.pessoasN);
        return (
          <group key={l.id} position={p}>
            <mesh position={[0, h / 2, 0]}>
              {l.tipo === 'quadra' ? (
                <boxGeometry args={[0.7, h, 0.7]} />
              ) : (
                <cylinderGeometry args={[0.42, 0.42, h, 16]} />
              )}
              <meshStandardMaterial
                color={cor}
                emissive={cor}
                emissiveIntensity={l.urgenciaMax >= 0.5 ? 0.45 : 0.15}
              />
            </mesh>
            <Rotulo
              visivel={rotulos && l.pessoasN > 0}
              position={[0, h + 0.6, 0]}
              zIndexRange={[5, 0]}
              center
              distanceFactor={55}
              className="pointer-events-none select-none"
            >
              <div className="whitespace-nowrap rounded bg-navy-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-creme-100">
                {l.nome.replace(
                  /^(EMEF|EEEF|Instituto Estadual de Educação|Colégio Estadual|Abrigo( na)?)\s*/i,
                  '',
                )}{' '}
                · {Math.round(l.pessoasN)}
              </div>
            </Rotulo>
          </group>
        );
      })}
      {r.pontos.map((pt) => {
        const p = ponto3D(relevo, pt.lat, pt.lon, 0.5);
        return (
          <mesh key={pt.id} position={p} rotation={[0, Math.PI / 4, Math.PI / 4]}>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial
              color={pt.lotado ? '#ef6a4b' : '#bd8413'}
              emissive={pt.lotado ? '#ef6a4b' : '#000000'}
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Curva elevada sobre o terreno para um trecho (em arco, para leitura em projetor). */
function curvaDoTrecho(relevo: Relevo, pts: [number, number][], altura: number): THREE.Vector3[] {
  const v = pts.map(([la, lo]) => ponto3D(relevo, la, lo, 0.35));
  if (v.length < 2) return v;
  const curva = new THREE.CatmullRomCurve3(v);
  const n = Math.max(8, Math.min(80, v.length * 3));
  return curva
    .getPoints(n)
    .map((p, i, a) =>
      p.add(new THREE.Vector3(0, Math.sin((i / (a.length - 1)) * Math.PI) * altura, 0)),
    );
}

function Caminhao({
  curva,
  deslocamento,
  pausado,
}: {
  curva: THREE.CatmullRomCurve3;
  deslocamento: number;
  pausado: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(deslocamento);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!pausado) t.current = (t.current + dt * 0.07) % 1;
    const p = curva.getPointAt(t.current);
    const tg = curva.getTangentAt(t.current);
    ref.current.position.copy(p);
    ref.current.lookAt(p.clone().add(tg));
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.45, 0.35, 0.9]} />
      <meshStandardMaterial color="#f3efe6" emissive="#f2b84b" emissiveIntensity={0.3} />
    </mesh>
  );
}

/** Rede viária: trechos livres (piscina), em rota (âmbar, arco animado) e bloqueados (barreira coral). */
function Rotas3D({ relevo }: { relevo: Relevo }) {
  const r = useResultado();
  const geo = useRotasGeo();
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const alternar = useOperacao((s) => s.alternarBloqueio);
  const bloq = useMemo(() => new Set(r.arestasBloqueadas), [r.arestasBloqueadas]);
  const emRota = useMemo(
    () => new Set(r.rotas.flatMap((ro) => ro.trechos.flatMap((t) => t.arestas.map((a) => a.id)))),
    [r.rotas],
  );
  const linhas = useMemo(() => {
    if (!geo) return [];
    return DADOS.redeViaria.arestas
      .filter((a) => geo[a.id] && a.via !== 'vias urbanas')
      .map((a) => {
        const pts = curvaDoTrecho(relevo, geo[a.id]!, emRota.has(a.id) ? 1.6 : 0);
        return {
          id: a.id,
          pts,
          curva: pts.length > 1 ? new THREE.CatmullRomCurve3(pts) : null,
          bloq: bloq.has(a.id),
          rota: emRota.has(a.id),
        };
      });
  }, [geo, relevo, bloq, emRota]);
  const dash = useRef(0);
  const refs = useRef<Record<string, { material: { dashOffset: number } } | null>>({});
  useFrame((_, dt) => {
    if (pausado) return;
    dash.current -= dt * 2;
    for (const k in refs.current) {
      const l = refs.current[k];
      if (l?.material) l.material.dashOffset = dash.current;
    }
  });
  return (
    <group>
      {linhas.map((l) =>
        l.pts.length > 1 ? (
          <group key={l.id}>
            <Line
              ref={(el) => {
                refs.current[l.id] = l.rota
                  ? (el as unknown as { material: { dashOffset: number } })
                  : null;
              }}
              points={l.pts}
              color={l.bloq ? '#ef6a4b' : l.rota ? '#f2b84b' : '#8cc7c5'}
              lineWidth={l.rota ? 4 : l.bloq ? 3.5 : 1.6}
              dashed={l.rota}
              dashSize={1.2}
              gapSize={0.6}
              transparent
              opacity={l.rota || l.bloq ? 1 : 0.6}
              onClick={(e) => {
                e.stopPropagation();
                alternar(l.id);
              }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = '')}
            />
            {l.rota && l.curva && (
              <Caminhao curva={l.curva} deslocamento={(l.id.length % 10) / 10} pausado={pausado} />
            )}
            {l.bloq && (
              <mesh
                position={l.pts[Math.floor(l.pts.length / 2)]!.clone().add(
                  new THREE.Vector3(0, 0.9, 0),
                )}
              >
                <boxGeometry args={[1.8, 1.8, 0.3]} />
                <meshStandardMaterial color="#ef6a4b" emissive="#ef6a4b" emissiveIntensity={0.6} />
              </mesh>
            )}
          </group>
        ) : null,
      )}
    </group>
  );
}

/** Pinos dos municípios atendidos no cenário (sede municipal, IBGE). */
function Municipios({ relevo, visivel }: { relevo: Relevo; visivel: boolean }) {
  const r = useResultado();
  const grupos = new Map<number, { lat: number; lon: number; n: number }>();
  for (const l of r.locais) {
    const g = grupos.get(l.municipio) ?? { lat: 0, lon: 0, n: 0 };
    grupos.set(l.municipio, { lat: g.lat + l.lat, lon: g.lon + l.lon, n: g.n + 1 });
  }
  return (
    <group>
      {[...grupos.entries()].map(([ibge, g]) => {
        const m = municipioPorIbge.get(ibge);
        if (!m) return null;
        // rótulo no centro dos locais atendidos no município (não na sede)
        const p = ponto3D(relevo, g.lat / g.n, g.lon / g.n, 0);
        return (
          <Rotulo
            visivel={visivel}
            key={ibge}
            position={[p.x + 1.6, p.y + 3.2, p.z - 1.2]}
            center
            distanceFactor={70}
          >
            <div className="font-display whitespace-nowrap text-[13px] text-creme-100 [text-shadow:0_1px_3px_#0b1e26]">
              {m.nome}
            </div>
          </Rotulo>
        );
      })}
    </group>
  );
}

export function Bacia3D({
  relevo,
  passo,
  rotulos = true,
}: {
  relevo: Relevo;
  passo: number;
  rotulos?: boolean;
}) {
  const r = useResultado();
  return (
    <group>
      <Terreno relevo={relevo} passo={passo} />
      {DADOS.rios.estacoes.map((e) => (
        <group key={e.id}>
          <PlanoAgua relevo={relevo} estacao={e.id} nivel={r.niveis[e.id] ?? 0} />
          <Regua3D relevo={relevo} estacao={e.id} nivel={r.niveis[e.id] ?? 0} rotulos={rotulos} />
        </group>
      ))}
      <Pinos relevo={relevo} rotulos={rotulos} />
      <Municipios relevo={relevo} visivel={rotulos} />
      <Rotas3D relevo={relevo} />
      <OndasImpacto posicao={(lat, lon) => ponto3D(relevo, lat, lon)} />
    </group>
  );
}
