import { useEffect, useState } from 'react';
import { DADOS } from '../../data/carregar';
import { useOperacao, useResultado } from '../../store';
import { Botao, Grade, Kpi, Painel, TituloTela } from '../../ui/blocos';
import { MapaSVG, type LinhaMapa, type PinoMapa } from '../../ui/MapaSVG';
import { Numero } from '../../ui/Numero';
import { fmt } from '../../ui/formato';
import { corUrgencia } from '../../ui/cores';
import { eventoReferencia } from '../../engine/cenarios';
import { cor } from '../../ui/cores';

type Geo = Record<string, [number, number][]>;
let cache: Promise<Geo> | null = null;
export function useGeometriaRotas() {
  const [g, setG] = useState<Geo | null>(null);
  useEffect(() => {
    cache ??= fetch('/geo/rotas.json').then((r) => r.json() as Promise<Geo>);
    let vivo = true;
    cache.then((x) => vivo && setG(x)).catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return g;
}

const nomeNo = (id: string) => DADOS.redeViaria.nos.find((n) => n.id === id)?.nome ?? id;
const curto = (s: string) =>
  s.replace(
    /^(Ponto de coleta — |EMEF |EEEF |Instituto Estadual de Educação |Colégio Estadual |Abrigo( na)? )/,
    '',
  );

export function Painel2DRotas() {
  const r = useResultado();
  const geo = useGeometriaRotas();
  const alternar = useOperacao((s) => s.alternarBloqueio);
  const entrada = useOperacao((s) => s.entrada);
  const setImportar = useOperacao((s) => s.setImportarBloqueios);
  const ref = eventoReferencia(entrada.cenario, entrada.boletim);
  const reais = DADOS.redeViaria.bloqueios_reais.filter((b) => b.evento === ref);
  const bloq = new Set(r.arestasBloqueadas);
  const emRota = new Set(
    r.rotas.flatMap((ro) => ro.trechos.flatMap((t) => t.arestas.map((a) => a.id))),
  );
  const linhas: LinhaMapa[] = geo
    ? DADOS.redeViaria.arestas
        .filter((a) => geo[a.id])
        .map((a) => ({
          id: a.id,
          pts: geo[a.id]!,
          cor: bloq.has(a.id) ? cor('alerta') : emRota.has(a.id) ? cor('texto') : cor('cinza-3'),
          largura: bloq.has(a.id) ? 5 : emRota.has(a.id) ? 4.5 : 2.5,
          tracejado: bloq.has(a.id) || a.via === 'vias urbanas',
          titulo: `${a.via}: ${nomeNo(a.de)} → ${nomeNo(a.para)} · ${fmt.dec1(a.km.valor as number)} km${bloq.has(a.id) ? ' · BLOQUEADA' : ''} (clique para ${bloq.has(a.id) ? 'liberar' : 'bloquear'})`,
          onClick: () => alternar(a.id),
        }))
    : [];
  const locais = new Map(r.locais.map((l) => [l.id, l]));
  const pinos: PinoMapa[] = DADOS.redeViaria.nos.map((n) => {
    const l = locais.get(n.id);
    const pt = r.pontos.find((p) => p.id === n.id);
    return {
      id: n.id,
      ll: [n.lat, n.lon],
      cor:
        n.tipo === 'entroncamento'
          ? cor('texto')
          : n.tipo === 'coleta'
            ? pt?.lotado
              ? cor('alerta')
              : cor('cinza-3')
            : l
              ? l.pessoasN
                ? corUrgencia(l.urgenciaMax, true)
                : cor('cinza-2')
              : cor('pedra-3'),
      raio: n.tipo === 'entroncamento' ? 3 : 6,
      forma: n.tipo === 'quadra' ? 'quadrado' : n.tipo === 'coleta' ? 'losango' : 'circulo',
      rotulo: n.tipo === 'entroncamento' ? undefined : curto(n.nome),
      titulo: n.nome,
      pulsar: !!l?.semRota,
    };
  });
  const kmTotal = r.rotas.reduce((s, x) => s + x.km.valor, 0);
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Rotas de coleta e entrega" area="logistica" pergunta="como chega">
        {ref && reais.length > 0 && (
          <Botao
            tipo={entrada.importarBloqueiosReais ? 'perigo' : 'secundario'}
            onClick={() => setImportar(!entrada.importarBloqueiosReais)}
          >
            {entrada.importarBloqueiosReais
              ? '✓ Bloqueios reais importados'
              : `Importar bloqueios reais (${reais.length})`}
          </Botao>
        )}
      </TituloTela>
      <Grade min={170}>
        <Kpi rotulo="Rotas ativas">{r.rotas.length}</Kpi>
        <Kpi rotulo="Distância total">{fmt.int(kmTotal)} km</Kpi>
        <Kpi rotulo="Trechos bloqueados" destaque={bloq.size > 0}>
          {bloq.size}
        </Kpi>
        <Kpi rotulo="Abrigos sem rota" destaque={r.locais.some((l) => l.semRota)}>
          {r.locais.filter((l) => l.semRota).length}
        </Kpi>
      </Grade>
      <Painel
        titulo="Rede viária da operação"
        acao={
          <span className="text-[0.65rem] text-texto-2">
            Clique num trecho para bloquear/liberar · rotas recalculam (Dijkstra + 2-opt)
          </span>
        }
      >
        <MapaSVG
          pinos={pinos}
          linhas={linhas}
          mostrarRodovias={false}
          recorte={[-30.2, -52.15, -29.15, -50.95]}
          rotuloAria="Grafo de rotas com pontos de coleta, quadras-base, abrigos e entroncamentos"
        />
        <p className="text-[0.7rem] text-texto-2">
          Cinza: trecho livre · branco: em uso por uma rota · vermelho tracejado: bloqueado.
          Losangos: pontos de coleta; quadrados: quadras-base; círculos: abrigos.
        </p>
      </Painel>
      {ref && reais.length > 0 && (
        <Painel titulo={`Bloqueios reais do evento de referência (${ref})`}>
          <ul className="flex flex-col gap-1.5 text-xs">
            {reais.map((b) => (
              <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <strong>{b.descricao}</strong>{' '}
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-texto-2 underline"
                  >
                    {b.fonte}
                  </a>
                </span>
                <span className={bloq.has(b.aresta) ? 'text-alerta' : 'text-texto-2'}>
                  {bloq.has(b.aresta) ? 'aplicado' : 'não aplicado'}
                </span>
              </li>
            ))}
          </ul>
        </Painel>
      )}
      <Grade min={320}>
        {r.rotas.map((ro) => (
          <Painel
            key={ro.base}
            titulo={`Base: ${curto(nomeNo(ro.base))}`}
            acao={
              <span className={`text-xs ${ro.cabeNaJanela ? 'text-ok' : 'text-atencao'}`}>
                {ro.cabeNaJanela ? 'cabe na janela' : 'excede a janela'}
              </span>
            }
          >
            <p className="text-xs text-texto-2">
              {ro.veiculo ? (
                <>
                  {ro.veiculo.categoria.toUpperCase()} · {fmt.int(ro.veiculo.capacidadeKg)} kg ·
                  janela {ro.veiculo.janela.join('–')} · {ro.veiculo.parceiro} · {ro.viagens}{' '}
                  viagem(ns)
                </>
              ) : (
                <span className="text-alerta">Sem veículo disponível</span>
              )}
            </p>
            <ol className="flex flex-col gap-1 text-xs">
              {ro.paradas.map((p, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>
                    {i}.{' '}
                    {p.tipo === 'coleta'
                      ? '📦 coleta'
                      : p.tipo === 'entrega'
                        ? '🏠 entrega'
                        : '🏫 base'}{' '}
                    — {curto(nomeNo(p.no))}
                  </span>
                  <span className="tabular-nums text-texto-2">+{fmt.dec1(p.chegadaH)} h</span>
                </li>
              ))}
            </ol>
            {ro.inalcancaveis.length > 0 && (
              <p className="text-xs text-alerta">
                Sem caminho: {ro.inalcancaveis.map((x) => curto(nomeNo(x))).join(', ')}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-xs">
              <span>
                <Numero dado={ro.km} formatar={(v) => `${fmt.dec1(v)} km`} />
              </span>
              <span>{fmt.dec1(ro.horas)} h</span>
              <span>
                Frete (piso ANTT): <Numero dado={ro.frete} formatar={fmt.brl} />
              </span>
            </div>
          </Painel>
        ))}
        {r.rotas.length === 0 && <Painel>Nenhuma rota necessária neste momento.</Painel>}
      </Grade>
      <Painel titulo="Veículos e capacidades (categorias reais)">
        <table className="w-full text-left text-xs">
          <thead className="text-texto-2">
            <tr>
              <th className="py-1">Categoria</th>
              <th>Eixos</th>
              <th>Capacidade de carga</th>
              <th>Piso ANTT (carga geral)</th>
            </tr>
          </thead>
          <tbody>
            {DADOS.veiculos.categorias.map((c) => {
              const piso = DADOS.frete.pisos.find((p) => p.eixos === c.eixos)!;
              return (
                <tr key={c.id} className="border-t border-linha-fraca">
                  <td className="py-1">{c.nome}</td>
                  <td>{c.eixos}</td>
                  <td>
                    <Numero dado={c.capacidade_kg} formatar={(v) => `${fmt.int(v)} kg`} selo />
                  </td>
                  <td>
                    <Numero dado={piso.ccd} formatar={(v) => `${fmt.brl(v)}/km`} /> +{' '}
                    <Numero dado={piso.cc} formatar={fmt.brl} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Painel>
    </div>
  );
}
