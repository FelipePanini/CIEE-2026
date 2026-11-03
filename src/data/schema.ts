/**
 * Esquemas (zod) dos arquivos em data/*.json.
 * Usados em tempo de build/CI (scripts/validar-dados.ts) e no carregamento do app.
 */
import { z } from 'zod';
import { A_CONFIRMAR, CAMADAS } from '../engine/tipos';

const dataISO = z
  .string()
  .regex(
    /^\d{4}(-\d{2}(-\d{2})?)?([T ][\d:.+-Z]+)?(\/\d{4}(-\d{2}(-\d{2})?)?)?$/,
    'data ISO ou período ISO/ISO',
  );

export const camadaSchema = z.enum(CAMADAS);

const base = {
  unidade: z.string(),
  fonte: z.string().min(3),
  url: z.string().url().nullable(),
  data_referencia: dataISO,
  data_consulta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  camada: camadaSchema,
  nota: z.string().optional(),
  confirmacoes: z.array(z.object({ fonte: z.string(), url: z.string().url() })).optional(),
};

const regraDeUrl = (d: { camada: string; url: string | null }) =>
  d.camada === 'SIMULADO' || (d.url !== null && d.url !== '');
const MSG_URL = { message: 'url é obrigatória fora da camada SIMULADO' };

export const dadoNumSchema = z
  .object({ ...base, valor: z.union([z.number(), z.literal(A_CONFIRMAR)]) })
  .refine(regraDeUrl, MSG_URL);
export const dadoTextoSchema = z.object({ ...base, valor: z.string() }).refine(regraDeUrl, MSG_URL);

export type DadoNum = z.infer<typeof dadoNumSchema>;

/** Referência de fonte para atributos não numéricos (endereço, localização, lista). */
export const fonteSchema = z.object({
  fonte: z.string(),
  url: z.string().url(),
  data_consulta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nota: z.string().optional(),
});

const coord = { lat: z.number().min(-34).max(-27), lon: z.number().min(-58).max(-49) };

// ── meta ───────────────────────────────────────────────────────────────────────
export const metaSchema = z.object({
  ultima_atualizacao: z.string(),
  metodo: z.string(),
  fontes_bloqueadas_no_ambiente: z.array(z.string()).optional(),
});

// ── municípios ────────────────────────────────────────────────────────────────
export const municipioSchema = z.object({
  ibge: z.number().int(),
  nome: z.string(),
  regiao: z.string(),
  ...coord,
  populacao: dadoNumSchema,
});
export const municipiosSchema = z.object({
  fonte_coordenadas: fonteSchema,
  media_moradores_domicilio_rs: dadoNumSchema,
  municipios: z.array(municipioSchema),
});
export type Municipio = z.infer<typeof municipioSchema>;

// ── eventos (cheias) ──────────────────────────────────────────────────────────
export const impactoMunicipioSchema = z.object({
  ibge: z.number().int(),
  desabrigados: dadoNumSchema.optional(),
  desalojados: dadoNumSchema.optional(),
  abrigos: dadoNumSchema.optional(),
  nota: z.string().optional(),
});
export const eventoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  rotulo_curto: z.string(),
  periodo: dataISO,
  camada: camadaSchema,
  resumo: z.string(),
  bacia_principal: z.string(),
  indicadores: z.object({
    municipios_afetados: dadoNumSchema,
    desabrigados: dadoNumSchema,
    desalojados: dadoNumSchema,
    fora_de_casa: dadoNumSchema.optional(),
    obitos: dadoNumSchema.optional(),
    pessoas_afetadas: dadoNumSchema.optional(),
  }),
  picos: z.array(z.object({ estacao: z.string(), nivel: dadoNumSchema })),
  municipios: z.array(impactoMunicipioSchema),
  licoes: z
    .array(z.object({ texto: z.string(), fonte: z.string(), url: z.string().url() }))
    .optional(),
});
export const eventosSchema = z.object({ eventos: z.array(eventoSchema) });
export type Evento = z.infer<typeof eventoSchema>;

