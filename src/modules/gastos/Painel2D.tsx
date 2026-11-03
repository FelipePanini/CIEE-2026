import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DADOS } from '../../data/carregar';
import { useResultado } from '../../store';
import { Grade, Kpi, Painel, TituloTela } from '../../ui/blocos';
import { Numero } from '../../ui/Numero';
import { fmt } from '../../ui/formato';
import { SERIES } from '../../ui/cores';
import { FraseKit } from '../urgencia/Painel2D';

const nomeProduto = (id: string) => DADOS.precos.produtos.find((p) => p.id === id)?.nome ?? id;
const embalagem = (id: string) => DADOS.precos.produtos.find((p) => p.id === id)?.embalagem ?? '';

export function Painel2DGastos() {
  const r = useResultado();
  const c = r.custos;
  const uso = Math.min(1.5, c.usoOrcamento.valor);
  const pr = c.prevenirReagir;
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Controle de gastos" area="administracao" pergunta="quanto custa" />
      <Grade min={190}>
        <Kpi rotulo="Custo do kit">
          <Numero dado={r.kit.custo} formatar={fmt.brl} />
        </Kpi>
        <Kpi rotulo="Custo por família atendida">
          <Numero dado={c.custoPorFamilia} formatar={fmt.brl} />
        </Kpi>
        <Kpi rotulo="Custo total da resposta" destaque>
          <Numero dado={c.total} formatar={fmt.brl} selo />
        </Kpi>
        <Kpi rotulo="Economia gerada por parceiros">
          <Numero dado={c.economiaParceiros} formatar={fmt.brl} />
        </Kpi>
      </Grade>
      <Painel titulo="Orçamento usado vs. disponível">
        <div
          className="h-4 overflow-hidden rounded-full bg-navy-700"
          role="meter"
          aria-valuenow={Math.round(uso * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Uso do orçamento"
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, uso * 100)}%`,
              background:
                uso > 1
                  ? 'var(--color-coral-500)'
                  : uso > 0.8
                    ? 'var(--color-alerta)'
                    : 'var(--color-ok)',
            }}
          />
        </div>
        <p className="text-sm">
          <Numero dado={c.total} formatar={fmt.brl} /> de{' '}
          <Numero dado={c.orcamento} formatar={fmt.brl} selo /> (
          <Numero dado={c.usoOrcamento} formatar={fmt.pct} />)
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-creme-200">
          <span>
            Compras: <Numero dado={c.compras} formatar={fmt.brl} />
          </span>
          <span>
            Frete (piso ANTT): <Numero dado={c.frete} formatar={fmt.brl} />
          </span>
          <span>
            − Doações e frete doado: <Numero dado={c.economiaParceiros} formatar={fmt.brl} />
          </span>
        </div>
      </Painel>
      <Grade min={360}>
        <Painel titulo="De onde vem cada real do kit">
          <p className="text-xs text-creme-200">
            <FraseKit />. Alimentos: preço médio DIEESE em Porto Alegre; higiene, limpeza e água:
            catálogo online de atacado (loja citada só como fonte de preço).
          </p>
          <table className="w-full text-left text-xs">
            <thead className="text-creme-200">
              <tr>
                <th className="py-1">Item</th>
                <th>Qtd.</th>
                <th>Preço</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {r.kit.linhas.map((l) => (
                <tr key={l.produto} className="border-t border-white/5">
                  <td className="py-1">
                    {nomeProduto(l.produto)}{' '}
                    <span className="text-creme-200/60">({embalagem(l.produto)})</span>
                  </td>
                  <td className="tabular-nums">{fmt.dec2(l.qtd)}</td>
                  <td>
                    {l.preco ? (
                      <Numero dado={l.preco} formatar={fmt.brl} />
                    ) : (
                      <span className="text-alerta">A CONFIRMAR</span>
                    )}
                  </td>
                  <td className="text-right tabular-nums">
                    {l.subtotal === null ? '—' : fmt.brl(l.subtotal)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-white/20 font-bold">
                <td className="py-1" colSpan={3}>
                  Total do kit
                </td>
                <td className="text-right">
                  <Numero dado={r.kit.custo} formatar={fmt.brl} />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-creme-200">
            Energia: <Numero dado={r.kit.kcalPessoaDia} formatar={(v) => `${fmt.int(v)} kcal`} />{' '}
            por pessoa/dia (TACO) — meta Esfera{' '}
            <Numero
              dado={DADOS.esfera.padroes.energia_kcal!}
              formatar={(v) => `${fmt.int(v)} kcal`}
            />
            . Açúcar e leite ainda sem valor TACO confirmado (não somados).
          </p>
        </Painel>
        <div className="flex flex-col gap-3">
          <Painel titulo="Escala real: PIX SOS Rio Grande do Sul">
            <p className="text-sm">
              A campanha arrecadou{' '}
              <Numero dado={DADOS.orcamento.pix_sos_rs.arrecadado!} formatar={fmt.brl} selo />.
            </p>
            <p className="text-sm">
              No custo calculado aqui, isso equivale a{' '}
              <Numero
                dado={c.pixEmKits}
                formatar={fmt.int}
                className="font-display text-xl text-coral-400"
              />{' '}
              kits.
            </p>
            <p className="text-xs text-creme-200">
              <Numero dado={DADOS.orcamento.pix_sos_rs.familias_beneficiadas!} formatar={fmt.int} />{' '}
              famílias receberam{' '}
              <Numero dado={DADOS.orcamento.pix_sos_rs.valor_por_familia!} formatar={fmt.brl} />{' '}
              cada.
            </p>
          </Painel>
          {pr ? (
            <Painel titulo="Prevenir custa menos que reagir">
              <div className="h-40">
                <ResponsiveContainer>
                  <BarChart
                    data={[
                      { n: 'Prevenir (estoque pré-posicionado)', v: pr.prevenir.valor },
                      { n: 'Reagir (compra emergencial)', v: pr.reagir.valor },
                    ]}
                    layout="vertical"
                    margin={{ left: 10, right: 70 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="n"
                      width={130}
                      tick={{ fill: '#e7e0d2', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0b1e26',
                        border: '1px solid #8cc7c555',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v) => fmt.brl(Number(v))}
                      cursor={{ fill: '#ffffff0d' }}
                    />
                    <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={26}>
                      <Cell fill={SERIES[1]} />
                      <Cell fill={SERIES[0]} />
                      <LabelList
                        dataKey="v"
                        position="right"
                        formatter={(v: unknown) => fmt.brlCompacto(Number(v))}
                        fill="#f3efe6"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm">
                Economia de{' '}
                <Numero dado={pr.economia} formatar={fmt.brl} className="font-bold text-ok" /> ao
                pré-posicionar o estoque mínimo antes da cheia.
              </p>
            </Painel>
          ) : (
            <Painel titulo="Prevenir vs. reagir">
              <p className="text-xs text-creme-200">
                Troque para o cenário Prontidão para comparar o estoque pré-posicionado com a compra
                emergencial.
              </p>
            </Painel>
          )}
        </div>
      </Grade>
      <Painel titulo="Frete por rota">
        <ul className="flex flex-col gap-1 text-xs">
          {r.rotas.map((ro) => (
            <li key={ro.base} className="flex justify-between gap-2">
              <span>
                {DADOS.redeViaria.nos.find((n) => n.id === ro.base)?.nome} ·{' '}
                {ro.veiculo?.categoria.toUpperCase() ?? '—'} ·{' '}
                <Numero dado={ro.km} formatar={(v) => `${fmt.dec1(v)} km`} /> · {ro.viagens}{' '}
                viagem(ns)
              </span>
              <Numero dado={ro.frete} formatar={fmt.brl} />
            </li>
          ))}
        </ul>
      </Painel>
    </div>
  );
}
