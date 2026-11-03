/**
 * Parâmetros do modelo — "critério do grupo". Todos editáveis no painel de configuração.
 * Sempre que existe uma referência real (Manual Esfera, IBGE), ela é citada ao lado.
 */
import type { Dado, Parametro } from './tipos';

export type IdParametro =
  | 'consumo_agua_l'
  | 'consumo_racao'
  | 'consumo_higiene_kit'
  | 'consumo_papel_rolo'
  | 'prazo_agua'
  | 'prazo_alimentos'
  | 'prazo_higiene'
  | 'prazo_cobertores'
  | 'prazo_papel'
  | 'familia_ref'
  | 'dias_kit'
  | 'area_quadra_m2'
  | 'fracao_atendida'
  | 'dias_autonomia_prontidao'
  | 'taxa_descarga'
  | 'taxa_triagem'
  | 'taxa_montagem'
  | 'taxa_bilhete'
  | 'taxa_expedicao'
  | 'capacidade_ponto_m3'
  | 'volume_kit_m3'
  | 'peso_kit_kg'
  | 'fator_urgencia_frete'
  | 'sobrepreco_emergencial';

export type Parametros = Record<IdParametro, number>;

type Def = Omit<Parametro, 'id'> & { id: IdParametro };

/** Referências reais anexadas pelo carregador (Esfera, IBGE). */
export type Referencias = Partial<Record<IdParametro, Dado>>;

