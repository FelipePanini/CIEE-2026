/**
 * Panorama (rodada 2): a primeira tela conta a história em 5 segundos.
 * Frase-síntese gerada dos dados · 4 KPIs com mini gráfico e variação · medidores dos rios ·
 * top 5 municípios críticos (clique = a câmera voa até lá) · o que mudou · próximos dias.
 * Todo número continua com fonte, data e selo (passe o mouse ou toque).
 */
import type { ReactNode } from 'react';
import { DADOS, municipioPorIbge, nomeMunicipio } from '../../data/carregar';
import { useOperacao, useResultado } from '../../store';
import { eventoReferencia } from '../../engine/cenarios';
import { itemPorId } from '../../engine/urgencia';
import {
  abrigosAtivos,
  eventoAnterior,
  eventoPorId,
  folgaDosRios,
  foraDeCasa,
  fraseSintese,
  mudancas,
  municipiosCriticos,
  riosAcimaDaCota,
  seriePorEvento,
  type Trecho,
} from '../../engine/sintese';
import type { Calculado, Dado } from '../../engine/tipos';
import { Painel, TituloTela } from '../../ui/blocos';
import { Numero, SeloDoDado } from '../../ui/Numero';
import { SeloCamada } from '../../ui/SeloCamada';
import { MapaSVG } from '../../ui/MapaSVG';
import { fmt } from '../../ui/formato';
import { formatarDataCurta } from '../../engine/camadas';
import { GraficoNivel, pinosDoPanorama, SliderNivel } from './Painel2D';

type Valor = Dado<number> | Calculado;
const num = (d: { valor: unknown } | undefined | null): number | null =>
  d && typeof d.valor === 'number' ? d.valor : null;
const FORMATO: Record<NonNullable<Trecho['formato']>, (v: number) => string> = {
  int: fmt.int,
  m: (v) => `${fmt.dec1(v)} m`,
  mm: (v) => `${fmt.int(v)} mm`,
  pct: fmt.pct,
};

function FraseSintese() {
  const r = useResultado();
  const cenario = useOperacao((s) => s.entrada.cenario);
  const boletim = useOperacao((s) => s.entrada.boletim);
  const reais = useOperacao((s) => s.entrada.niveisReais);
  const trechos = fraseSintese(DADOS, r, eventoReferencia(cenario, boletim), reais);
  return (
    <p
      className="frase-sintese font-display text-[1.35rem] leading-snug text-texto"
      aria-live="polite"
    >
      {trechos.map((t, i) => (
        <span key={i} className={t.tom === 'alerta' ? 'text-alerta' : undefined}>
          {i > 0 && <span className="text-texto-3"> · </span>}
          {t.antes}
          {t.dado && <Numero dado={t.dado} formatar={FORMATO[t.formato ?? 'int']} />}
          {t.depois}
        </span>
      ))}
      .
    </p>
  );
}

/** Mini gráfico de linha (sem eixos): a forma da série, com o último ponto marcado. */
function MiniGrafico({
  pontos,
  limite,
  rotulo,
}: {
  pontos: (number | null)[];
  limite?: number;
  rotulo: string;
}) {
  const validos = pontos.filter((v): v is number => v !== null);
  if (validos.length < 2)
    return <span className="text-[0.62rem] text-texto-3">série insuficiente</span>;
  const max = Math.max(...validos, limite ?? -Infinity);
  const min = Math.min(...validos, limite ?? Infinity, 0);
  const W = 96;
  const H = 28;
  const x = (i: number) => (i / (pontos.length - 1)) * (W - 6) + 3;
  const y = (v: number) => H - 3 - ((v - min) / (max - min || 1)) * (H - 6);
  const caminho = pontos
    .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
    .filter(Boolean)
    .join(' ');
  const ultimo = pontos.findLastIndex((v) => v !== null);
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={rotulo}
      className="shrink-0"
    >
      {limite !== undefined && (
        <line
          x1="0"
          x2={W}
          y1={y(limite)}
          y2={y(limite)}
          stroke="var(--color-alerta)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.8"
        />
      )}
      <polyline
        points={caminho}
        fill="none"
        stroke="var(--color-texto-2)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(ultimo)}
        cy={y(pontos[ultimo]!)}
        r="3"
        fill="var(--color-texto)"
        stroke="var(--color-fundo-1)"
        strokeWidth="2"
      />
    </svg>
  );
}

