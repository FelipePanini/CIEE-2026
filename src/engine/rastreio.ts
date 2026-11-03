/**
 * Rastreio do kit (mock): a partir do código impresso na etiqueta, monta a jornada da caixa com o que o
 * motor já calculou — ponto de coleta → quadra-base → bilhete → rota → abrigo.
 * Nenhum dado de família entra aqui: o código identifica a CAIXA, nunca quem a recebeu (LGPD).
 */
import type { Dados } from '../data/carregar';
import type { Resultado } from './simulacao';

export interface EtapaRastreio {
  id: 'coleta' | 'montagem' | 'bilhete' | 'expedicao' | 'entrega';
  titulo: string;
  detalhe: string;
  /** horas desde a saída da quadra (só expedição/entrega) */
  horas?: number;
}

export interface Jornada {
  codigo: string;
  destino: { nome: string; municipio: number; equipe: string };
  etapas: EtapaRastreio[];
}

export const PADRAO_CODIGO = /^KIT-\d{4}-\d{4}$/;

export function codigoKit(ano: number, sequencia: number): string {
  return `KIT-${ano}-${String(sequencia).padStart(4, '0')}`;
}

/** Hash FNV-1a 32 bits — determinístico: o mesmo código sempre leva ao mesmo abrigo. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const hhmm = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
};

export function jornadaKit(
  codigo: string,
  r: Resultado,
  dados: Dados,
  bilhetes: string[],
  nomeMunicipio: (ibge: number) => string,
): Jornada | null {
  if (!PADRAO_CODIGO.test(codigo)) return null;
  const comRota = r.locais.filter((l) => l.pessoasN > 0 && l.base && !l.semRota);
  // abrigos que recebem por rota (não a própria quadra-base) contam em dobro: a jornada mostra a expedição
  const destinos = [...comRota.filter((l) => l.base !== l.id), ...comRota];
  if (!destinos.length) return null;
  const h = hash(codigo);
  const local = destinos[h % destinos.length]!;
  const base = r.locais.find((l) => l.id === local.base) ?? local;
  const d2 = (p: { lat: number; lon: number }) => (p.lat - base.lat) ** 2 + (p.lon - base.lon) ** 2;
  const daBase = r.pontos.filter((p) => p.base === base.id);
  const candidatos = daBase.length
    ? daBase
    : [...r.pontos].sort((a, b) => d2(a) - d2(b)).slice(0, 3);
  const ponto = candidatos.length ? candidatos[h % candidatos.length] : undefined;
  // o motor guarda o parceiro pelo nome (fictício); aceita também o id
  const acharParceiro = (chave: string) =>
    dados.parceiros.parceiros.find((p) => p.nome === chave || p.id === chave);
  const parceiro = ponto && acharParceiro(ponto.parceiro);
  const rota = r.rotas.find((x) => x.base === base.id);
  const parada = rota?.paradas.find((p) => p.no === local.id);
  const veiculoParceiro = rota?.veiculo && acharParceiro(rota.veiculo.parceiro);
  const bilhete = bilhetes.length ? bilhetes[h % bilhetes.length]! : null;

  const etapas: EtapaRastreio[] = [
    {
      id: 'coleta',
      titulo: 'Doação recebida',
      detalhe: parceiro
        ? `${parceiro.nome} · ${parceiro.bairro}, ${nomeMunicipio(parceiro.municipio_ibge)}`
        : 'Ponto de coleta da rede',
    },
    {
      id: 'montagem',
      titulo: 'Triagem e montagem',
      detalhe: `${base.nome} — itens conferidos por validade e montados no kit família`,
    },
    {
      id: 'bilhete',
      titulo: 'Bilhete colocado',
      detalhe: bilhete ? `“${bilhete}”` : 'Mensagem de voluntário ou doador',
    },
  ];
  if (local.id !== base.id) {
    etapas.push({
      id: 'expedicao',
      titulo: 'Saiu para entrega',
      detalhe: rota?.veiculo
        ? `${rota.veiculo.categoria.toUpperCase()} cedido por ${veiculoParceiro?.nome ?? 'parceiro'}${parada ? ` · parada ${rota.paradas.indexOf(parada)} de ${rota.paradas.length - 2} da rota` : ''}`
        : 'Veículo da rede de parceiros',
      horas: 0,
    });
  }
  etapas.push({
    id: 'entrega',
    titulo: 'Entregue no abrigo',
    detalhe: `${local.nome}, ${nomeMunicipio(local.municipio)} — recebido pela ${local.voluntarioReferencia}${
      parada ? ` · ${hhmm(parada.chegadaH)} após a saída` : ''
    }`,
    horas: parada?.chegadaH ?? 0,
  });
  return {
    codigo,
    destino: { nome: local.nome, municipio: local.municipio, equipe: local.voluntarioReferencia },
    etapas,
  };
}
