/**
 * Camada de rótulos do mapa 3D, em HTML por cima do Canvas.
 *  - tamanho fixo em tela (não cresce com o zoom);
 *  - colisão em espaço de tela: quando dois batem, aparece só o de maior prioridade
 *    (1 alerta ativo · 2 estação de rio · 3 município com desabrigados · 4 capital/polo · 5 demais);
 *  - nível de detalhe por zoom: longe = regiões e estações; médio = municípios; perto = abrigos;
 *  - oclusão: rótulo atrás do relevo some;
 *  - fade de opacidade (nada aparece ou some de uma vez);
 *  - cards ricos (réguas dos rios) ficam colapsados num chip e expandem no hover/clique, com linha-guia.
 * A posição é escrita direto no DOM a ~20 Hz; o React só re-renderiza quando a LISTA de rótulos muda.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DADOS, municipioPorIbge } from '../../data/carregar';
import { useOperacao, useResultado } from '../../store';
import { useFlag } from '../../config/flags';
import {
  BBOX,
  carregarRelevo,
  deMundo,
  elevacao,
  paraMundo,
  Y_POR_METRO,
  type Relevo,
} from '../mundo';
import { cenaDaTela, zoom } from '../zoom';
import { pico2024 } from '../Agua';
import { alturaAlvo, COLUNAS, COLUNAS_RIO } from '../LinhaTempo3D';
import { useEstados } from '../Contexto3D';
import { posicaoCamera, projetar, visao } from './camera';
import { contarSobreposicoes, resolverColisoes, type CaixaRotulo } from './layout';
import './rotulos.css';

export interface RotuloMapa {
  id: string;
  lat: number;
  lon: number;
  /** altura acima do terreno, em unidades da cena */
  acima: number;
  classe: 'regiao' | 'estacao' | 'municipio' | 'local' | 'coluna' | 'parceiro' | 'ponto';
  prioridade: number;
  /** faixa de distância da câmera em que o rótulo existe (nível de detalhe) */
  distMin?: number;
  distMax?: number;
  alerta?: boolean;
  conteudo: ReactNode;
  /** card rico: aparece ao passar o mouse, focar ou clicar no chip */
  card?: ReactNode;
}

declare global {
  interface Window {
    __ccRotulos?: { sobreposicoes: () => number; visiveis: () => string[] };
  }
}

/** Rótulos extras registrados por outros módulos (ex.: corredor SP → RS). */
const extras = new Map<string, RotuloMapa[]>();
const ouvintes = new Set<() => void>();
export function registrarRotulos(grupo: string, lista: RotuloMapa[] | null) {
  if (lista) extras.set(grupo, lista);
  else extras.delete(grupo);
  ouvintes.forEach((f) => f());
}

const br = (v: number, casas = 2) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const num = (d: { valor: unknown } | undefined) =>
  d && typeof d.valor === 'number' ? d.valor : null;
const nomeCurto = (n: string) =>
  n.replace(/^(EMEF|EEEF|Instituto Estadual de Educação|Colégio Estadual|Abrigo( na)?)\s*/i, '');