function Variacao({ v, sufixo }: { v: number | null; sufixo: string }) {
  if (v === null)
    return <span className="text-[0.66rem] text-texto-3">sem comparação {sufixo}</span>;
  const sobe = v > 0;
  return (
    <span className="text-[0.68rem] tabular-nums text-texto-2">
      <span aria-hidden>{Math.abs(v) < 0.005 ? '■' : sobe ? '▲' : '▼'}</span>{' '}
      {Math.abs(v) < 0.005
        ? 'estável'
        : `${fmt.int(Math.abs(v) * 100)}% ${sobe ? 'a mais' : 'a menos'}`}{' '}
      {sufixo}
    </span>
  );
}

function KpiVidro({
  rotulo,
  children,
  grafico,
  rodape,
}: {
  rotulo: string;
  children: ReactNode;
  grafico?: ReactNode;
  rodape: ReactNode;
}) {
  return (
    <div className="painel kpi flex min-w-0 flex-col gap-1.5 p-3">
      <span className="text-[0.7rem] text-texto-2">{rotulo}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="font-display text-[1.7rem] leading-none text-texto">{children}</span>
        {grafico}
      </div>
      {rodape}
    </div>
  );
}

function FaixaKpis() {
  const r = useResultado();
  const cenario = useOperacao((s) => s.entrada.cenario);
  const boletim = useOperacao((s) => s.entrada.boletim);
  const id = eventoReferencia(cenario, boletim);
  const ev = eventoPorId(DADOS, id);
  const ant = eventoAnterior(DADOS, id);
  const varia = (a: Valor | null | undefined, b: Valor | null | undefined) => {
    const va = num(a);
    const vb = num(b);
    return va && vb !== null ? (vb - va) / va : null;
  };
  const sufixo = ant ? `que ${ant.rotulo_curto}` : '';
  const fora = ev ? foraDeCasa(ev) : null;
  const rios = riosAcimaDaCota(DADOS, r);
  const folgas = folgaDosRios(DADOS, r).sort((a, b) => a.folga.valor - b.folga.valor);
  const pior = folgas[0];
  const serieRio = pior
    ? (
        DADOS.seriesRios.series.find((s) => s.estacao === pior.estacao && s.camada === 'ATUAL')
          ?.pontos ?? []
      ).map((p) => p[1])
    : [];
  const semana = serieRio.length > 8 ? serieRio.at(-1)! - serieRio.at(-8)! : null;
  const ativos = abrigosAtivos(r);
  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiVidro
        rotulo={ev ? `Municípios afetados · ${ev.rotulo_curto}` : 'Municípios afetados'}
        grafico={
          <MiniGrafico
            rotulo="Municípios afetados por evento, de 2024 a 2026"
            pontos={seriePorEvento(DADOS, (e) => num(e.indicadores.municipios_afetados)).map(
              (p) => p.v,
            )}
          />
        }
        rodape={
          ev ? (
            <Variacao
              v={varia(ant?.indicadores.municipios_afetados, ev.indicadores.municipios_afetados)}
              sufixo={sufixo}
            />
          ) : (
            <span className="text-[0.66rem] text-texto-3">sem cheia ativa neste cenário</span>
          )
        }
      >
        {ev ? <Numero dado={ev.indicadores.municipios_afetados} formatar={fmt.int} /> : '—'}
      </KpiVidro>
      <KpiVidro
        rotulo="Pessoas fora de casa"
        grafico={
          <MiniGrafico
            rotulo="Pessoas fora de casa por evento"
            pontos={seriePorEvento(DADOS, (e) => num(foraDeCasa(e))).map((p) => p.v)}
          />
        }
        rodape={
          ev ? (
            <Variacao v={varia(ant ? foraDeCasa(ant) : null, fora)} sufixo={sufixo} />
          ) : (
            <span className="text-[0.66rem] text-texto-3">sem cheia ativa neste cenário</span>
          )
        }
      >
        {fora ? <Numero dado={fora} formatar={fmt.int} /> : ev ? 'A CONFIRMAR' : '—'}
      </KpiVidro>
      <KpiVidro
        rotulo="Abrigos ativos na operação"
        rodape={
          <span className="text-[0.68rem] text-texto-2">
            {fmt.int(r.kpis.pessoas)} pessoas atendidas · {r.kpis.critico} com item crítico
          </span>
        }
      >
        <Numero dado={ativos} formatar={fmt.int} />
      </KpiVidro>
      <KpiVidro
        rotulo="Rios acima da cota"
        grafico={
          pior && (
            <MiniGrafico
              rotulo={`Nível do ${pior.rio} nos últimos dias, com a cota de inundação`}
              pontos={serieRio.slice(-45)}
              limite={pior.cota}
            />
          )
        }
        rodape={
          pior && semana !== null ? (
            <span className="text-[0.68rem] tabular-nums text-texto-2">
              {pior.rio}:{' '}
              <span aria-hidden>{semana > 0.02 ? '▲' : semana < -0.02 ? '▼' : '■'}</span>{' '}
              {fmt.dec2(Math.abs(semana))} m em 7 dias
            </span>
          ) : null
        }
      >
        <span className={rios.valor > 0 ? 'text-alerta' : undefined}>
          <Numero dado={rios} formatar={(v) => `${v} de ${folgas.length}`} />
        </span>
      </KpiVidro>
    </div>
  );
}

