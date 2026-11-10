import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DADOS } from '../../data/carregar';
import { Grade, Painel, TituloTela } from '../../ui/blocos';
import { Numero, SeloDoDado } from '../../ui/Numero';
import { fmt } from '../../ui/formato';
import { corSerie } from '../../ui/cores';
import { formatarDataCurta } from '../../engine/camadas';
import type { Dado } from '../../engine/tipos';
import { useOperacao } from '../../store';
import { cor } from '../../ui/cores';

const n = (d?: Dado) => (d && typeof d.valor === 'number' ? d.valor : null);
const COR_EVENTO: Record<string, string> = {
  '2024-05': corSerie(0),
  '2025-06': corSerie(2),
  '2026-07': corSerie(1),
  '2026-09': corSerie(3),
};
const tip = {
  contentStyle: {
    background: cor('fundo-0'),
    border: '1px solid var(--color-linha-forte)',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: cor('cinza-2') },
};

function BarrasIndicador({
  chave,
  titulo,
}: {
  chave: 'municipios_afetados' | 'desabrigados' | 'desalojados';
  titulo: string;
}) {
  const dados = DADOS.eventos.eventos.map((e) => ({
    id: e.id,
    rotulo: e.rotulo_curto,
    v: n(e.indicadores[chave]),
    dado: e.indicadores[chave],
  }));
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-xs font-semibold">{titulo}</figcaption>
      <div className="h-36">
        <ResponsiveContainer>
          <BarChart data={dados} margin={{ top: 18, right: 4, left: 4, bottom: 0 }}>
            <XAxis
              dataKey="rotulo"
              tick={{ fill: cor('texto-2'), fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: cor('linha-forte') }}
            />
            <YAxis hide scale="sqrt" domain={[0, 'dataMax']} />
            <Tooltip
              {...tip}
              formatter={(v, _n, item) => [
                v === null ? 'A CONFIRMAR' : fmt.int(Number(v)),
                (item.payload as { dado: Dado }).dado.fonte,
              ]}
              cursor={{ fill: cor('superficie') }}
            />
            <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {dados.map((d) => (
                <Cell key={d.id} fill={COR_EVENTO[d.id]} />
              ))}
              <LabelList
                dataKey="v"
                position="top"
                formatter={(v: unknown) =>
                  v === null || v === undefined ? 'A CONFIRMAR' : fmt.int(Number(v))
                }
                fill={cor('texto')}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[0.62rem] text-texto-2">
        Escala raiz quadrada: 2024 é muito maior que os eventos seguintes.
      </p>
    </figure>
  );
}