function useRotulos(): RotuloMapa[] {
  const r = useResultado();
  const tela = useOperacao((s) => s.tela);
  const evento = useOperacao((s) => s.eventoTimeline);
  const niveisReais = useOperacao((s) => s.entrada.niveisReais);
  const estados = useEstados();
  const contexto = useFlag('contextoBrasil');
  const [, forcar] = useState(0);
  useEffect(() => {
    const f = () => forcar((n) => n + 1);
    ouvintes.add(f);
    return () => void ouvintes.delete(f);
  }, []);
  const extrasLista = [...extras.values()].flat();
  return useMemo(() => {
    if (cenaDaTela(tela) !== 'bacia') return [];
    const lista: RotuloMapa[] = [];

    // 1) regiões: estados e a própria bacia (só de longe)
    if (contexto && estados) {
      for (const e of estados.estados) {
        const maior = [...e.poligonos].sort((a, b) => b.length - a.length)[0];
        if (!maior) continue;
        const lon = maior.reduce((s, p) => s + p[0], 0) / maior.length;
        const lat = maior.reduce((s, p) => s + p[1], 0) / maior.length;
        lista.push({
          id: `uf-${e.uf}`,
          lat,
          lon,
          acima: 0.5,
          classe: 'regiao',
          prioridade: e.uf === 'RS' ? 2.5 : 4,
          distMin: 330,
          conteudo: e.nome,
        });
      }
      lista.push({
        id: 'bacia',
        lat: (BBOX.norte + BBOX.sul) / 2,
        lon: (BBOX.leste + BBOX.oeste) / 2,
        acima: 6,
        classe: 'regiao',
        prioridade: 2,
        distMin: 330,
        conteudo: 'Bacia do Guaíba',
      });
    }

    // 2) estações de rio: chip colapsado + card rico
    for (const est of DADOS.rios.estacoes) {
      const nivel = r.niveis[est.id] ?? 0;
      const cota = num(est.cota_inundacao) ?? Infinity;
      const real = num(niveisReais?.[est.id] ?? est.nivel_atual);
      const acimaCota = nivel >= cota;
      lista.push({
        id: `rio-${est.id}`,
        lat: est.lat,
        lon: est.lon,
        acima: 2.2,
        classe: 'estacao',
        prioridade: acimaCota ? 1 : 2,
        distMax: 330,
        alerta: acimaCota,
        conteudo: (
          <>
            <strong>{est.rio}</strong> {br(nivel)} m
          </>
        ),
        card: (
          <>
            <strong>{est.nome}</strong>
            <span>nível mostrado: {br(nivel)} m</span>
            <span className={acimaCota ? 'r-alerta' : ''}>cota de inundação: {br(cota, 1)} m</span>
            <span>pico de maio/2024: {br(pico2024(est.id))} m</span>
            {real !== null && <span>leitura real (ANA): {br(real)} m</span>}
          </>
        ),
      });
    }

    // 3) municípios: os que têm abrigos/quadras da operação; capital como polo
    const grupos = new Map<number, { lat: number; lon: number; n: number; pessoas: number }>();
    for (const l of r.locais) {
      const g = grupos.get(l.municipio) ?? { lat: 0, lon: 0, n: 0, pessoas: 0 };
      grupos.set(l.municipio, {
        lat: g.lat + l.lat,
        lon: g.lon + l.lon,
        n: g.n + 1,
        pessoas: g.pessoas + l.pessoasN,
      });
    }
    for (const [ibge, g] of grupos) {
      const m = municipioPorIbge.get(ibge);
      if (!m) continue;
      lista.push({
        id: `mun-${ibge}`,
        lat: g.lat / g.n,
        lon: g.lon / g.n,
        acima: 3.4,
        classe: 'municipio',
        prioridade: g.pessoas > 0 ? 3 : m.nome === 'Porto Alegre' ? 4 : 5,
        distMax: g.pessoas > 0 ? 300 : 140,
        conteudo: m.nome,
      });
    }

    // 4) abrigos e quadras: só de perto; com item crítico viram alerta e aparecem de mais longe
    if (tela !== 'linha-do-tempo')
      for (const l of r.locais) {
        if (l.pessoasN <= 0) continue;
        const critico = l.urgenciaMax >= 0.5;
        lista.push({
          id: `loc-${l.id}`,
          lat: l.lat,
          lon: l.lon,
          acima: 0.6 + Math.sqrt(l.pessoasN) / 7 + 0.5,
          classe: 'local',
          prioridade: critico ? 1 : 3.5,
          distMax: critico ? 150 : 90,
          alerta: critico,
          conteudo: (
            <>
              {nomeCurto(l.nome)} · {Math.round(l.pessoasN).toLocaleString('pt-BR')}
            </>
          ),
        });
      }

    // 5) linha do tempo: valor de cada coluna do evento selecionado
    if (tela === 'linha-do-tempo')
      for (const c of [...COLUNAS, ...COLUNAS_RIO]) {
        const a = alturaAlvo(evento, c);
        if (a.h <= 0) continue;
        lista.push({
          id: `col-${c.id}`,
          lat: c.lat,
          lon: c.lon,
          acima: a.h + 0.8,
          classe: 'coluna',
          prioridade: c.id.startsWith('r-') ? 2.2 : 3,
          distMax: 320,
          conteudo: a.texto,
        });
      }

    // 6) parceiros (nomes fictícios), na tela de parceiros
    if (tela === 'parceiros')
      for (const p of DADOS.parceiros.parceiros)
        lista.push({
          id: `par-${p.id}`,
          lat: p.lat,
          lon: p.lon,
          acima: 2.4,
          classe: 'parceiro',
          prioridade: 5,
          distMax: 170,
          conteudo: p.nome,
        });

    return [...lista, ...extrasLista];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, tela, evento, niveisReais, estados, contexto, extrasLista.length]);
}

