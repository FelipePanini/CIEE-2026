/** Papéis do organograma da operação, conforme o Diário de Bordo do Estudo Dirigido (docs/referencia). */
import { cor } from '../../ui/cores';
export type AreaOrg = 'lider' | 'administracao' | 'comercio' | 'logistica' | 'producao';

export interface Papel {
  id: string;
  area: AreaOrg;
  titulo: string;
}

export const AREAS_ORG: { id: AreaOrg; nome: string; missao: string }[] = [
  {
    id: 'lider',
    nome: 'Líder do Projeto',
    missao:
      'Monitora prazos, faz a comunicação entre os setores, resolve conflitos e lidera a apresentação.',
  },
  {
    id: 'administracao',
    nome: 'Administração',
    missao: 'Planejamento tático, cronograma, comunicação e relatórios.',
  },
  {
    id: 'comercio',
    nome: 'Comércio e Varejo',
    missao: 'Captação e coleta nos pontos de venda parceiros.',
  },
  { id: 'logistica', nome: 'Logística', missao: 'Roteirização, transporte e entrega final.' },
  { id: 'producao', nome: 'Produção', missao: 'Espaço, triagem e montagem dos kits.' },
];

export const PAPEIS: Papel[] = [
  { id: 'lider', area: 'lider', titulo: 'Líder do Projeto' },
  { id: 'adm-planejamento', area: 'administracao', titulo: 'Coordenador de Planejamento e Prazos' },
  {
    id: 'adm-comunicacao',
    area: 'administracao',
    titulo: 'Responsável pela Comunicação e Divulgação',
  },
  { id: 'com-coleta', area: 'comercio', titulo: 'Coordenador de Coleta' },
  { id: 'com-parcerias', area: 'comercio', titulo: 'Responsável pelas Parcerias com PDVs' },
  { id: 'com-atendente', area: 'comercio', titulo: 'Atendente de Ponto de Doação' },
  { id: 'log-transportes', area: 'logistica', titulo: 'Coordenador de Transportes' },
  { id: 'log-roteirizacao', area: 'logistica', titulo: 'Responsável por Roteirização' },
  { id: 'log-distribuicao', area: 'logistica', titulo: 'Encarregado da Distribuição Final' },
  { id: 'pro-layout', area: 'producao', titulo: 'Coordenador de Layout e Quadra' },
  { id: 'pro-triagem', area: 'producao', titulo: 'Responsável pela Triagem/Conferência' },
  { id: 'pro-montagem', area: 'producao', titulo: 'Líder da Linha de Montagem' },
];

/** Cronograma de 4 horas do case (slides e Diário de Bordo). */
export const CRONOGRAMA = [
  {
    id: 'alinhamento',
    nome: 'Alinhamento',
    minutos: 30,
    entrega: 'Eleição do líder e diretrizes gerais',
    cor: cor('cinza-4'),
  },
  {
    id: 'planejamento',
    nome: 'Planejamento',
    minutos: 30,
    entrega: 'Organograma + plano de trabalho',
    cor: cor('cinza-3'),
  },
  {
    id: 'producao',
    nome: 'Produção',
    minutos: 105,
    entrega: 'Kits, quadra e rotas',
    cor: cor('cinza-1'),
  },
  {
    id: 'controle',
    nome: 'Controle',
    minutos: 60,
    entrega: 'Revisão, ensaio e banca avaliadora',
    cor: cor('cinza-2'),
  },
] as const;

export const DURACAO_TOTAL_MIN = 240;