// ── rios ──────────────────────────────────────────────────────────────────────
export const estacaoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  rio: z.string(),
  municipio_ibge: z.number().int(),
  ...coord,
  codigo_ana: z.string(),
  cota_alerta: dadoNumSchema.optional(),
  cota_inundacao: dadoNumSchema,
  nivel_normal: dadoNumSchema.optional(),
  nivel_atual: dadoNumSchema,
});
export const riosSchema = z.object({ estacoes: z.array(estacaoSchema) });
export type Estacao = z.infer<typeof estacaoSchema>;

// ── séries de nível (telemetria ANA) ─────────────────────────────────────────
export const serieSchema = z.object({
  id: z.string(),
  estacao: z.string(),
  codigo_ana: z.string(),
  rotulo: z.string(),
  camada: camadaSchema,
  fonte: z.string(),
  url: z.string().url(),
  data_consulta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  unidade: z.literal('m'),
  agregacao: z.string(),
  pontos: z.array(z.tuple([z.string(), z.number()])),
});
export const seriesRiosSchema = z.object({ series: z.array(serieSchema) });
export type SerieRio = z.infer<typeof serieSchema>;

// ── previsão ──────────────────────────────────────────────────────────────────
export const prognosticoSchema = z.object({
  id: z.string(),
  orgao: z.string(),
  titulo: z.string(),
  periodo: dataISO,
  resumo: z.string(),
  url: z.string().url(),
  indicadores: z.array(z.object({ id: z.string(), rotulo: z.string(), dado: dadoNumSchema })),
  regioes_destaque: z.array(z.string()),
});
export const previsaoSchema = z.object({
  prognosticos: z.array(prognosticoSchema),
  avisos_recentes: z.array(
    z.object({
      data: dataISO,
      titulo: z.string(),
      regioes: z.array(z.string()),
      fonte: z.string(),
      url: z.string().url(),
    }),
  ),
});
export type Prognostico = z.infer<typeof prognosticoSchema>;

// ── abrigos e escolas-base ───────────────────────────────────────────────────
export const abrigoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  municipio_ibge: z.number().int(),
  endereco: z.string(),
  ...coord,
  fonte_local: fonteSchema,
  eventos: z.array(z.string()),
  pessoas: z.record(z.string(), dadoNumSchema),
  tipo: z.enum(['abrigo-oficial', 'escola-abrigo']),
});
export const abrigosSchema = z.object({ abrigos: z.array(abrigoSchema) });
export type Abrigo = z.infer<typeof abrigoSchema>;

export const escolaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  rede: z.enum(['estadual', 'municipal', 'federal']),
  codigo_inep: z.string(),
  municipio_ibge: z.number().int(),
  bairro: z.string(),
  endereco: z.string(),
  ...coord,
  fonte: fonteSchema,
  uso: z.literal('uso simulado na operação'),
});
export const escolasSchema = z.object({ escolas: z.array(escolaSchema) });
export type Escola = z.infer<typeof escolaSchema>;

// ── preços, frete, veículos ──────────────────────────────────────────────────
export const produtoPrecoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: z.enum(['alimentos', 'higiene', 'limpeza', 'agua', 'abrigo']),
  embalagem: z.string(),
  preco: dadoNumSchema,
});
export const precosSchema = z.object({
  cesta_dieese_total: dadoNumSchema,
  produtos: z.array(produtoPrecoSchema),
});
export type ProdutoPreco = z.infer<typeof produtoPrecoSchema>;

export const freteSchema = z.object({
  norma: fonteSchema.extend({ titulo: z.string() }),
  formula: z.string(),
  pisos: z.array(z.object({ eixos: z.number().int(), ccd: dadoNumSchema, cc: dadoNumSchema })),
});

export const veiculoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  eixos: z.number().int(),
  capacidade_kg: dadoNumSchema,
  descricao: z.string(),
});
export const veiculosSchema = z.object({ categorias: z.array(veiculoSchema) });
export type CategoriaVeiculo = z.infer<typeof veiculoSchema>;

// ── padrões humanitários, saúde, orçamento ───────────────────────────────────
export const esferaSchema = z.object({ padroes: z.record(z.string(), dadoNumSchema) });
export const saudeSchema = z.object({
  leptospirose: z.array(
    z.object({ evento: z.string(), indicadores: z.record(z.string(), dadoNumSchema) }),
  ),
});
export const orcamentoSchema = z.object({ pix_sos_rs: z.record(z.string(), dadoNumSchema) });