/** Medidor vertical de uma estação: cota de alerta, cota de inundação, pico de 2024 e nível atual. */
function Medidor({ estacao }: { estacao: string }) {
  const r = useResultado();
  const est = DADOS.rios.estacoes.find((e) => e.id === estacao)!;
  const reais = useOperacao((s) => s.entrada.niveisReais);
  const real = reais?.[estacao] ?? est.nivel_atual;
  const nivel = r.niveis[estacao] ?? 0;
  const cota = num(est.cota_inundacao) ?? 0;
  const alerta = num(est.cota_alerta);
  const pico = DADOS.eventos.eventos
    .find((e) => e.id === '2024-05')!
    .picos.find((p) => p.estacao === estacao)?.nivel;
  const max = Math.max(num(pico) ?? 0, cota, nivel) * 1.08;
  const H = 150;
  const y = (v: number) => H - (Math.min(v, max) / max) * H;
  const acima = nivel >= cota;
  const marcas: { v: number; t: string; forte?: boolean }[] = [
    ...(num(pico) !== null ? [{ v: num(pico)!, t: 'pico 2024' }] : []),
    { v: cota, t: 'inundação', forte: true },
    ...(alerta !== null ? [{ v: alerta, t: 'alerta' }] : []),
  ];
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-semibold">{est.rio}</span>
        <span className={`font-display text-lg tabular-nums ${acima ? 'text-alerta' : ''}`}>
          {fmt.dec2(nivel)} m
        </span>
      </figcaption>
      <div className="flex gap-3">
        <svg
          width="74"
          height={H + 8}
          viewBox={`0 -4 74 ${H + 8}`}
          role="img"
          aria-label={`Medidor do ${est.rio}: ${fmt.dec2(nivel)} m; cota de inundação ${fmt.dec1(cota)} m`}
          className="shrink-0"
        >
          <rect x="0" y="0" width="22" height={H} rx="11" fill="var(--color-superficie-2)" />
          <clipPath id={`clip-${estacao}`}>
            <rect x="0" y="0" width="22" height={H} rx="11" />
          </clipPath>
          <rect
            x="0"
            y={y(nivel)}
            width="22"
            height={H - y(nivel)}
            fill={acima ? 'var(--color-alerta)' : 'var(--color-agua)'}
            clipPath={`url(#clip-${estacao})`}
          />
          {marcas.map((m) => (
            <g key={m.t}>
              <line
                x1="0"
                x2="30"
                y1={y(m.v)}
                y2={y(m.v)}
                stroke={m.forte ? 'var(--color-alerta)' : 'var(--color-texto-2)'}
                strokeWidth={m.forte ? 2 : 1}
                strokeDasharray={m.forte ? undefined : '3 2'}
              />
              <text
                x="33"
                y={y(m.v) + 3}
                fontSize="9"
                fill={m.forte ? 'var(--color-alerta)' : 'var(--color-texto-2)'}
              >
                {m.t}
              </text>
            </g>
          ))}
        </svg>
        <dl className="grid flex-1 grid-cols-[auto_1fr] content-start gap-x-2 gap-y-0.5 text-[0.7rem]">
          <dt className="text-texto-2">Agora (ANA)</dt>
          <dd>
            <Numero dado={real} formatar={(v) => `${fmt.dec2(v)} m`} />
          </dd>
          <dt className="text-texto-2">Inundação</dt>
          <dd>
            <Numero dado={est.cota_inundacao} formatar={(v) => `${fmt.dec1(v)} m`} />
          </dd>
          <dt className="text-texto-2">Alerta</dt>
          <dd>
            {est.cota_alerta ? (
              <Numero dado={est.cota_alerta} formatar={(v) => `${fmt.dec1(v)} m`} />
            ) : (
              'A CONFIRMAR'
            )}
          </dd>
          {pico && (
            <>
              <dt className="text-texto-2">Pico 2024</dt>
              <dd>
                <Numero dado={pico} formatar={(v) => `${fmt.dec2(v)} m`} />
              </dd>
            </>
          )}
        </dl>
      </div>
      <SeloDoDado dado={real} />
    </figure>
  );
}

