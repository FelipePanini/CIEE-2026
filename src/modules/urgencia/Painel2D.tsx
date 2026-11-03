import { useState } from 'react';
import { DADOS, nomeMunicipio } from '../../data/carregar';
import { useOperacao, useResultado } from '../../store';
import { Botao, Grade, Kpi, Painel, TituloTela } from '../../ui/blocos';
import { Numero } from '../../ui/Numero';
import { Termometro } from '../../ui/Termometro';
import { SeloCamada } from '../../ui/SeloCamada';
import { fmt } from '../../ui/formato';
import { ITENS, itemPorId, type IdItem } from '../../engine/urgencia';

/** Frase humana do kit: "1 kit = 1 família de 4 pessoas por 3 dias". */
export function FraseKit() {
  const p = useOperacao((s) => s.entrada.parametros);
  return (
    <span>
      1 kit = 1 família de {p.familia_ref} pessoas por {p.dias_kit} dias{' '}
      <span className="text-creme-200/70">
        (média no RS:{' '}
        <Numero
          dado={DADOS.municipios.media_moradores_domicilio_rs}
          formatar={(v) => fmt.dec2(v)}
        />{' '}
        pessoas por domicílio)
      </span>
    </span>
  );
}

export function Painel2DUrgencia() {
  const r = useResultado();
  const [filtro, setFiltro] = useState<IdItem | 'todos'>('todos');
  const sel = useOperacao((s) => s.abrigoSelecionado);
  const setSel = useOperacao((s) => s.setAbrigoSelecionado);
  const locais = r.locais
    .filter((l) => l.pessoasN > 0)
    .sort((a, b) => b.urgenciaMax - a.urgenciaMax);
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Urgência por item e por abrigo" area="comercio" pergunta="o que falta">
        <div role="radiogroup" aria-label="Filtrar item" className="flex flex-wrap gap-1 text-xs">
          {(['todos', ...ITENS.map((i) => i.id)] as const).map((id) => (
            <button
              key={id}
              role="radio"
              aria-checked={filtro === id}
              onClick={() => setFiltro(id)}
              className={`rounded-full px-2.5 py-1 ${filtro === id ? 'bg-creme-100 text-navy-900' : 'bg-navy-800 text-creme-200'}`}
            >
              {id === 'todos' ? 'Todos' : itemPorId(id).nome}
            </button>
          ))}
        </div>
      </TituloTela>
      <p className="text-sm text-creme-200">
        Vermelho = a cobertura na chegada da próxima reposição fica abaixo do prazo crítico.{' '}
        <FraseKit />.
      </p>
      <Grade min={300}>
        {locais.map((l) => (
          <article
            key={l.id}
            className={`painel flex cursor-pointer flex-col gap-2 p-3 ${sel === l.id ? 'ring-2 ring-piscina-300' : ''}`}
            onClick={() => setSel(l.id)}
            title="Mostrar este abrigo na prateleira 3D"
          >
            <header className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold leading-tight">{l.nome}</h3>
                <p className="text-[0.7rem] text-creme-200">
                  {nomeMunicipio(l.municipio)} · <Numero dado={l.pessoas} formatar={fmt.int} />{' '}
                  pessoas ·{' '}
                  {l.semRota ? (
                    <span className="text-coral-500">sem rota</span>
                  ) : l.eta ? (
                    <>
                      reposição em <Numero dado={l.eta} formatar={(v) => `${fmt.dec1(v * 24)} h`} />
                    </>
                  ) : null}
                </p>
                <p className="text-[0.65rem] text-piscina-300">
                  Voluntário(a) de referência: {l.voluntarioReferencia}
                </p>
              </div>
              <span
                className="font-display text-xl"
                title="Kits para cobrir o prazo crítico de todos os itens"
              >
                {fmt.int(l.kitsNecessarios)}
                <span className="block text-[0.6rem] font-normal text-creme-200">kits</span>
              </span>
            </header>
            {l.acimaCapacidade && (
              <p className="rounded bg-coral-500/15 px-2 py-1 text-[0.7rem] text-coral-400">
                Acima da capacidade Esfera: <Numero dado={l.capacidade} formatar={fmt.int} /> vagas.
              </p>
            )}
            {l.urgencias
              .filter((u) => filtro === 'todos' || u.item === filtro)
              .map((u) => (
                <Termometro key={u.item} u={u} />
              ))}
          </article>
        ))}
      </Grade>
      <FormularioCoordenador />
    </div>
  );
}