// ── rede viária ──────────────────────────────────────────────────────────────
export const noSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.enum(['coleta', 'quadra', 'abrigo', 'entroncamento']),
  ...coord,
  ref: z.string().optional(),
});
export const arestaSchema = z.object({
  id: z.string(),
  de: z.string(),
  para: z.string(),
  via: z.string(),
  km: dadoNumSchema,
  velocidade_kmh: z.number(),
});
export const bloqueioSchema = z.object({
  id: z.string(),
  aresta: z.string(),
  descricao: z.string(),
  evento: z.string(),
  fonte: z.string(),
  url: z.string().url(),
  data_referencia: dataISO,
});
export const redeViariaSchema = z.object({
  metodo_distancia: z.string(),
  nos: z.array(noSchema),
  arestas: z.array(arestaSchema),
  bloqueios_reais: z.array(bloqueioSchema),
});
export type NoRede = z.infer<typeof noSchema>;
export type ArestaRede = z.infer<typeof arestaSchema>;
export type BloqueioReal = z.infer<typeof bloqueioSchema>;

// ── simulado ─────────────────────────────────────────────────────────────────
const dadoSimuladoSchema = dadoNumSchema.refine((d) => d.camada === 'SIMULADO', {
  message: 'arquivos em data/simulado/ só podem ter camada SIMULADO',
});

export const estoquesSchema = z.object({
  descricao: z.string(),
  estoques: z.array(
    z.object({ local: z.string(), itens: z.record(z.string(), dadoSimuladoSchema) }),
  ),
});

export const NOME_PARCEIRO =
  /^(Supermercado|Transportadora|Atacado|Farmácia|Distribuidora|Igreja|Clube|Empresa|Associação|Escola) Parceir[oa] [A-Z]$/;

export const parceiroSchema = z.object({
  id: z.string(),
  nome: z
    .string()
    .regex(NOME_PARCEIRO, 'nome de parceiro deve ser fictício no padrão "<Tipo> Parceiro(a) X"'),
  tipo_ajuda: z.enum(['produto', 'veiculo', 'espaco', 'voluntarios']),
  municipio_ibge: z.number().int(),
  bairro: z.string(),
  ...coord,
  /** Referência real usada para capacidade/preço (categoria de veículo, preço DIEESE…). */
  base_real: z.string(),
  recursos: z.record(z.string(), z.number()),
  compromisso_pre_acordado: z.record(z.string(), z.string()),
  /** Ponto de coleta (nó da rede) quando o parceiro é um supermercado. */
  ponto_coleta: z.string().optional(),
  /** Veículos cedidos (categoria real de veiculos.json) e janela de horário. */
  veiculos: z
    .array(
      z.object({
        id: z.string(),
        categoria: z.enum(['vuc', 'toco', 'truck']),
        janela: z.tuple([z.string(), z.string()]),
      }),
    )
    .optional(),
  fonte_localizacao: z.string(),
});
export const parceirosSchema = z.object({
  aviso: z.string(),
  parceiros: z.array(parceiroSchema),
});
export type Parceiro = z.infer<typeof parceiroSchema>;

export const relatosSchema = z.object({
  aviso: z.string(),
  relatos: z.array(
    z.object({
      id: z.string(),
      local: z.string(),
      texto: z.string(),
      selo: z.literal('relato ilustrativo'),
    }),
  ),
});

export const cartaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descricao: z.string(),
  area: z.enum(['administracao', 'comercio', 'logistica', 'producao', 'lider']),
  severidade: z.enum(['atencao', 'alerta', 'critico']),
  inspirado_em: z
    .object({ texto: z.string(), fonte: z.string(), url: z.string().url() })
    .nullable(),
  efeitos: z.array(z.record(z.string(), z.unknown())),
  resposta_sugerida: z.string(),
});
export const cartasSchema = z.object({ aviso: z.string(), cartas: z.array(cartaSchema) });
export type Carta = z.infer<typeof cartaSchema>;

// ── nutrição (TACO) ──────────────────────────────────────────────────────────
export const nutricaoSchema = z.object({ kcal_100g: z.record(z.string(), dadoNumSchema) });
