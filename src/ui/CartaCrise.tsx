import { useState } from 'react';
import { DADOS } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import { AREA_ROTULO, Botao } from './blocos';
import type { Carta } from '../data/schema';

const COR = { atencao: '#f2b84b', alerta: '#f3876d', critico: '#ef6a4b' } as const;

export function CartaVisual({ carta, verso = false }: { carta: Carta; verso?: boolean }) {
  return (
    <div
      className="painel-claro flex w-full max-w-md flex-col gap-2 p-5 shadow-2xl"
      style={{ borderTop: `8px solid ${COR[carta.severidade]}` }}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-navy-700">
        Carta de Crise · {AREA_ROTULO[carta.area]} · {carta.severidade}
      </p>
      <h3 className="font-display text-2xl leading-tight">{carta.titulo}</h3>
      <p className="text-sm">{carta.descricao}</p>
      {verso && (
        <p className="rounded bg-navy-900 p-2 text-xs text-creme-100">
          Resposta sugerida: {carta.resposta_sugerida}
        </p>
      )}
      {carta.inspirado_em ? (
        <a
          href={carta.inspirado_em.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-navy-700 underline"
        >
          <span className="mr-1 rounded bg-coral-500 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-navy-950">
            inspirado em fato real
          </span>
          {carta.inspirado_em.texto} — {carta.inspirado_em.fonte}
        </a>
      ) : (
        <span className="text-[0.65rem] uppercase tracking-wider text-navy-700">
          evento hipotético (simulado)
        </span>
      )}
    </div>
  );
}

/** Botão "Carta de Crise": sorteia ou escolhe um evento; aplica e permite desfazer. */
export function BotaoCartaCrise() {
  const [aberto, setAberto] = useState(false);
  const [escolhida, setEscolhida] = useState<Carta | null>(null);
  const disparar = useOperacao((s) => s.dispararCarta);
  const cartas = DADOS.cartas.cartas;
  const sortear = () => setEscolhida(cartas[Math.floor(Math.random() * cartas.length)]!);
  return (
    <>
      <button
        onClick={() => {
          setAberto(true);
          setEscolhida(null);
        }}
        className="rounded-md bg-coral-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-navy-950 shadow hover:bg-coral-400"
      >
        🂠 Carta de Crise
      </button>
      {aberto && (
        <div
          role="dialog"
          aria-label="Carta de Crise"
          className="fixed inset-0 z-[950] flex items-center justify-center bg-navy-950/75 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="flex max-h-full w-[min(56rem,100%)] flex-col gap-4 overflow-y-auto rounded-2xl bg-navy-900 p-5 ring-1 ring-piscina-300/30"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl">Carta de Crise</h2>
              <button
                onClick={() => setAberto(false)}
                className="text-2xl text-creme-200"
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            {escolhida ? (
              <div className="flex flex-col items-center gap-4">
                <CartaVisual carta={escolhida} />
                <div className="flex gap-2">
                  <Botao
                    tipo="primario"
                    onClick={() => {
                      disparar(escolhida.id);
                      setAberto(false);
                    }}
                  >
                    Aplicar na operação
                  </Botao>
                  <Botao onClick={() => setEscolhida(null)}>Escolher outra</Botao>
                </div>
              </div>
            ) : (
              <>
                <Botao tipo="primario" onClick={sortear} className="self-start text-sm">
                  🎲 Sortear uma carta
                </Botao>
                <ul
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))' }}
                >
                  {cartas.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setEscolhida(c)}
                        className="flex h-full w-full flex-col gap-1 rounded-xl bg-navy-800 p-3 text-left hover:bg-navy-700"
                        style={{ borderLeft: `4px solid ${COR[c.severidade]}` }}
                      >
                        <span className="text-sm font-bold">{c.titulo}</span>
                        <span className="text-[0.68rem] text-creme-200">{AREA_ROTULO[c.area]}</span>
                        {c.inspirado_em && (
                          <span className="text-[0.6rem] font-bold uppercase text-coral-400">
                            inspirado em fato real
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Banner da última carta aplicada, com desfazer. */
export function BannerCrise() {
  const r = useResultado();
  const desfazer = useOperacao((s) => s.desfazerCarta);
  const ultima = r.decisoes[r.decisoes.length - 1];
  if (!ultima) return null;
  const carta = DADOS.cartas.cartas.find((c) => c.titulo === ultima.titulo)!;
  return (
    <div
      role="alert"
      className="relative z-20 flex flex-wrap items-center gap-3 px-4 py-2 text-sm text-navy-950"
      style={{ background: COR[carta.severidade] }}
    >
      <strong className="font-display">⚠ {ultima.titulo}</strong>
      <span className="flex-1">{ultima.resposta}</span>
      <span className="text-xs">
        {r.decisoes.length > 1 ? `+${r.decisoes.length - 1} carta(s) ativa(s)` : ''}
      </span>
      <button
        onClick={() => desfazer(ultima.uid)}
        className="rounded bg-navy-950/20 px-2 py-1 text-xs font-bold"
      >
        ↶ Desfazer
      </button>
    </div>
  );
}
