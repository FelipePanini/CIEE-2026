/**
 * Linha do tempo 3D: colunas de água translúcidas sobre os municípios afetados em cada evento
 * (altura ∝ desabrigados) e sobre as réguas (altura = pico acima da cota). Trocar o evento anima a transição.
 * "A crise mudou de lugar, mas não acabou."
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DADOS, municipioPorIbge } from '../data/carregar';
import { useOperacao } from '../store';
import { elevacao, paraMundo, Y_POR_METRO, type Relevo } from './mundo';
import { Rotulo } from './Rotulo';
import type { Dado } from '../engine/tipos';
import { cor } from '../ui/cores';

const n = (d?: Dado) => (d && typeof d.valor === 'number' ? d.valor : null);

interface Coluna {
  id: string;
  lat: number;
  lon: number;
  cor: string;
  rotulo: string;
}

const COLUNAS: Coluna[] = [
  ...new Set(DADOS.eventos.eventos.flatMap((e) => e.municipios.map((m) => m.ibge))),
].flatMap((ibge) => {
  const m = municipioPorIbge.get(ibge);
  if (!m) return [];
  // a coordenada do IBGE pode cair longe da área urbana (ex.: Eldorado do Sul): usa a média dos
  // abrigos e escolas reais do município quando houver
  const locais = [...DADOS.abrigos.abrigos, ...DADOS.escolas.escolas].filter(
    (l) => l.municipio_ibge === ibge,
  );
  const lat = locais.length ? locais.reduce((s, l) => s + l.lat, 0) / locais.length : m.lat;
  const lon = locais.length ? locais.reduce((s, l) => s + l.lon, 0) / locais.length : m.lon;
  return [{ id: `m${ibge}`, lat, lon, cor: cor('agua'), rotulo: m.nome }];
});
const COLUNAS_RIO: Coluna[] = DADOS.rios.estacoes.map((e) => ({
  id: `r-${e.id}`,
  lat: e.lat,
  lon: e.lon,
  cor: cor('alerta'),
  rotulo: e.rio,
}));

function alturaAlvo(evento: string, c: Coluna): { h: number; texto: string } {
  const ev = DADOS.eventos.eventos.find((e) => e.id === evento)!;
  if (c.id.startsWith('m')) {
    const im = ev.municipios.find((m) => `m${m.ibge}` === c.id);
    const v = n(im?.desabrigados);
    return v
      ? {
          h: 1 + Math.sqrt(v) / 9,
          texto: `${c.rotulo} · ${v.toLocaleString('pt-BR')} desabrigados`,
        }
      : { h: 0, texto: '' };
  }
  const est = c.id.slice(2);
  const cota = n(DADOS.rios.estacoes.find((e) => e.id === est)!.cota_inundacao)!;
  const picos = ev.picos.filter((p) => p.estacao === est).map((p) => n(p.nivel) ?? 0);
  if (!picos.length) return { h: 0, texto: '' };
  const max = Math.max(...picos);
  const acima = max - cota;
  return {
    h: Math.max(0.3, acima * (est.startsWith('guaiba') ? 5 : 1.2)),
    texto: `${c.rotulo} · ${Math.abs(acima).toFixed(2).replace('.', ',')} m ${acima >= 0 ? 'acima' : 'abaixo'} da cota`,
  };
}

export function LinhaTempo3D({ relevo }: { relevo: Relevo }) {
  const tela = useOperacao((s) => s.tela);
  const evento = useOperacao((s) => s.eventoTimeline);
  const ativo = tela === 'linha-do-tempo';
  const todas = useMemo(() => [...COLUNAS, ...COLUNAS_RIO], []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const alvos = todas.map((c) => alturaAlvo(evento, c));
  const base = useMemo(
    () => todas.map((c) => Math.max(0, elevacao(relevo, c.lat, c.lon)) * Y_POR_METRO),
    [todas, relevo],
  );
  useFrame((_, dt) => {
    todas.forEach((_c, i) => {
      const m = refs.current[i];
      if (!m) return;
      const alvo = ativo ? alvos[i]!.h : 0;
      const atual = THREE.MathUtils.damp(m.scale.y, Math.max(0.001, alvo), 3, dt);
      m.scale.y = atual;
      m.position.y = base[i]! + atual / 2;
      m.visible = atual > 0.01;
    });
  });
  return (
    <group>
      {todas.map((c, i) => {
        const [x, z] = paraMundo(c.lat, c.lon);
        return (
          <group key={c.id}>
            <mesh
              ref={(el) => {
                refs.current[i] = el;
              }}
              position={[x, base[i]!, z]}
              scale={[1, 0.001, 1]}
            >
              <cylinderGeometry
                args={[
                  c.id.startsWith('m') ? 1.1 : 0.6,
                  c.id.startsWith('m') ? 1.1 : 0.6,
                  1,
                  24,
                  1,
                  true,
                ]}
              />
              <meshStandardMaterial
                color={c.cor}
                transparent
                opacity={0.55}
                emissive={c.cor}
                emissiveIntensity={0.25}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <Rotulo
              visivel={ativo && alvos[i]!.h > 0}
              position={[x, base[i]! + alvos[i]!.h + 1, z]}
              center
              distanceFactor={44}
            >
              <div className="whitespace-nowrap rounded bg-fundo-0/85 px-1.5 py-0.5 text-[11px] text-texto">
                {alvos[i]!.texto}
              </div>
            </Rotulo>
          </group>
        );
      })}
    </group>
  );
}
