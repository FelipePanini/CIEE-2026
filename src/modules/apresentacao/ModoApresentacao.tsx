/**
 * Modo Apresentação: percorre o pitch em 13 etapas só com o teclado (← → espaço, Home/End, Esc).
 * Cada etapa troca a tela/cenário e a câmera viaja no MESMO mundo 3D (sem trocar de página).
 * Ao sair, o estado do usuário (tela, cenário, cartas, ajustes) volta exatamente como estava.
 * Texto grande para projetor; todo número continua com fonte no tooltip.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DADOS } from '../../data/carregar';
import { useOperacao, useNivelAtual, useResultado } from '../../store';
import { simular, type Entrada } from '../../engine/simulacao';
import { itemPorId } from '../../engine/urgencia';
import { ZONAS } from '../../engine/producao';
import { Numero } from '../../ui/Numero';
import { fmt } from '../../ui/formato';
import { SeloCamada } from '../../ui/SeloCamada';
import { encerrarAbertura, iniciarAbertura, progressoAbertura } from '../../three/abertura';
import { INVENTARIO } from '../fontes/arquitetura';
import { baixarCardLinkedIn, gerarCard, HASHTAGS, textoDoPost } from './cardLinkedIn';
import { ETAPAS } from './etapas';
import { numero, type Dado } from '../../engine/tipos';

const n = (d?: Dado) => (d && typeof d.valor === 'number' ? d.valor : 0);
const EV_2024 = DADOS.eventos.eventos.find((e) => e.id === '2024-05')!;
const ORDEM_EVENTOS = DADOS.eventos.eventos.map((e) => e.id);

declare global {
  interface Window {
    /** Gera o card/OG a partir do estado atual (usado por scripts/gerar-og.cjs e pelos testes). */
    __ccCard?: (largura?: number, altura?: number, tipo?: string) => Promise<string>;
  }
}
if (typeof window !== 'undefined')
  window.__ccCard = async (largura = 1200, altura = 630, tipo = 'image/png') =>
    (
      await gerarCard(simular(DADOS, useOperacao.getState().entrada), { largura, altura })
    ).toDataURL(tipo, 0.9);

/** Botão do cabeçalho. */
export function BotaoApresentacao() {
  const set = useOperacao((s) => s.setApresentacao);
  return (
    <button
      type="button"
      onClick={() => set({ ativa: true, etapa: 0 })}
      className="rounded-md bg-creme-100 px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-white"
      title="Modo Apresentação (tela cheia, navegação pelas setas)"
    >
      ▶ Apresentar
    </button>
  );
}

function Destaque({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm uppercase tracking-wider text-creme-200/80 md:text-base">
        {rotulo}
      </span>
      <span className="font-display text-3xl leading-none text-creme-100 md:text-[2.6rem]">
        {children}
      </span>
    </div>
  );
}

/** Contadores da abertura: sobem junto com a água (mesmo relógio do 3D). */
function ContadoresAbertura() {
  const [p, setP] = useState(progressoAbertura() ?? 0);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setP(progressoAbertura() ?? 1);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  const pico = EV_2024.picos.find((x) => x.estacao === 'guaiba-cais-maua')!.nivel;
  return (
    <>
      <Destaque rotulo="Municípios atingidos">
        <Numero
          dado={EV_2024.indicadores.municipios_afetados}
          formatar={(v) => fmt.int(Math.round(v * p))}
        />
      </Destaque>
      <Destaque rotulo="Desabrigados">
        <Numero
          dado={EV_2024.indicadores.desabrigados}
          formatar={(v) => fmt.int(Math.round(v * p))}
        />
      </Destaque>
      <Destaque rotulo="Guaíba no Cais Mauá">
        <Numero dado={pico} formatar={(v) => `${fmt.dec2(v * p)} m`} />
      </Destaque>
    </>
  );
}