export const DEFINICOES: Def[] = [
  {
    id: 'consumo_agua_l',
    rotulo: 'Água potável por pessoa/dia',
    valor: 3,
    unidade: 'L',
    min: 2.5,
    max: 15,
    passo: 0.5,
    descricao:
      'Só água para beber e preparar alimentos (Esfera: 2,5–3 L). A água de higiene (até 15 L no total) vem da rede ou de caminhão-pipa.',
  },
  {
    id: 'consumo_racao',
    rotulo: 'Ração diária por pessoa',
    valor: 1,
    unidade: 'ração (2.100 kcal)',
    min: 1,
    max: 1,
    passo: 1,
    descricao: '1 ração = 2.100 kcal, o padrão de energia do Manual Esfera.',
  },
  {
    id: 'consumo_higiene_kit',
    rotulo: 'Kit de higiene por pessoa/dia',
    valor: 1 / 30,
    unidade: 'kit pessoa-mês',
    min: 1 / 60,
    max: 1 / 15,
    passo: 1 / 120,
    descricao:
      '1 kit pessoa-mês = 250 g de sabonete + 200 g de sabão (Esfera) + creme dental, escova e absorventes.',
  },
  {
    id: 'consumo_papel_rolo',
    rotulo: 'Papel higiênico por pessoa/dia',
    valor: 0.25,
    unidade: 'rolo',
    min: 0.1,
    max: 1,
    passo: 0.05,
    descricao: 'Estimativa do grupo (sem padrão Esfera para papel higiênico).',
  },
  {
    id: 'prazo_agua',
    rotulo: 'Prazo crítico — água',
    valor: 3,
    unidade: 'dias',
    min: 1,
    max: 7,
    passo: 1,
    descricao: 'Abaixo disso o termômetro fica vermelho.',
  },
  {
    id: 'prazo_alimentos',
    rotulo: 'Prazo crítico — alimentos',
    valor: 7,
    unidade: 'dias',
    min: 2,
    max: 14,
    passo: 1,
    descricao: '',
  },
  {
    id: 'prazo_higiene',
    rotulo: 'Prazo crítico — higiene e limpeza',
    valor: 5,
    unidade: 'dias',
    min: 2,
    max: 14,
    passo: 1,
    descricao: '',
  },
  {
    id: 'prazo_cobertores',
    rotulo: 'Prazo crítico — cobertores e colchões',
    valor: 2,
    unidade: 'dias',
    min: 1,
    max: 7,
    passo: 1,
    descricao: 'Item durável: 1 por pessoa (Esfera). A cobertura mede quantas pessoas já têm.',
  },
  {
    id: 'prazo_papel',
    rotulo: 'Prazo crítico — papel higiênico e roupas',
    valor: 10,
    unidade: 'dias',
    min: 3,
    max: 20,
    passo: 1,
    descricao: '',
  },
  {
    id: 'familia_ref',
    rotulo: 'Família de referência do kit',
    valor: 4,
    unidade: 'pessoas',
    min: 1,
    max: 8,
    passo: 1,
    descricao:
      'Usada na frase "1 kit = 1 família de 4 pessoas por 3 dias". A média real no RS é mostrada ao lado (IBGE).',
  },
  {
    id: 'dias_kit',
    rotulo: 'Dias cobertos por kit',
    valor: 3,
    unidade: 'dias',
    min: 1,
    max: 7,
    passo: 1,
    descricao: '',
  },
  {
    id: 'area_quadra_m2',
    rotulo: 'Área útil da quadra para abrigo',
    valor: 600,
    unidade: 'm²',
    min: 300,
    max: 1500,
    passo: 50,
    descricao:
      'Área da quadra poliesportiva usada para dormir. Capacidade = área ÷ espaço mínimo por pessoa (Esfera).',
  },
  {
    id: 'fracao_atendida',
    rotulo: 'Parcela dos abrigados atendida pela operação',
    valor: 0.2,
    unidade: 'fração',
    min: 0.02,
    max: 1,
    passo: 0.01,
    descricao:
      'Nos abrigos oficiais de terceiros (ex.: Ulbra, Parque do Imigrante) a operação abastece só uma parcela dos abrigados; nas quadras-base, todos.',
  },
  {
    id: 'dias_autonomia_prontidao',
    rotulo: 'Autonomia do estoque pré-posicionado',
    valor: 3,
    unidade: 'dias',
    min: 1,
    max: 10,
    passo: 1,
    descricao:
      'Cenário Prontidão: quantos dias o estoque mínimo sustenta o pior caso histórico sem reposição.',
  },
  {
    id: 'taxa_descarga',
    rotulo: 'Descarga — caixas/hora por voluntário',
    valor: 40,
    unidade: 'caixas/h',
    min: 10,
    max: 80,
    passo: 5,
    descricao: '',
  },
  {
    id: 'taxa_triagem',
    rotulo: 'Triagem — itens conferidos/hora por voluntário',
    valor: 6,
    unidade: 'kits/h',
    min: 2,
    max: 15,
    passo: 1,
    descricao: 'Conferência de validade, categoria e integridade, medida em kits equivalentes.',
  },
  {
    id: 'taxa_montagem',
    rotulo: 'Montagem — kits/hora por voluntário',
    valor: 8,
    unidade: 'kits/h',
    min: 2,
    max: 20,
    passo: 1,
    descricao: '',
  },
  {
    id: 'taxa_bilhete',
    rotulo: 'Estação do bilhete — kits/hora por voluntário',
    valor: 30,
    unidade: 'kits/h',
    min: 5,
    max: 60,
    passo: 5,
    descricao: 'Cada kit leva uma mensagem de voluntário ou doador.',
  },
  {
    id: 'taxa_expedicao',
    rotulo: 'Expedição — kits/hora por voluntário',
    valor: 25,
    unidade: 'kits/h',
    min: 5,
    max: 60,
    passo: 5,
    descricao: '',
  },
  {
    id: 'capacidade_ponto_m3',
    rotulo: 'Capacidade de um ponto de coleta',
    valor: 4,
    unidade: 'm³',
    min: 1,
    max: 20,
    passo: 0.5,
    descricao:
      'Volume de caixas que o supermercado parceiro aceita guardar antes de chamar a Logística.',
  },
  {
    id: 'volume_kit_m3',
    rotulo: 'Volume de um kit',
    valor: 0.06,
    unidade: 'm³',
    min: 0.02,
    max: 0.2,
    passo: 0.01,
    descricao: 'Caixa de ~50 × 40 × 30 cm.',
  },
  {
    id: 'peso_kit_kg',
    rotulo: 'Peso de um kit',
    valor: 18,
    unidade: 'kg',
    min: 5,
    max: 40,
    passo: 1,
    descricao: 'Calculado a partir da composição do kit; editável.',
  },
  {
    id: 'fator_urgencia_frete',
    rotulo: 'Multiplicador do frete urgente',
    valor: 1.5,
    unidade: '×',
    min: 1,
    max: 3,
    passo: 0.1,
    descricao: 'Compra emergencial: frete contratado em cima da hora, acima do piso ANTT.',
  },
  {
    id: 'sobrepreco_emergencial',
    rotulo: 'Sobrepreço da compra emergencial',
    valor: 0.2,
    unidade: 'fração',
    min: 0,
    max: 1,
    passo: 0.05,
    descricao: 'Preço acima do DIEESE por comprar no pico da demanda, sem negociação.',
  },
];

export const PARAMETROS_PADRAO: Parametros = Object.fromEntries(
  DEFINICOES.map((d) => [d.id, d.valor]),
) as Parametros;

export const definicao = (id: IdParametro): Def => DEFINICOES.find((d) => d.id === id)!;

export const comoInsumo = (id: IdParametro, valor: number) => ({
  tipo: 'parametro' as const,
  rotulo: definicao(id).rotulo,
  parametro: { id, rotulo: definicao(id).rotulo, valor, unidade: definicao(id).unidade },
});
