/**
 * Avisos por cima do palco, em vidro:
 *  - cada alerta novo do motor vira um toast;
 *  - cada Carta de Crise aplicada aparece como um card de vidro que vira na tela (a propagação
 *    em pulsos no organograma e em ondas no mapa continua no 3D).
 */
import { useEffect, useRef, useState } from 'react';
import { DADOS } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import type { Carta } from '../data/schema';
import { AREA_ROTULO } from './blocos';
import { GlassPanel, toastVidro } from './vidro';

export function AvisosVidro() {
  const r = useResultado();
  const apresentando = useOperacao((s) => s.apresentacao.ativa);
  const recolhido = useOperacao((s) => s.painelRecolhido);
  const [carta, setCarta] = useState<Carta | null>(null);
  const visto = useRef({
    alertas: new Set(r.alertas.map((a) => a.id)),
    decisoes: r.decisoes.length,
  });
  const cenario = r.cenario.id;
  const cenarioAnterior = useRef(cenario);

  useEffect(() => {
    // trocar de cenário recria os alertas: não é novidade, só registra
    if (cenarioAnterior.current !== cenario) {
      cenarioAnterior.current = cenario;
      visto.current.alertas = new Set(r.alertas.map((a) => a.id));
      visto.current.decisoes = r.decisoes.length;
      return;
    }
    const novos = r.alertas.filter((a) => !visto.current.alertas.has(a.id));
    for (const a of novos.slice(0, 2))
      toastVidro(
        `${a.titulo} — ${a.mensagem}`.slice(0, 150),
        a.nivel === 'info' ? 'info' : 'alert',
      );
    visto.current.alertas = new Set(r.alertas.map((a) => a.id));
    if (r.decisoes.length > visto.current.decisoes) {
      const d = r.decisoes.at(-1)!;
      setCarta(DADOS.cartas.cartas.find((x) => x.titulo === d.titulo) ?? null);
    }
    visto.current.decisoes = r.decisoes.length;
  }, [r.alertas, r.decisoes, cenario]);

  useEffect(() => {
    if (!carta) return;
    const id = window.setTimeout(() => setCarta(null), 4600);
    return () => window.clearTimeout(id);
  }, [carta]);

  if (!carta) return null;
  // área livre: à esquerda do painel lateral; na apresentação o texto fica à esquerda, a carta à direita
  const lado = apresentando
    ? 'right-[8%]'
    : recolhido
      ? 'left-1/2 -translate-x-1/2'
      : 'left-[calc((100vw-34rem)/2)] -translate-x-1/2';
  return (
    <div className={`pointer-events-none absolute top-[24%] z-50 ${lado}`}>
      <GlassPanel
        raio={22}
        key={carta.id}
        className="carta-vidro w-[min(30rem,86vw)]"
        classeCorpo="flex flex-col gap-2 p-6"
        role="status"
        aria-label={`Carta de Crise aplicada: ${carta.titulo}`}
      >
        <span
          className="h-1.5 w-16 rounded-full"
          style={{
            background:
              carta.severidade === 'atencao' ? 'var(--color-atencao)' : 'var(--color-alerta)',
          }}
        />
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-texto-2">
          Carta de Crise · {AREA_ROTULO[carta.area]} · {carta.severidade}
        </p>
        <p className="font-display text-3xl leading-tight">{carta.titulo}</p>
        <p className="text-base leading-snug text-texto">{carta.descricao}</p>
        <p className="self-start rounded-full border border-linha-forte px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-texto-2">
          {carta.inspirado_em ? 'inspirado em fato real' : 'evento hipotético (simulado)'}
        </p>
      </GlassPanel>
    </div>
  );
}