function Destaques({ id, msCarta }: { id: string; msCarta: number | null }) {
  const r = useResultado();
  const evento = useOperacao((s) => s.eventoTimeline);
  const taquari = useNivelAtual('taquari-lajeado');
  const desfazer = useOperacao((s) => s.desfazerCarta);
  switch (id) {
    case 'abertura':
      return <ContadoresAbertura />;
    case 'linha-do-tempo': {
      const ev = DADOS.eventos.eventos.find((e) => e.id === evento)!;
      const pico = ev.picos
        .filter((p) => p.estacao === 'taquari-lajeado')
        .sort((a, b) => n(b.nivel) - n(a.nivel))[0];
      return (
        <>
          <Destaque rotulo="Evento">{ev.rotulo_curto}</Destaque>
          <Destaque rotulo="Municípios">
            <Numero dado={ev.indicadores.municipios_afetados} formatar={fmt.int} />
          </Destaque>
          {pico && (
            <Destaque rotulo="Pico do Taquari (cota 19 m)">
              <Numero dado={pico.nivel} formatar={(v) => `${fmt.dec2(v)} m`} />
            </Destaque>
          )}
        </>
      );
    }
    case 'atual': {
      const ev = DADOS.eventos.eventos.at(-1)!;
      return (
        <>
          <Destaque rotulo="Taquari agora">
            <Numero dado={taquari} formatar={(v) => `${fmt.dec2(v)} m`} />
          </Destaque>
          <Destaque rotulo={`Fora de casa · ${ev.rotulo_curto}`}>
            <Numero
              dado={ev.indicadores.fora_de_casa ?? ev.indicadores.desalojados}
              formatar={fmt.int}
            />
          </Destaque>
          <Destaque rotulo="Pessoas atendidas">{fmt.int(r.kpis.pessoas)}</Destaque>
        </>
      );
    }
    case 'urgencia': {
      const l = [...r.locais]
        .filter((x) => x.pessoasN > 0)
        .sort((a, b) => b.urgenciaMax - a.urgenciaMax)[0];
      const u = l?.urgencias.find((x) => x.item === l.itemMaisUrgente);
      return l && u ? (
        <>
          <Destaque rotulo="Abrigo mais urgente">
            <span className="text-2xl md:text-4xl">{l.nome}</span>
          </Destaque>
          <Destaque rotulo={`${itemPorId(u.item).nome} na chegada`}>
            <Numero
              dado={u.coberturaNaChegada}
              formatar={(v) => (v >= 999 ? 'coberto' : `${fmt.dec1(v)} dias`)}
            />
          </Destaque>
          <Destaque rotulo="Prazo crítico">{u.prazo} dias</Destaque>
        </>
      ) : null;
    }
    case 'arrecadacao': {
      const pt = [...r.pontos].sort(
        (a, b) => (numero(b.ocupacao) ?? 0) - (numero(a.ocupacao) ?? 0),
      )[0];
      const meta = pt?.metas[0];
      return pt ? (
        <>
          <Destaque rotulo="Pontos de coleta">{r.pontos.length}</Destaque>
          <Destaque rotulo="Ponto mais cheio">
            <Numero dado={pt.ocupacao} formatar={fmt.pct} />
          </Destaque>
          {meta && (
            <Destaque rotulo="Prioridade nº 1">
              <span className="text-2xl md:text-4xl">{itemPorId(meta.item).nome}</span>
            </Destaque>
          )}
        </>
      ) : null;
    }
    case 'rotas':
    case 'carta': {
      const ro = r.rotas[0];
      const etaMax = r.locais
        .filter((l) => l.eta)
        .sort((a, b) => (numero(b.eta) ?? 0) - (numero(a.eta) ?? 0))[0];
      return (
        <>
          {id === 'carta' && r.decisoes.length > 0 && (
            <Destaque rotulo="Carta aplicada">
              <span className="text-2xl md:text-4xl">{r.decisoes.at(-1)!.titulo}</span>
            </Destaque>
          )}
          {id === 'carta' && msCarta !== null && (
            <Destaque rotulo="Tudo recalculado em">{fmt.int(Math.max(1, msCarta))} ms</Destaque>
          )}
          {ro && id === 'rotas' && (
            <Destaque rotulo="Rota da 1ª base">
              <Numero dado={ro.km} formatar={(v) => `${fmt.int(v)} km`} />
            </Destaque>
          )}
          {etaMax?.eta && (
            <Destaque rotulo={`Maior ETA · ${etaMax.nome}`}>
              <Numero dado={etaMax.eta} formatar={(v) => `${fmt.dec1(v)} h`} />
            </Destaque>
          )}
          <Destaque rotulo="Vias bloqueadas">{r.arestasBloqueadas.length}</Destaque>
          {id === 'carta' && (
            <button
              type="button"
              onClick={() => desfazer()}
              className="pointer-events-auto self-end rounded-md bg-navy-700 px-3 py-2 text-sm font-semibold ring-1 ring-coral-500/60"
            >
              Desfazer (D)
            </button>
          )}
        </>
      );
    }
    case 'quadra':
      return (
        <>
          <Destaque rotulo="Vazão da linha">
            <Numero dado={r.producao.kitsHora} formatar={(v) => `${fmt.int(v)} kits/h`} />
          </Destaque>
          <Destaque rotulo="Gargalo">
            <span className="text-coral-400">
              {ZONAS.find((z) => z.id === r.producao.gargalo)!.nome}
            </span>
          </Destaque>
          {r.producao.horasParaDemanda && (
            <Destaque rotulo={`${fmt.int(r.custos.kitsTotal)} kits em`}>
              <Numero dado={r.producao.horasParaDemanda} formatar={(v) => `${fmt.dec1(v)} h`} />
            </Destaque>
          )}
        </>
      );
    case 'gastos':
      return (
        <>
          <Destaque rotulo="Kit família">
            <Numero dado={r.kit.custo} formatar={fmt.brl} />
          </Destaque>
          <Destaque rotulo="Por pessoa/dia">
            <Numero dado={r.kit.custoPorPessoaDia} formatar={fmt.brl} />
          </Destaque>
          <Destaque rotulo="Total da operação">
            <Numero dado={r.custos.total} formatar={fmt.brlCompacto} />
          </Destaque>
        </>
      );
    case 'parceiros':
      return (
        <>
          <Destaque rotulo="Parceiros na rede">
            {DADOS.parceiros.parceiros.length}{' '}
            <SeloCamada camada="SIMULADO" texto="NOMES FICTÍCIOS" />
          </Destaque>
          <Destaque rotulo="Matches automáticos">{r.sugestoes.length}</Destaque>
        </>
      );
    case 'prontidao': {
      const ind = DADOS.previsao.prognosticos.flatMap((p) => p.indicadores).slice(0, 2);
      const pr = r.custos.prevenirReagir;
      return (
        <>
          {ind.map((i) => (
            <Destaque key={i.id} rotulo={i.rotulo}>
              <Numero dado={i.dado} />
            </Destaque>
          ))}
          {pr && (
            <Destaque rotulo="Prevenir economiza">
              <Numero dado={pr.economia} formatar={fmt.brlCompacto} />
            </Destaque>
          )}
        </>
      );
    }
    case 'bastidores':
      return (
        <>
          <Destaque rotulo="Números com fonte">{INVENTARIO.dados}</Destaque>
          <Destaque rotulo="Links de fonte">{INVENTARIO.urls}</Destaque>
          <Destaque rotulo="Testes do motor">{__ARQUITETURA__.testes}</Destaque>
        </>
      );
    default:
      return null;
  }
}