export function Painel2DArrecadacao() {
  const r = useResultado();
  const registrar = useOperacao((s) => s.registrarVolume);
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Arrecadação nos pontos de coleta" area="comercio" pergunta="onde falta">
        <span className="text-xs text-creme-200">
          Metas derivadas do Índice de Urgência dos abrigos que cada ponto abastece
        </span>
      </TituloTela>
      <Grade min={180}>
        <Kpi rotulo="Pontos de coleta ativos">{r.pontos.length}</Kpi>
        <Kpi rotulo="Pontos lotados" destaque={r.pontos.some((p) => p.lotado)}>
          {r.pontos.filter((p) => p.lotado).length}
        </Kpi>
        <Kpi rotulo="Kits a montar">{fmt.int(r.custos.kitsTotal)}</Kpi>
      </Grade>
      <Grade min={300}>
        {r.pontos.map((p) => {
          const pct = Math.min(1.2, p.ocupacao.valor);
          return (
            <article
              key={p.id}
              className={`painel flex flex-col gap-2 p-3 ${p.lotado ? 'ring-2 ring-coral-500' : ''}`}
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold">{p.parceiro}</h3>
                  <p className="text-[0.7rem] text-creme-200">
                    {nomeMunicipio(p.municipio)} ·{' '}
                    <SeloCamada camada="SIMULADO" texto="NOME FICTÍCIO" />
                  </p>
                </div>
                <span className="font-display text-lg tabular-nums">
                  <Numero dado={p.ocupacao} formatar={fmt.pct} />
                </span>
              </header>
              <div
                className="h-3 overflow-hidden rounded-full bg-navy-700"
                role="meter"
                aria-valuenow={Math.round(pct * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Ocupação do ponto"
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, pct * 100)}%`,
                    background: p.lotado
                      ? 'var(--color-coral-500)'
                      : pct > 0.75
                        ? 'var(--color-alerta)'
                        : 'var(--color-ok)',
                  }}
                />
              </div>
              <p className="text-[0.68rem] text-creme-200">
                <Numero dado={p.volume} formatar={(v) => `${fmt.dec1(v)} m³`} /> de{' '}
                {fmt.dec1(p.capacidade)} m³
              </p>
              {p.lotado && (
                <p className="rounded bg-coral-500 px-2 py-1 text-[0.72rem] font-bold text-navy-950">
                  ⚠ Ponto lotado — aviso automático enviado à Logística; o ponto entrou na próxima
                  rota.
                </p>
              )}
              <ul className="flex flex-col gap-0.5 text-xs">
                {p.metas
                  .filter((m) => m.quantidade > 0)
                  .slice(0, 4)
                  .map((m) => (
                    <li key={m.item} className="flex justify-between gap-2">
                      <span>
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            background:
                              m.prioridade >= 0.5
                                ? 'var(--color-coral-500)'
                                : m.prioridade >= 0.25
                                  ? 'var(--color-alerta)'
                                  : 'var(--color-ok)',
                          }}
                        />{' '}
                        Meta {itemPorId(m.item).nome}
                      </span>
                      <span className="tabular-nums">
                        {fmt.int(m.quantidade)} {m.unidade.split(' ')[0]}
                      </span>
                    </li>
                  ))}
                {p.metas.every((m) => m.quantidade === 0) && (
                  <li className="text-creme-200">Sem déficit nos abrigos desta base.</li>
                )}
              </ul>
              <div className="flex gap-2">
                <Botao onClick={() => registrar(p.id, 0.5)}>+0,5 m³ recebidos</Botao>
                <Botao onClick={() => registrar(p.id, -0.5)}>−0,5 m³ recolhidos</Botao>
              </div>
            </article>
          );
        })}
      </Grade>
    </div>
  );
}

/** O coordenador do abrigo informa a falta: ajusta estoque e pessoas — a fórmula é calibrada por quem está lá. */
export function FormularioCoordenador() {
  const r = useResultado();
  const registrar = useOperacao((s) => s.registrarAjuste);
  const desfazer = useOperacao((s) => s.desfazerAjuste);
  const ajustes = useOperacao((s) => s.entrada.ajustes);
  const locais = r.locais.filter((l) => l.pessoasN > 0);
  const [local, setLocal] = useState(locais[0]?.id ?? '');
  const [item, setItem] = useState<IdItem>('agua');
  const [estoque, setEstoque] = useState('');
  const [pessoas, setPessoas] = useState('');
  const atual = r.locais.find((l) => l.id === local);
  return (
    <Painel titulo="Coordenador de abrigo informa a falta">
      <form
        className="flex flex-wrap items-end gap-3 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          if (!local || estoque === '') return;
          registrar({
            local,
            item,
            estoque: Number(estoque),
            ...(pessoas ? { pessoas: Number(pessoas) } : {}),
            nota: 'Contagem feita no abrigo',
          });
          setEstoque('');
          setPessoas('');
        }}
      >
        <label className="flex flex-col gap-1">
          Abrigo
          <select
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            className="rounded bg-navy-800 px-2 py-1.5"
          >
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Item
          <select
            value={item}
            onChange={(e) => setItem(e.target.value as IdItem)}
            className="rounded bg-navy-800 px-2 py-1.5"
          >
            {ITENS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Estoque contado ({itemPorId(item).unidade})
          <input
            type="number"
            min={0}
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            placeholder={atual ? String(Math.round(atual.estoque[item].valor as number)) : ''}
            className="w-32 rounded bg-navy-800 px-2 py-1.5"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          Pessoas abrigadas (opcional)
          <input
            type="number"
            min={0}
            value={pessoas}
            onChange={(e) => setPessoas(e.target.value)}
            placeholder={atual ? String(Math.round(atual.pessoasN)) : ''}
            className="w-32 rounded bg-navy-800 px-2 py-1.5"
          />
        </label>
        <Botao tipo="primario" type="submit">
          Informar
        </Botao>
      </form>
      {ajustes.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs">
          {ajustes.map((a) => (
            <li
              key={a.uid}
              className="flex items-center justify-between gap-2 border-t border-white/5 pt-1"
            >
              <span>
                {new Date(a.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                · {r.locais.find((l) => l.id === a.local)?.nome}: {itemPorId(a.item).nome} ={' '}
                {fmt.int(a.estoque)}
                {a.pessoas !== undefined ? ` · ${fmt.int(a.pessoas)} pessoas` : ''}
              </span>
              <button onClick={() => desfazer(a.uid)} className="text-coral-400 underline">
                desfazer
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[0.68rem] text-creme-200">
        Nenhum dado pessoal é coletado — só contagens de estoque e de pessoas.
      </p>
    </Painel>
  );
}
