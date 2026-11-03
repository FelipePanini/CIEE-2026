import { DADOS, nomeMunicipio } from '../../data/carregar';
import { useResultado } from '../../store';
import { Grade, Painel, TituloTela } from '../../ui/blocos';
import { SeloCamada } from '../../ui/SeloCamada';
import { fmt } from '../../ui/formato';
import { itemPorId, type IdItem } from '../../engine/urgencia';
import { MuralRelatos } from '../humano/Mural';

const TIPO = {
  produto: 'Produto',
  veiculo: 'Veículo',
  espaco: 'Espaço',
  voluntarios: 'Voluntários',
} as const;
const NIVEIS = [
  { chave: '1-atencao', nome: 'Atenção', nivel: 1 },
  { chave: '2-alerta', nome: 'Alerta', nivel: 2 },
  { chave: '3-critico', nome: 'Crítico', nivel: 3 },
];

export function Painel2DParceiros() {
  const r = useResultado();
  const nomeLocal = (id: string) => r.locais.find((l) => l.id === id)?.nome ?? id;
  const kitsPorParceiro = (id: string) => {
    const pa = DADOS.parceiros.parceiros.find((p) => p.id === id)!;
    const rep = r.kit.repoe;
    const porItem = (Object.keys(rep) as IdItem[])
      .filter((k) => rep[k] > 0 && (pa.recursos[k] ?? 0) > 0)
      .map((k) => (pa.recursos[k] ?? 0) / rep[k]);
    return porItem.length ? Math.floor(Math.min(...porItem)) : 0;
  };
  const destino = (id: string) => {
    const pa = DADOS.parceiros.parceiros.find((p) => p.id === id)!;
    const ponto = r.pontos.find((p) => p.id === pa.ponto_coleta);
    const base = ponto?.base ? r.locais.find((l) => l.id === ponto.base) : null;
    return base ? nomeMunicipio(base.municipio) : nomeMunicipio(pa.municipio_ibge);
  };
  return (
    <div className="flex flex-col gap-4">
      <TituloTela titulo="Rede de parceiros" area="comercio" pergunta="quem ajuda">
        <SeloCamada camada="SIMULADO" texto="NOMES FICTÍCIOS" />
      </TituloTela>
      <p className="max-w-3xl text-sm text-creme-200">{DADOS.parceiros.aviso}</p>
      <Painel titulo="Match automático: item crítico → parceiro mais próximo com o recurso">
        {r.sugestoes.length === 0 ? (
          <p className="text-xs text-creme-200">Nenhum item crítico no momento.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-creme-200">
              <tr>
                <th className="py-1">Abrigo</th>
                <th>Item crítico</th>
                <th>Parceiro sugerido</th>
                <th>Distância</th>
                <th>Compromisso no nível atual</th>
              </tr>
            </thead>
            <tbody>
              {r.sugestoes.map((s, i) => (
                <tr key={i} className="border-t border-white/5 align-top">
                  <td className="py-1">{nomeLocal(s.local)}</td>
                  <td className="text-coral-400">{itemPorId(s.item).nome}</td>
                  <td>{DADOS.parceiros.parceiros.find((p) => p.id === s.parceiro)!.nome}</td>
                  <td className="tabular-nums">{fmt.dec1(s.distanciaKm)} km</td>
                  <td className="text-creme-200">{s.compromisso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Painel>
      <Grade min={300}>
        {DADOS.parceiros.parceiros.map((p) => (
          <article key={p.id} className="painel flex flex-col gap-2 p-3">
            <header className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">{p.nome}</h3>
                <p className="text-[0.7rem] text-creme-200">
                  {TIPO[p.tipo_ajuda]} · {p.bairro}, {nomeMunicipio(p.municipio_ibge)}
                </p>
              </div>
              <SeloCamada camada="SIMULADO" texto="FICTÍCIO" />
            </header>
            <p className="text-[0.68rem] text-piscina-300">Base real: {p.base_real}</p>
            <ul className="flex flex-wrap gap-1 text-[0.68rem]">
              {Object.entries(p.recursos)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => (
                  <li key={k} className="rounded bg-navy-800 px-1.5 py-0.5">
                    {k in { agua: 1, alimentos: 1, higiene: 1, cobertores: 1, papel_roupas: 1 }
                      ? itemPorId(k as IdItem).nome
                      : k}
                    : {fmt.int(v)}
                  </li>
                ))}
            </ul>
            <div className="flex flex-col gap-0.5 text-[0.68rem]">
              {NIVEIS.map((n) => (
                <p
                  key={n.chave}
                  className={r.nivelAlerta >= n.nivel ? 'text-creme-100' : 'text-creme-200/50'}
                >
                  <strong>{n.nome}:</strong> {p.compromisso_pre_acordado[n.chave]}
                </p>
              ))}
            </div>
            {p.tipo_ajuda === 'produto' && kitsPorParceiro(p.id) > 0 && (
              <p className="rounded bg-piscina-300/15 px-2 py-1 text-xs">
                Prestação de contas: “sua doação virou{' '}
                <strong>{fmt.int(kitsPorParceiro(p.id))} kits</strong> entregues em {destino(p.id)}
                ”.
              </p>
            )}
            {p.veiculos && (
              <p className="text-[0.68rem] text-creme-200">
                Veículos:{' '}
                {p.veiculos
                  .map((v) => `${v.categoria.toUpperCase()} ${v.janela.join('–')}`)
                  .join(' · ')}
              </p>
            )}
          </article>
        ))}
      </Grade>
      <MuralRelatos />
    </div>
  );
}