function Encerramento() {
  const r = useResultado();
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="pointer-events-auto flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => void baixarCardLinkedIn(r)}
        className="rounded-lg bg-coral-500 px-4 py-2.5 text-base font-bold text-navy-950 hover:bg-coral-400"
      >
        Gerar card para o LinkedIn
      </button>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(textoDoPost(r))
            .then(() => setCopiado(true))
            .catch(() => setCopiado(false));
        }}
        className="rounded-lg bg-navy-700 px-4 py-2.5 text-base font-semibold ring-1 ring-piscina-300/40"
      >
        {copiado ? 'Texto copiado ✓' : 'Copiar texto do post'}
      </button>
      <span className="text-lg font-bold text-piscina-300">{HASHTAGS}</span>
    </div>
  );
}

export function ModoApresentacao({ com3d }: { com3d: boolean }) {
  const { ativa, etapa: i } = useOperacao((s) => s.apresentacao);
  const set = useOperacao((s) => s.setApresentacao);
  const reduzido = useOperacao((s) => s.movimentoReduzido);
  const etapa = ETAPAS[i] ?? ETAPAS[0]!;
  const salvo = useRef<{
    entrada: Entrada;
    tela: string;
    recolhido: boolean;
    evento: string;
  } | null>(null);
  const [msCarta, setMsCarta] = useState<number | null>(null);

  // entrar: guarda o estado do usuário e pede tela cheia; sair: restaura tudo
  useEffect(() => {
    if (!ativa) return;
    const s = useOperacao.getState();
    salvo.current = {
      entrada: s.entrada,
      tela: s.tela,
      recolhido: s.painelRecolhido,
      evento: s.eventoTimeline,
    };
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    return () => {
      const v = salvo.current;
      const st = useOperacao.getState();
      if (v) {
        st.setEntrada(v.entrada);
        st.setTela(v.tela);
        st.setPainelRecolhido(v.recolhido);
        st.setEventoTimeline(v.evento);
      }
      encerrarAbertura();
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [ativa]);

  // cada etapa: tela + cenário; abertura liga o relógio da água; a carta é disparada e desfeita ao sair
  useEffect(() => {
    if (!ativa) return;
    const st = useOperacao.getState();
    if (st.entrada.cenario !== etapa.cenario) st.setCenario(etapa.cenario);
    st.setTela(etapa.tela);
    let uidCarta: string | null = null;
    let timer = 0;
    if (etapa.camera === 'abertura') iniciarAbertura(reduzido);
    if (etapa.carta) {
      uidCarta = st.dispararCarta(etapa.carta);
      const t0 = performance.now();
      simular(DADOS, useOperacao.getState().entrada);
      setMsCarta(performance.now() - t0);
    } else setMsCarta(null);
    if (etapa.id === 'linha-do-tempo') {
      // a crise muda de lugar: percorre os eventos (2024 → 2025 → 2026) a cada 3 s
      let k = 0;
      st.setEventoTimeline(ORDEM_EVENTOS[0]!);
      timer = window.setInterval(() => {
        k = Math.min(ORDEM_EVENTOS.length - 1, k + 1);
        useOperacao.getState().setEventoTimeline(ORDEM_EVENTOS[k]!);
      }, 3000);
    }
    return () => {
      if (etapa.camera === 'abertura') encerrarAbertura();
      if (uidCarta) useOperacao.getState().desfazerCarta(uidCarta);
      window.clearInterval(timer);
    };
  }, [ativa, etapa, reduzido]);

  // teclado
  useEffect(() => {
    if (!ativa) return;
    const ir = (k: number) => set({ etapa: Math.max(0, Math.min(ETAPAS.length - 1, k)) });
    const tecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const atual = useOperacao.getState().apresentacao.etapa;
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) ir(atual + 1);
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) ir(atual - 1);
      else if (e.key === 'Home') ir(0);
      else if (e.key === 'End') ir(ETAPAS.length - 1);
      else if (e.key === 'Escape') set({ ativa: false });
      else if (e.key.toLowerCase() === 'd' && ETAPAS[atual]?.carta)
        useOperacao.getState().desfazerCarta();
      else if (e.key.toLowerCase() === 'f')
        void (
          document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen?.()
        )?.catch(() => undefined);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [ativa, set]);

  if (!ativa) return null;
  const final = etapa.camera === 'encerramento';
  return (
    <div
      className={`modo-apresentacao pointer-events-none z-40 flex flex-col ${com3d ? 'fixed inset-0' : 'relative'}`}
      role="region"
      aria-label={`Modo Apresentação — etapa ${i + 1} de ${ETAPAS.length}: ${etapa.titulo}`}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="leading-tight [text-shadow:0_2px_8px_#0b1e26]">
          <p className="font-display text-xl text-creme-100">Central de Comando</p>
          <p className="text-sm text-piscina-300">Solução Distribuidora · Ação Social RS</p>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 text-sm">
          <span className="font-display text-2xl tabular-nums text-creme-100">
            {String(i + 1).padStart(2, '0')}
            <span className="text-creme-200/60"> / {ETAPAS.length}</span>
          </span>
          <button
            type="button"
            onClick={() => set({ ativa: false })}
            className="rounded-md bg-navy-950/80 px-3 py-1.5 font-semibold ring-1 ring-piscina-300/40"
          >
            Sair (Esc)
          </button>
        </div>
      </div>

      <div
        className={`mt-auto flex flex-col gap-5 px-5 pb-2 md:px-8 ${final ? 'mb-auto items-center text-center' : ''}`}
        aria-live="polite"
      >
        <div
          className={`flex flex-col gap-3 rounded-2xl p-6 ${final ? 'max-w-5xl items-center bg-navy-950/85' : 'max-w-3xl bg-gradient-to-r from-navy-950/92 via-navy-950/82 to-navy-950/55'}`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-coral-400">
            {etapa.rotulo}
          </p>
          <h2
            className={`font-display leading-[1.05] text-creme-100 ${final ? 'text-4xl md:text-7xl' : 'text-3xl md:text-5xl'}`}
          >
            {etapa.titulo}
          </h2>
          <p className="max-w-3xl text-xl text-creme-200 md:text-2xl">{etapa.frase}</p>
          <div className="pointer-events-auto mt-2 flex flex-wrap items-end gap-x-10 gap-y-4">
            {final ? <Encerramento /> : <Destaques id={etapa.id} msCarta={msCarta} />}
          </div>
        </div>
      </div>

      <nav
        aria-label="Etapas da apresentação"
        className="pointer-events-auto flex items-center gap-3 bg-gradient-to-t from-navy-950/95 to-transparent px-5 pb-4 pt-6"
      >
        <button
          type="button"
          onClick={() => set({ etapa: Math.max(0, i - 1) })}
          disabled={i === 0}
          className="rounded-md bg-navy-800 px-3 py-2 text-lg font-bold disabled:opacity-30"
          aria-label="Etapa anterior"
        >
          ←
        </button>
        <ol className="flex min-w-0 flex-1 gap-1">
          {ETAPAS.map((e, k) => (
            <li key={e.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => set({ etapa: k })}
                aria-current={k === i ? 'step' : undefined}
                className="group flex w-full flex-col gap-1 text-left"
                title={e.titulo}
              >
                <span
                  className={`h-1.5 w-full rounded-full ${k < i ? 'bg-piscina-300' : k === i ? 'bg-coral-500' : 'bg-white/15'}`}
                />
                <span
                  className={`hidden truncate text-[0.7rem] lg:block ${k === i ? 'font-bold text-creme-100' : 'text-creme-200/60'}`}
                >
                  {e.rotulo}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => set({ etapa: Math.min(ETAPAS.length - 1, i + 1) })}
          disabled={i === ETAPAS.length - 1}
          className="rounded-md bg-coral-500 px-3 py-2 text-lg font-bold text-navy-950 disabled:opacity-30"
          aria-label="Próxima etapa"
        >
          →
        </button>
        <span className="hidden text-xs text-creme-200/70 xl:inline">
          ← → navegar · F tela cheia · Esc sair
        </span>
      </nav>
    </div>
  );
}
