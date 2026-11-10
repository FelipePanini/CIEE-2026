import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DADOS, municipioPorIbge, nomeMunicipio } from '../../data/carregar';
import { useNivelAtual, useOperacao, useResultado } from '../../store';
import { Grade, Kpi, Painel, TituloTela } from '../../ui/blocos';
import { MapaSVG, type PinoMapa } from '../../ui/MapaSVG';
import { Numero, SeloDoDado } from '../../ui/Numero';
import { fmt } from '../../ui/formato';
import { corSerie, varCor } from '../../ui/cores';
import { corUrgencia } from '../../ui/cores';
import { eventoReferencia } from '../../engine/cenarios';
import type { Dado } from '../../engine/tipos';
import { cor } from '../../ui/cores';

const n = (d?: Dado) => (d && typeof d.valor === 'number' ? d.valor : null);

/** Picos históricos por estação (para as marcas do slider). */
export function picosDaEstacao(estacao: string) {
  return DADOS.eventos.eventos.flatMap((e) =>
    e.picos.filter((p) => p.estacao === estacao).map((p) => ({ evento: e, nivel: p.nivel })),
  );
}

export function SliderNivel({ estacao }: { estacao: string }) {
  const est = DADOS.rios.estacoes.find((e) => e.id === estacao)!;
  const r = useResultado();
  const setNivel = useOperacao((s) => s.setNivel);
  const manual = useOperacao((s) => s.entrada.niveis[estacao]);
  const nivelReal = useNivelAtual(estacao);
  const picos = picosDaEstacao(estacao);
  const max = Math.ceil(
    Math.max(...picos.map((p) => n(p.nivel) ?? 0), n(est.cota_inundacao) ?? 0) * 1.08,
  );
  const atual = r.niveis[estacao] ?? 0;
  const cota = n(est.cota_inundacao)!;
  const pos = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{est.nome}</span>
        <span
          className="font-display text-xl tabular-nums"
          style={{ color: atual >= cota ? varCor('alerta') : varCor('texto') }}
        >
          {fmt.dec2(atual)} m
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={0.01}
        value={atual}
        onChange={(e) => setNivel(estacao, Number(e.target.value))}
        aria-label={`Nível simulado — ${est.nome}`}
        className="accent-texto"
      />
      <div className="relative h-5 text-[0.62rem]">
        <span className="absolute -translate-x-1/2 text-alerta" style={{ left: pos(cota) }}>
          ▲ cota {fmt.dec1(cota)}
        </span>
        {picos.map((p, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 whitespace-nowrap text-texto-2"
            style={{ left: pos(n(p.nivel) ?? 0), top: i % 2 ? 10 : 0 }}
          >
            │{p.evento.rotulo_curto}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[0.68rem] text-texto-2">
        <span>
          Nível real agora: <Numero dado={nivelReal} formatar={(v) => `${fmt.dec2(v)} m`} selo />
        </span>
        {manual !== undefined && (
          <button onClick={() => setNivel(estacao, null)} className="underline">
            voltar ao nível real
          </button>
        )}
      </div>
    </div>
  );
}

function GraficoNivel({ estacao }: { estacao: string }) {
  const est = DADOS.rios.estacoes.find((e) => e.id === estacao)!;
  const serie = DADOS.seriesRios.series.find((s) => s.estacao === estacao && s.camada === 'ATUAL');
  const dados = useMemo(
    () =>
      (serie?.pontos ?? []).map(([d, v]) => ({ d: d.slice(5).split('-').reverse().join('/'), v })),
    [serie],
  );
  if (!serie) return null;
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold">{est.rio} — máximo diário, últimos 125 dias</span>
        <span className="text-[0.62rem] uppercase tracking-wider text-texto-2">{serie.fonte}</span>
      </figcaption>
      <div className="h-40">
        <ResponsiveContainer>
          <LineChart data={dados} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={cor('linha-fraca')} vertical={false} />
            <XAxis
              dataKey="d"
              tick={{ fill: cor('texto-2'), fontSize: 10 }}
              interval={20}
              tickLine={false}
              axisLine={{ stroke: cor('linha-forte') }}
            />
            <YAxis
              tick={{ fill: cor('texto-2'), fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: cor('fundo-0'),
                border: '1px solid var(--color-linha-forte)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => [`${fmt.dec2(Number(v))} m`, 'nível']}
              labelStyle={{ color: cor('cinza-2') }}
            />
            <ReferenceLine
              y={n(est.cota_inundacao) ?? 0}
              stroke={corSerie(0)}
              strokeDasharray="4 3"
              label={{
                value: 'cota de inundação',
                fill: cor('alerta'),
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={corSerie(1)}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function Painel2DPanorama() {
  const r = useResultado();
  const entrada = useOperacao((s) => s.entrada);
  const refId = eventoReferencia(entrada.cenario, entrada.boletim) ?? '2026-09';
  const ev = DADOS.eventos.eventos.find((e) => e.id === refId)!;
  const pinos: PinoMapa[] = [
    ...ev.municipios
      .filter((m) => municipioPorIbge.has(m.ibge) && m.desabrigados && n(m.desabrigados))
      .map((m) => {
        const mu = municipioPorIbge.get(m.ibge)!;
        return {
          id: `m${m.ibge}`,
          ll: [mu.lat, mu.lon] as [number, number],
          cor: cor('alerta'),
          raio: 6 + Math.sqrt(n(m.desabrigados)!) / 6,
          titulo: `${mu.nome}: ${fmt.int(n(m.desabrigados)!)} desabrigados (${ev.rotulo_curto})`,
        };
      }),
    ...r.locais.map((l) => ({
      id: l.id,
      ll: [l.lat, l.lon] as [number, number],
      cor: l.pessoasN ? corUrgencia(l.urgenciaMax, true) : cor('cinza-2'),
      raio: 4 + Math.sqrt(l.pessoasN) / 5,
      forma: l.tipo === 'quadra' ? ('quadrado' as const) : ('circulo' as const),
      rotulo: l.nome.replace(
        /^(EMEF|EEEF|Instituto Estadual de Educação|Colégio Estadual|Abrigo( na)?)\s*/i,
        '',
      ),
      titulo: `${l.nome} — ${fmt.int(l.pessoasN)} pessoas`,
      pulsar: l.urgenciaMax >= 0.7,
    })),
    ...DADOS.rios.estacoes.map((e) => ({
      id: e.id,
      ll: [e.lat, e.lon] as [number, number],
      cor: cor('texto'),
      raio: 4,
      forma: 'losango' as const,
      titulo: `Régua ${e.nome}`,
    })),
  ];
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Panorama da crise" area="geral" pergunta="onde falta">
        <SeloDoDado dado={ev.indicadores.municipios_afetados} />
      </TituloTela>
      <Grade min={180}>
        <Kpi rotulo={`Municípios afetados · ${ev.rotulo_curto}`}>
          <Numero dado={ev.indicadores.municipios_afetados} formatar={fmt.int} />
        </Kpi>
        <Kpi rotulo="Desabrigados" destaque>
          <Numero dado={ev.indicadores.desabrigados} formatar={fmt.int} />
        </Kpi>
        <Kpi rotulo={ev.indicadores.fora_de_casa ? 'Fora de casa' : 'Desalojados'}>
          <Numero
            dado={ev.indicadores.fora_de_casa ?? ev.indicadores.desalojados}
            formatar={fmt.int}
          />
        </Kpi>
        <Kpi
          rotulo="Pessoas atendidas pela operação"
          nota={`${r.locais.filter((l) => l.pessoasN).length} abrigos/quadras`}
        >
          {fmt.int(r.kpis.pessoas)}
        </Kpi>
      </Grade>
      <Painel
        titulo="Bacia do Guaíba — Taquari, Jacuí, Caí e Sinos"
        acao={
          <span className="text-[0.65rem] text-texto-2">
            Relevo: Copernicus DEM 30 m · rios e rodovias: OSM
          </span>
        }
      >
        <MapaSVG
          pinos={pinos}
          rotuloAria="Mapa da bacia do Guaíba com municípios afetados, abrigos e quadras-base"
        />
        <p className="text-[0.7rem] text-texto-2">
          Círculos coral: desabrigados por município ({ev.rotulo_curto}). Quadrados: quadras-base;
          círculos: abrigos — cor pela urgência, tamanho pelas pessoas atendidas. Losangos: réguas
          da ANA.
        </p>
      </Painel>
      <Grade>
        <Painel titulo="Nível dos rios (simule a cheia)">
          {DADOS.rios.estacoes.map((e) => (
            <SliderNivel key={e.id} estacao={e.id} />
          ))}
          <p className="text-[0.7rem] text-texto-2">
            Ao passar da cota de inundação, o nível de alerta da operação sobe para ALERTA em todas
            as telas.
          </p>
        </Painel>
        <Painel titulo="Telemetria recente (ANA)">
          {DADOS.rios.estacoes.map((e) => (
            <GraficoNivel key={e.id} estacao={e.id} />
          ))}
        </Painel>
      </Grade>
      <Painel titulo="Municípios no evento de referência">
        <table className="w-full text-left text-xs">
          <thead className="text-texto-2">
            <tr>
              <th className="py-1">Município</th>
              <th>Desabrigados</th>
              <th>Desalojados</th>
              <th>População (Censo 2022)</th>
            </tr>
          </thead>
          <tbody>
            {ev.municipios.map((m) => (
              <tr key={m.ibge} className="border-t border-linha-fraca">
                <td className="py-1">{nomeMunicipio(m.ibge)}</td>
                <td>
                  {m.desabrigados ? <Numero dado={m.desabrigados} formatar={fmt.int} /> : '—'}
                </td>
                <td>{m.desalojados ? <Numero dado={m.desalojados} formatar={fmt.int} /> : '—'}</td>
                <td>
                  {municipioPorIbge.get(m.ibge) ? (
                    <Numero dado={municipioPorIbge.get(m.ibge)!.populacao} formatar={fmt.int} />
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Painel>
    </div>
  );
}