/** O relevo esconde o ponto? Marcha do ponto até a câmera amostrando a altura do terreno. */
function ocluido(relevo: Relevo, cam: [number, number, number], x: number, y: number, z: number) {
  const PASSOS = 14;
  for (let i = 1; i < PASSOS; i++) {
    const t = i / PASSOS;
    if (t > 0.92) break;
    const px = x + (cam[0] - x) * t;
    const py = y + (cam[1] - y) * t;
    const pz = z + (cam[2] - z) * t;
    const [lat, lon] = deMundo(px, pz);
    if (lat > BBOX.norte || lat < BBOX.sul || lon < BBOX.oeste || lon > BBOX.leste) return false;
    if (Math.max(0, elevacao(relevo, lat, lon)) * Y_POR_METRO > py + 0.35) return true;
  }
  return false;
}

export default function CamadaRotulos() {
  const rotulos = useRotulos();
  const apresentando = useOperacao((s) => s.apresentacao.ativa);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [relevo, setRelevo] = useState<Relevo | null>(null);
  const els = useRef(new Map<string, HTMLDivElement>());
  const visiveis = useRef(new Set<string>());
  const dados = useRef(rotulos);
  dados.current = rotulos;
  const exp = useRef(expandido);
  exp.current = expandido;

  useEffect(() => {
    void carregarRelevo().then(setRelevo);
  }, []);

  useEffect(() => {
    let id = 0;
    let quadro = 0;
    const caixasVisiveis = (): CaixaRotulo[] =>
      [...visiveis.current].flatMap((k) => {
        const e = els.current.get(k)?.firstElementChild as HTMLElement | undefined;
        if (!e) return [];
        const b = e.getBoundingClientRect();
        return [
          { id: k, x: b.left, y: b.top, w: b.width, h: b.height, prioridade: 0, distancia: 0 },
        ];
      });
    window.__ccRotulos = {
      sobreposicoes: () => contarSobreposicoes(caixasVisiveis()),
      visiveis: () => [...visiveis.current],
    };
    const passo = () => {
      id = requestAnimationFrame(passo);
      if (quadro++ % 3 !== 0 || !visao.camera || !visao.largura) return;
      const cam = posicaoCamera();
      if (!cam) return;
      const d = zoom.dist;
      const candidatos: (CaixaRotulo & { sx: number; sy: number })[] = [];
      // 1ª fase: leitura (projeção + medidas)
      for (const ro of dados.current) {
        const el = els.current.get(ro.id);
        if (!el) continue;
        if (
          (ro.distMin !== undefined && d < ro.distMin) ||
          (ro.distMax !== undefined && d > ro.distMax)
        )
          continue;
        const [x, z] = paraMundo(ro.lat, ro.lon);
        const dentro =
          ro.lat <= BBOX.norte &&
          ro.lat >= BBOX.sul &&
          ro.lon >= BBOX.oeste &&
          ro.lon <= BBOX.leste;
        const y =
          (relevo && dentro ? Math.max(0, elevacao(relevo, ro.lat, ro.lon)) * Y_POR_METRO : 0) +
          ro.acima;
        const p = projetar(x, y, z);
        if (!p) continue;
        if (p.sx < -20 || p.sx > visao.largura + 20 || p.sy < 40 || p.sy > visao.altura + 10)
          continue;
        if (relevo && dentro && ocluido(relevo, cam, x, y, z)) continue;
        const chip = el.firstElementChild as HTMLElement;
        const w = chip.offsetWidth;
        const h = chip.offsetHeight;
        const aberto = exp.current === ro.id;
        candidatos.push({
          id: ro.id,
          sx: p.sx,
          sy: p.sy,
          x: p.sx - w / 2,
          y: p.sy - h - 10,
          w,
          h,
          prioridade: aberto ? 0 : ro.prioridade,
          distancia: p.dist,
          visivelAntes: visiveis.current.has(ro.id),
        });
        if (aberto) {
          // o card expandido ocupa a área acima do chip: bloqueia os rótulos que ficariam embaixo dele
          const card = el.querySelector<HTMLElement>('.rotulo-card');
          if (card)
            candidatos.push({
              id: `${ro.id}#card`,
              sx: 0,
              sy: 0,
              x: p.sx - w / 2,
              y: p.sy - h - 10 - card.offsetHeight - 22,
              w: Math.max(w, card.offsetWidth),
              h: card.offsetHeight + 22,
              prioridade: 0,
              distancia: 0,
              fixo: true,
            });
        }
      }
      const ok = resolverColisoes(candidatos, 5);
      // 2ª fase: escrita
      const agora = new Set<string>();
      for (const c of candidatos) {
        if (c.fixo) continue;
        const el = els.current.get(c.id);
        if (!el) continue;
        if (ok.has(c.id)) {
          el.style.transform = `translate3d(${Math.round(c.sx)}px, ${Math.round(c.sy)}px, 0)`;
          el.dataset.visivel = '1';
          agora.add(c.id);
        }
      }
      for (const k of visiveis.current)
        if (!agora.has(k)) {
          const el = els.current.get(k);
          if (el) el.dataset.visivel = '0';
        }
      visiveis.current = agora;
      if (exp.current && !agora.has(exp.current)) setExpandido(null);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [relevo]);

  return (
    <div className="camada-rotulos" aria-hidden={apresentando ? true : undefined}>
      {rotulos.map((ro) => (
        <div
          key={ro.id}
          ref={(el) => {
            if (el) els.current.set(ro.id, el);
            else els.current.delete(ro.id);
          }}
          className="rotulo"
          data-visivel="0"
          data-classe={ro.classe}
          data-alerta={ro.alerta ? '1' : undefined}
          data-aberto={expandido === ro.id ? '1' : undefined}
        >
          {ro.card ? (
            <button
              type="button"
              className="rotulo-chip"
              aria-expanded={expandido === ro.id}
              onMouseEnter={() => setExpandido(ro.id)}
              onMouseLeave={() => setExpandido((v) => (v === ro.id ? null : v))}
              onFocus={() => setExpandido(ro.id)}
              onBlur={() => setExpandido((v) => (v === ro.id ? null : v))}
              onClick={() => setExpandido((v) => (v === ro.id ? null : ro.id))}
            >
              {ro.alerta && <i className="rotulo-ponto" aria-hidden />}
              {ro.conteudo}
            </button>
          ) : (
            <span className="rotulo-chip">
              {ro.alerta && <i className="rotulo-ponto" aria-hidden />}
              {ro.conteudo}
            </span>
          )}
          {ro.card && expandido === ro.id && (
            <span className="rotulo-card" role="tooltip">
              {ro.card}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