function PicosTaquari() {
  const est = DADOS.rios.estacoes.find((e) => e.id === 'taquari-lajeado')!;
  const cota = n(est.cota_inundacao)!;
  const dados = DADOS.eventos.eventos.flatMap((e) =>
    e.picos
      .filter((p) => p.estacao === 'taquari-lajeado')
      .map((p) => ({
        evento: e.id,
        rotulo: formatarDataCurta(p.nivel.data_referencia),
        v: n(p.nivel),
        fonte: p.nivel.fonte,
      })),
  );
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-xs font-semibold">
        Picos do Taquari em Lajeado/Estrela acima da cota de inundação (19 m)
      </figcaption>
      <div className="h-52">
        <ResponsiveContainer>
          <BarChart data={dados} margin={{ top: 18, right: 4, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="rotulo"
              tick={{ fill: cor('texto-2'), fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: cor('linha-forte') }}
              interval={0}
            />
            <YAxis
              tick={{ fill: cor('texto-2'), fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 36]}
              width={34}
            />
            <Tooltip
              {...tip}
              formatter={(v, _n, item) => [
                `${fmt.dec2(Number(v))} m`,
                (item.payload as { fonte: string }).fonte,
              ]}
              cursor={{ fill: cor('superficie') }}
            />
            <ReferenceLine
              y={cota}
              stroke={cor('texto')}
              strokeDasharray="4 3"
              label={{
                value: 'cota 19 m',
                fill: cor('texto'),
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
            <Bar dataKey="v" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {dados.map((d, i) => (
                <Cell key={i} fill={COR_EVENTO[d.evento]} />
              ))}
              <LabelList
                dataKey="v"
                position="top"
                formatter={(v: unknown) => `${fmt.dec1(Number(v))}`}
                fill={cor('texto')}
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function Painel2DLinhaDoTempo() {
  const eventos = DADOS.eventos.eventos;
  const selecionado = useOperacao((s) => s.eventoTimeline);
  const selecionar = useOperacao((s) => s.setEventoTimeline);
  const com3d = useOperacao((s) => s.qualidade) !== '2d';
  const cotas = Object.fromEntries(DADOS.rios.estacoes.map((e) => [e.id, n(e.cota_inundacao)!]));
  const nPicos = eventos
    .flatMap((e) => e.picos)
    .filter((p) => (n(p.nivel) ?? 0) >= cotas[p.estacao]!).length;
  return (
    <div className="flex flex-col gap-4">
      <TituloTela
        titulo="Não foi um evento isolado"
        area="geral"
        pergunta="linha do tempo das cheias"
      />
      <p className="max-w-3xl text-sm text-texto-2">
        Desde maio de 2024, a telemetria da ANA registrou{' '}
        <strong className="text-texto">{nPicos} picos de rio acima da cota de inundação</strong> nas
        réguas do Guaíba (Cais Mauá) e do Taquari (Estrela/Lajeado). A crise mudou de lugar — da
        Região Metropolitana para o Vale do Taquari — mas não acabou.
      </p>
      {com3d && (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Evento mostrado nas colunas 3D"
        >
          <span className="text-xs text-texto-2">Colunas 3D:</span>
          {eventos.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => selecionar(e.id)}
              aria-pressed={selecionado === e.id}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${selecionado === e.id ? 'bg-claro text-fundo-0 ring-texto' : 'text-texto ring-linha-forte hover:bg-superficie'}`}
            >
              <span
                aria-hidden
                className="mr-1 inline-block h-2 w-2 rounded-full"
                style={{ background: COR_EVENTO[e.id] }}
              />
              {e.rotulo_curto}
            </button>
          ))}
          <span className="text-[0.66rem] text-texto-2">
            altura = desabrigados (√) e pico acima da cota
          </span>
        </div>
      )}
      <ol
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(230px,100%), 1fr))' }}
      >
        {eventos.map((e) => (
          <li
            key={e.id}
            className={`painel relative flex flex-col gap-2 p-4 ${selecionado === e.id ? 'ring-2 ring-texto' : ''}`}
            style={{ borderTop: `4px solid ${COR_EVENTO[e.id]}` }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <button
                type="button"
                onClick={() => selecionar(e.id)}
                aria-pressed={selecionado === e.id}
                className="font-display text-left text-xl underline decoration-dotted underline-offset-4 hover:text-texto-2"
                title={com3d ? 'Mostrar este evento nas colunas 3D' : 'Selecionar evento'}
              >
                {e.rotulo_curto}
              </button>
              <SeloDoDado dado={e.indicadores.municipios_afetados} />
            </div>
            <p className="text-[0.72rem] leading-snug text-texto-2">{e.resumo}</p>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
              <dt className="opacity-70">Municípios</dt>
              <dd>
                <Numero dado={e.indicadores.municipios_afetados} formatar={fmt.int} />
              </dd>
              <dt className="opacity-70">Desabrigados</dt>
              <dd>
                <Numero dado={e.indicadores.desabrigados} formatar={fmt.int} />
              </dd>
              <dt className="opacity-70">Desalojados</dt>
              <dd>
                <Numero dado={e.indicadores.desalojados} formatar={fmt.int} />
              </dd>
              <dt className="opacity-70">Rios acima da cota</dt>
              <dd>
                {e.picos.filter((p) => (n(p.nivel) ?? 0) >= cotas[p.estacao]!).length} de{' '}
                {e.picos.length} picos
              </dd>
            </dl>
            {e.licoes?.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="text-[0.68rem] leading-snug text-texto-2 underline"
              >
                Lição: {l.texto}
              </a>
            ))}
          </li>
        ))}
      </ol>
      <Grade min={260}>
        <Painel titulo="Municípios afetados">
          <BarrasIndicador chave="municipios_afetados" titulo="por evento" />
        </Painel>
        <Painel titulo="Desabrigados">
          <BarrasIndicador chave="desabrigados" titulo="pico de pessoas em abrigos" />
        </Painel>
        <Painel titulo="Desalojados">
          <BarrasIndicador chave="desalojados" titulo="pico de pessoas fora de casa" />
        </Painel>
      </Grade>
      <Painel titulo="Rios acima da cota">
        <PicosTaquari />
        <p className="text-xs text-texto-2">
          Guaíba no Cais Mauá (cota 3,00 m):{' '}
          {eventos.flatMap((e) =>
            e.picos
              .filter((p) => p.estacao === 'guaiba-cais-maua')
              .map((p) => (
                <span key={e.id} className="mr-3 inline-flex items-baseline gap-1">
                  {e.rotulo_curto} <Numero dado={p.nivel} formatar={(v) => `${fmt.dec2(v)} m`} />
                </span>
              )),
          )}
        </p>
      </Painel>
      <Painel
        titulo="Próximos meses — a próxima cheia já tem previsão"
        className="ring-1 ring-linha-forte"
      >
        <Grade min={280}>
          {DADOS.previsao.prognosticos.map((p) => (
            <div key={p.id} className="flex flex-col gap-1.5 text-sm">
              <p className="font-semibold text-texto-2">{p.orgao}</p>
              <p className="text-xs text-texto-2">{p.resumo}</p>
              {p.indicadores.map((i) => (
                <p key={i.id} className="text-xs">
                  {i.rotulo}: <Numero dado={i.dado} className="font-display text-lg" />{' '}
                  <SeloDoDado dado={i.dado} />
                </p>
              ))}
            </div>
          ))}
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-texto-2">Avisos recentes da Defesa Civil RS</p>
            <ul className="flex flex-col gap-1">
              {DADOS.previsao.avisos_recentes.map((a) => (
                <li key={a.url}>
                  <span className="text-texto-2">{formatarDataCurta(a.data)}</span> —{' '}
                  <a href={a.url} target="_blank" rel="noreferrer" className="underline">
                    {a.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Grade>
      </Painel>
    </div>
  );
}
