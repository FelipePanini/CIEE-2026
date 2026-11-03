import { useState } from 'react';
import { useOperacao, useResultado } from '../store';
import { CENARIOS, NIVEIS_ALERTA } from '../engine/cenarios';
import { FASES, ITENS } from '../engine/urgencia';
import { DEFINICOES } from '../engine/parametros';
import { DADOS } from '../data/carregar';
import { SeloCamada } from './SeloCamada';
import { Numero } from './Numero';
import { fmt } from './formato';

export function SeletorCenario() {
  const cenario = useOperacao((s) => s.entrada.cenario);
  const setCenario = useOperacao((s) => s.setCenario);
  return (
    <div
      role="radiogroup"
      aria-label="Cenário"
      className="flex rounded-full bg-navy-800 p-0.5 text-xs"
    >
      {CENARIOS.map((c) => (
        <button
          key={c.id}
          role="radio"
          aria-checked={cenario === c.id}
          title={c.descricao}
          onClick={() => setCenario(c.id)}
          className={`rounded-full px-3 py-1.5 font-semibold transition ${cenario === c.id ? 'bg-coral-500 text-navy-950' : 'text-creme-200 hover:text-creme-100'}`}
        >
          {c.curto}
        </button>
      ))}
    </div>
  );
}

export function SeletorFase() {
  const fase = useOperacao((s) => s.entrada.fase);
  const setFase = useOperacao((s) => s.setFase);
  const cenario = useOperacao((s) => s.entrada.cenario);
  const boletim = useOperacao((s) => s.entrada.boletim);
  const setBoletim = useOperacao((s) => s.setBoletim);
  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
        <span className="opacity-70">Fase</span>
        <select
          value={fase}
          onChange={(e) => setFase(e.target.value as typeof fase)}
          className="rounded-md bg-navy-800 px-2 py-1 text-creme-100"
        >
          {FASES.map((f) => (
            <option key={f.id} value={f.id} title={f.descricao}>
              {f.rotulo}
            </option>
          ))}
        </select>
      </label>
      {cenario === 'atual' && (
        <label className="flex items-center gap-1">
          <span className="opacity-70">Boletim</span>
          <select
            value={boletim}
            onChange={(e) => setBoletim(e.target.value as typeof boletim)}
            className="rounded-md bg-navy-800 px-2 py-1 text-creme-100"
          >
            <option value="2026-07">23/07/2026 (pico)</option>
            <option value="2026-09">22/09/2026 (mais recente com abrigos)</option>
          </select>
        </label>
      )}
    </div>
  );
}

export function IndicadorAlerta() {
  const r = useResultado();
  const n = NIVEIS_ALERTA[r.nivelAlerta]!;
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-navy-950"
      style={{ background: n.cor }}
      title="Nível de alerta da operação (deriva do cenário, dos rios e das Cartas de Crise)"
    >
      <span className={r.nivelAlerta >= 3 ? 'anima-pulso' : ''}>●</span> {n.nome}
    </span>
  );
}

/** Painel lateral com todos os parâmetros "critério do grupo" e os pesos de criticidade por fase. */
export function PainelConfiguracao() {
  const [aberto, setAberto] = useState(false);
  const entrada = useOperacao((s) => s.entrada);
  const setParametro = useOperacao((s) => s.setParametro);
  const setPeso = useOperacao((s) => s.setPeso);
  const restaurar = useOperacao((s) => s.restaurarPadroes);
  const refEsfera = DADOS.esfera.padroes;
  const referencia: Partial<Record<string, typeof refEsfera.agua_total_min_l>> = {
    consumo_agua_l: refEsfera.agua_beber_max_l,
    consumo_racao: refEsfera.energia_kcal,
    consumo_higiene_kit: refEsfera.sabonete_banho_g_mes,
    area_quadra_m2: refEsfera.espaco_min_m2,
    familia_ref: DADOS.municipios.media_moradores_domicilio_rs,
    prazo_cobertores: refEsfera.cobertor_por_pessoa,
  };
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-md bg-navy-800 px-2.5 py-1.5 text-xs font-semibold text-creme-100 hover:bg-navy-700"
        aria-haspopup="dialog"
      >
        ⚙ Critérios
      </button>
      {aberto && (
        <div
          role="dialog"
          aria-label="Critérios do grupo"
          className="fixed inset-0 z-[900] flex justify-end bg-navy-950/60"
          onClick={() => setAberto(false)}
        >
          <div
            className="h-full w-[min(30rem,100vw)] overflow-y-auto bg-navy-900 p-5 shadow-2xl ring-1 ring-piscina-300/30"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">Critérios do grupo</h2>
                <p className="text-xs text-creme-200">
                  Parâmetros do modelo. Cada mudança recalcula urgência, rotas, metas, produção e
                  custos em todas as telas.
                </p>
              </div>
              <button
                onClick={() => setAberto(false)}
                className="text-2xl leading-none text-creme-200"
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <div className="flex flex-col gap-4">
              {DEFINICOES.filter((d) => d.min !== d.max).map((d) => (
                <label key={d.id} className="flex flex-col gap-1 text-sm">
                  <span className="flex items-center justify-between gap-2">
                    <span>{d.rotulo}</span>
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <SeloCamada camada="PARAMETRO" />
                      <strong>
                        {d.unidade === 'fração'
                          ? fmt.pct(entrada.parametros[d.id])
                          : `${+entrada.parametros[d.id].toFixed(3)} ${d.unidade}`}
                      </strong>
                    </span>
                  </span>
                  <input
                    type="range"
                    min={d.min}
                    max={d.max}
                    step={d.passo}
                    value={entrada.parametros[d.id]}
                    onChange={(e) => setParametro(d.id, Number(e.target.value))}
                    className="accent-coral-500"
                  />
                  {d.descricao && (
                    <span className="text-[0.7rem] leading-snug text-creme-200/80">
                      {d.descricao}
                    </span>
                  )}
                  {referencia[d.id] && (
                    <span className="text-[0.7rem] text-piscina-300">
                      Referência real: <Numero dado={referencia[d.id]!} selo />
                    </span>
                  )}
                </label>
              ))}
              <section>
                <h3 className="font-display mb-2 text-base">Pesos de criticidade por fase</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-creme-200">
                      <th className="py-1">Item</th>
                      {FASES.map((f) => (
                        <th key={f.id}>{f.rotulo}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ITENS.map((it) => (
                      <tr key={it.id}>
                        <td className="py-1 pr-2">{it.nome}</td>
                        {FASES.map((f) => (
                          <td key={f.id}>
                            <input
                              type="number"
                              min={0}
                              max={1}
                              step={0.1}
                              value={entrada.pesos[it.id]?.[f.id] ?? it.pesos[f.id]}
                              onChange={(e) => setPeso(it.id, f.id, Number(e.target.value))}
                              className="w-14 rounded bg-navy-800 px-1 py-0.5 tabular-nums"
                              aria-label={`Peso ${it.nome} — ${f.rotulo}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <button
                onClick={restaurar}
                className="self-start rounded-md bg-navy-700 px-3 py-1.5 text-xs"
              >
                Restaurar padrões do grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
