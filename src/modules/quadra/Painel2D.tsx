import { useState } from 'react';
import { useOperacao, useResultado } from '../../store';
import { Botao, Grade, Kpi, Painel, TituloTela } from '../../ui/blocos';
import { Numero } from '../../ui/Numero';
import { fmt } from '../../ui/formato';
import { ZONAS, type Zona } from '../../engine/producao';
import { FraseKit } from '../urgencia/Painel2D';
import { EtiquetaKit } from '../humano/Rastreio';

export function ControleVoluntarios({ zona }: { zona: Zona }) {
  const v = useOperacao((s) => s.entrada.voluntarios[zona]);
  const setV = useOperacao((s) => s.setVoluntarios);
  return (
    <span className="inline-flex items-center gap-1">
      <button
        className="h-7 w-7 rounded bg-navy-700 text-sm"
        onClick={() => setV(zona, v - 1)}
        aria-label={`Menos voluntários — ${zona}`}
      >
        −
      </button>
      <span className="w-6 text-center font-display tabular-nums">{v}</span>
      <button
        className="h-7 w-7 rounded bg-navy-700 text-sm"
        onClick={() => setV(zona, v + 1)}
        aria-label={`Mais voluntários — ${zona}`}
      >
        +
      </button>
    </span>
  );
}

export function EstacaoBilhete() {
  const bilhetes = useOperacao((s) => s.bilhetes);
  const add = useOperacao((s) => s.adicionarBilhete);
  const [t, setT] = useState('');
  return (
    <Painel titulo="Estação do bilhete">
      <p className="text-xs text-creme-200">
        Cada kit leva uma mensagem de voluntário ou doador. Sem nomes completos nem contatos — só o
        primeiro nome ou a cidade.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (t.trim()) add(t.trim().slice(0, 140));
          setT('');
        }}
      >
        <input
          value={t}
          onChange={(e) => setT(e.target.value)}
          maxLength={140}
          placeholder="Escreva uma mensagem para o kit…"
          className="flex-1 rounded bg-navy-800 px-2 py-1.5 text-sm"
          aria-label="Mensagem do bilhete"
        />
        <Botao tipo="primario" type="submit">
          Colocar no kit
        </Botao>
      </form>
      <ul
        className="grid gap-2 text-xs"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
      >
        {bilhetes.slice(0, 6).map((b, i) => (
          <li key={i} className="painel-claro rotate-[-1deg] p-2 font-semibold shadow">
            “{b}”
          </li>
        ))}
      </ul>
    </Painel>
  );
}

export function Painel2DQuadra() {
  const r = useResultado();
  const pr = r.producao;
  const max = Math.max(...pr.porZona.map((z) => z.kitsHora), 1);
  return (
    <div className="flex flex-col gap-4">
      <TituloTela
        titulo="Chegada na quadra — linha de montagem"
        area="producao"
        pergunta="como chega"
      >
        <span className="text-xs text-creme-200">
          <FraseKit />
        </span>
      </TituloTela>
      <Grade min={170}>
        <Kpi rotulo="Vazão da linha">
          <Numero dado={pr.kitsHora} formatar={(v) => `${fmt.dec1(v)} kits/h`} />
        </Kpi>
        <Kpi rotulo="Gargalo" destaque>
          {ZONAS.find((z) => z.id === pr.gargalo)!.nome}
        </Kpi>
        <Kpi rotulo="Kits demandados">{fmt.int(r.custos.kitsTotal)}</Kpi>
        <Kpi rotulo="Tempo para produzir" nota="fase de Produção do case: 1h45">
          {pr.horasParaDemanda ? (
            <Numero dado={pr.horasParaDemanda} formatar={(v) => `${fmt.dec1(v)} h`} />
          ) : (
            '—'
          )}
        </Kpi>
      </Grade>
      <Painel titulo="Layout da quadra: descarga → triagem → montagem → bilhete → expedição">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${ZONAS.length}, minmax(0, 1fr))` }}
        >
          {pr.porZona.map((z, i) => {
            const def = ZONAS[i]!;
            const gargalo = z.zona === pr.gargalo;
            return (
              <div
                key={z.zona}
                className={`flex flex-col items-center gap-2 rounded-xl p-2 text-center ${gargalo ? 'bg-coral-500/20 ring-2 ring-coral-500' : 'bg-navy-800'}`}
              >
                <span className="text-[0.7rem] font-bold uppercase tracking-wider">{def.nome}</span>
                <div className="flex h-24 w-6 items-end overflow-hidden rounded bg-navy-700">
                  <div
                    className={`w-full rounded ${gargalo ? 'anima-pulso bg-coral-500' : 'bg-piscina-300'}`}
                    style={{ height: `${(z.kitsHora / max) * 100}%` }}
                  />
                </div>
                <span className="font-display text-lg tabular-nums">{fmt.int(z.kitsHora)}</span>
                <span className="text-[0.62rem] text-creme-200">kits/h</span>
                <ControleVoluntarios zona={z.zona} />
                <span className="text-[0.62rem] text-creme-200">voluntários</span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-creme-200">
          A linha anda na velocidade da zona mais lenta. Mova voluntários para o gargalo e veja a
          vazão, o tempo de produção, o ETA das rotas e o semáforo da Produção mudarem juntos.
        </p>
      </Painel>
      <Grade min={360}>
        <EstacaoBilhete />
        <EtiquetaKit />
      </Grade>
    </div>
  );
}