function TopCriticos() {
  const r = useResultado();
  const focar = useOperacao((s) => s.focarCamera);
  const com3d = useOperacao((s) => s.qualidade) !== '2d';
  const top = municipiosCriticos(r);
  if (!top.length)
    return <p className="text-xs text-texto-2">Nenhum abrigo com pessoas neste cenário.</p>;
  return (
    <ol className="flex flex-col gap-1">
      {top.map((m, i) => (
        <li key={m.ibge}>
          <button
            type="button"
            onClick={() => focar(m.lat, m.lon, 38)}
            disabled={!com3d}
            title={com3d ? 'Voar até o município no mapa 3D' : undefined}
            className="grid w-full grid-cols-[1.2rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-superficie disabled:cursor-default"
          >
            <span className="font-display text-texto-3">{i + 1}</span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-texto">{nomeMunicipio(m.ibge)}</strong>
              <span className="text-texto-2">
                {fmt.int(m.pessoas)} pessoas em {m.locais} {m.locais === 1 ? 'local' : 'locais'} ·
                falta primeiro: {itemPorId(m.item as never).nome.toLowerCase()}
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[0.68rem] font-semibold ${m.urgencia >= 0.5 ? 'text-alerta' : m.urgencia >= 0.25 ? 'text-atencao' : 'text-ok'}`}
            >
              <i aria-hidden className="h-2 w-2 rounded-full bg-current" />
              {m.urgencia >= 0.5 ? 'crítico' : m.urgencia >= 0.25 ? 'atenção' : 'coberto'}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function MudouDesdeBoletim() {
  const cenario = useOperacao((s) => s.entrada.cenario);
  const boletim = useOperacao((s) => s.entrada.boletim);
  const m = mudancas(DADOS, eventoReferencia(cenario, boletim));
  if (!m)
    return (
      <p className="text-xs text-texto-2">
        {cenario === 'prontidao'
          ? 'Sem cheia ativa: não há boletim para comparar.'
          : 'Primeiro evento da série: não há boletim anterior para comparar.'}
      </p>
    );
  const f = (rotulo: string) => (/Pico/.test(rotulo) ? (v: number) => `${fmt.dec2(v)} m` : fmt.int);
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {m.itens.map((i) => (
        <li
          key={i.rotulo}
          className="grid grid-cols-[1fr_auto] items-baseline gap-2 border-t border-linha-fraca pt-1 first:border-0 first:pt-0"
        >
          <span className="text-texto-2">{i.rotulo}</span>
          <span className="tabular-nums">
            {i.de ? <Numero dado={i.de} formatar={f(i.rotulo)} /> : '—'}{' '}
            <span className="text-texto-3">→</span>{' '}
            {i.para ? <Numero dado={i.para} formatar={f(i.rotulo)} /> : '—'}
            {i.variacao !== null && (
              <span className="ml-1.5 text-texto-2">
                {i.variacao > 0 ? '▲' : '▼'} {fmt.int(Math.abs(i.variacao) * 100)}%
              </span>
            )}
          </span>
        </li>
      ))}
      <li className="text-[0.66rem] text-texto-3">
        {m.de} → {m.para}. "A CONFIRMAR" = o boletim ainda não foi conferido na fonte oficial.
      </li>
    </ul>
  );
}

function ProximosDias() {
  const p = DADOS.previsao.prognosticos[0]!;
  const aviso = DADOS.previsao.avisos_recentes[0];
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      <p>
        <SeloCamada camada="PREVISAO" />{' '}
        {p.indicadores.map((i, k) => (
          <span key={i.id}>
            {k > 0 && ' · '}
            {i.rotulo.toLowerCase()}: <Numero dado={i.dado} className="font-semibold" />
          </span>
        ))}{' '}
        <span className="text-texto-2">({p.orgao})</span>
      </p>
      {aviso && (
        <p className="text-texto-2">
          Último aviso da Defesa Civil RS ({formatarDataCurta(aviso.data)}):{' '}
          <a href={aviso.url} target="_blank" rel="noreferrer" className="underline">
            {aviso.titulo}
          </a>
        </p>
      )}
    </div>
  );
}

export function PanoramaV2() {
  const r = useResultado();
  const cenario = useOperacao((s) => s.entrada.cenario);
  const boletim = useOperacao((s) => s.entrada.boletim);
  const ev = eventoPorId(DADOS, eventoReferencia(cenario, boletim));
  const com3d = useOperacao((s) => s.qualidade) !== '2d';
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Visão geral" area="geral" pergunta="onde falta">
        {ev && <SeloDoDado dado={ev.indicadores.municipios_afetados} />}
      </TituloTela>
      <FraseSintese />
      <FaixaKpis />
      <Painel titulo="Rios agora">
        <div className="flex flex-wrap gap-5">
          {DADOS.rios.estacoes.map((e) => (
            <Medidor key={e.id} estacao={e.id} />
          ))}
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-texto-2 hover:text-texto">
            Simular a cheia (mover o nível dos rios)
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {DADOS.rios.estacoes.map((e) => (
              <SliderNivel key={e.id} estacao={e.id} />
            ))}
            <p className="text-[0.7rem] text-texto-2">
              Ao passar da cota de inundação, o nível de alerta da operação sobe em todas as telas.
            </p>
          </div>
        </details>
      </Painel>
      <Painel titulo="Top 5 municípios críticos">
        <TopCriticos />
      </Painel>
      <Painel titulo="O que mudou desde o último boletim">
        <MudouDesdeBoletim />
      </Painel>
      <Painel titulo="Próximos dias">
        <ProximosDias />
      </Painel>
      {!com3d && (
        <Painel titulo="Bacia do Guaíba — Taquari, Jacuí, Caí e Sinos">
          <MapaSVG
            pinos={pinosDoPanorama(r, ev)}
            rotuloAria="Mapa da bacia do Guaíba com municípios afetados, abrigos e quadras-base"
          />
        </Painel>
      )}
      <Painel titulo="Telemetria recente (ANA)">
        {DADOS.rios.estacoes.map((e) => (
          <GraficoNivel key={e.id} estacao={e.id} />
        ))}
      </Painel>
      {ev && (
        <Painel titulo={`Municípios em ${ev.rotulo_curto}`}>
          <table className="w-full text-left text-xs">
            <thead className="text-texto-2">
              <tr>
                <th className="py-1">Município</th>
                <th>Desabrigados</th>
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
      )}
    </div>
  );
}
