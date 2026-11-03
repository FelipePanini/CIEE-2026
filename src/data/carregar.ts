/**
 * Carrega e valida (zod) todos os arquivos de data/*.json.
 * Os JSONs entram no bundle: o app funciona offline com o último dado salvo.
 */
import * as S from './schema';
import meta from '../../data/meta.json';
import municipios from '../../data/municipios.json';
import eventos from '../../data/eventos.json';
import rios from '../../data/rios.json';
import seriesRios from '../../data/series-rios.json';
import previsao from '../../data/previsao.json';
import abrigos from '../../data/abrigos.json';
import escolas from '../../data/escolas-base.json';
import precos from '../../data/precos.json';
import frete from '../../data/frete.json';
import veiculos from '../../data/veiculos.json';
import esfera from '../../data/esfera.json';
import nutricao from '../../data/nutricao.json';
import saude from '../../data/saude.json';
import orcamento from '../../data/orcamento.json';
import redeViaria from '../../data/rede-viaria.json';
import estoques from '../../data/simulado/estoques.json';
import parceiros from '../../data/simulado/parceiros.json';
import relatos from '../../data/simulado/relatos.json';
import cartas from '../../data/simulado/cartas-crise.json';

export const DADOS = {
  meta: S.metaSchema.parse(meta),
  municipios: S.municipiosSchema.parse(municipios),
  eventos: S.eventosSchema.parse(eventos),
  rios: S.riosSchema.parse(rios),
  seriesRios: S.seriesRiosSchema.parse(seriesRios),
  previsao: S.previsaoSchema.parse(previsao),
  abrigos: S.abrigosSchema.parse(abrigos),
  escolas: S.escolasSchema.parse(escolas),
  precos: S.precosSchema.parse(precos),
  frete: S.freteSchema.parse(frete),
  veiculos: S.veiculosSchema.parse(veiculos),
  esfera: S.esferaSchema.parse(esfera),
  nutricao: S.nutricaoSchema.parse(nutricao),
  saude: S.saudeSchema.parse(saude),
  orcamento: S.orcamentoSchema.parse(orcamento),
  redeViaria: S.redeViariaSchema.parse(redeViaria),
  estoques: S.estoquesSchema.parse(estoques),
  parceiros: S.parceirosSchema.parse(parceiros),
  relatos: S.relatosSchema.parse(relatos),
  cartas: S.cartasSchema.parse(cartas),
};

export type Dados = typeof DADOS;

export const municipioPorIbge = new Map(DADOS.municipios.municipios.map((m) => [m.ibge, m]));
export const nomeMunicipio = (ibge: number): string =>
  municipioPorIbge.get(ibge)?.nome ?? String(ibge);
