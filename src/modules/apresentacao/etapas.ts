/**
 * Roteiro do Modo Apresentação: 13 etapas na ordem do pitch. Cada etapa só diz QUAL tela/cenário
 * mostrar — a câmera viaja para o preset da tela no mesmo mundo 3D (sem troca de página) e os números
 * vêm do motor/JSON, com fonte no tooltip.
 */
import type { CenarioId } from '../../engine/cenarios';

export interface Etapa {
  id: string;
  /** rótulo curto da trilha de progresso */
  rotulo: string;
  titulo: string;
  frase: string;
  tela: string;
  cenario: CenarioId;
  /** Carta de Crise disparada ao entrar (e desfeita ao sair da etapa) */
  carta?: string;
  /** movimento especial de câmera */
  camera?: 'abertura' | 'encerramento';
}

export const ETAPAS: Etapa[] = [
  {
    id: 'abertura',
    rotulo: 'Abertura',
    titulo: 'Maio de 2024',
    frase: 'A água do Guaíba e do Taquari subiu até o maior pico já medido.',
    tela: 'panorama',
    cenario: 'case',
    camera: 'abertura',
  },
  {
    id: 'linha-do-tempo',
    rotulo: 'Linha do tempo',
    titulo: 'A enchente não acabou em 2024',
    frase: 'A crise mudou de lugar — da Região Metropolitana para o Vale do Taquari.',
    tela: 'linha-do-tempo',
    cenario: 'case',
  },
  {
    id: 'atual',
    rotulo: 'Crise atual',
    titulo: 'A crise agora',
    frase: 'Os boletins mais recentes da Defesa Civil no mapa 3D da bacia.',
    tela: 'panorama',
    cenario: 'atual',
  },
  {
    id: 'urgencia',
    rotulo: 'Urgência',
    titulo: 'O que falta primeiro',
    frase: 'A altura da pilha é o número de dias de cobertura: a água acaba antes do papel.',
    tela: 'urgencia',
    cenario: 'case',
  },
  {
    id: 'arrecadacao',
    rotulo: 'Arrecadação',
    titulo: 'Onde arrecadar e o quê',
    frase: 'A meta de cada ponto de coleta nasce da urgência dos abrigos.',
    tela: 'arrecadacao',
    cenario: 'case',
  },
  {
    id: 'rotas',
    rotulo: 'Rotas',
    titulo: 'Como chega',
    frase: 'Menor caminho na malha viária real; se uma via fecha, a rota se redesenha.',
    tela: 'rotas',
    cenario: 'case',
  },
  {
    id: 'quadra',
    rotulo: 'Quadra',
    titulo: 'A linha de montagem',
    frase: 'A quadra anda na velocidade da zona mais lenta — o gargalo pisca.',
    tela: 'quadra',
    cenario: 'case',
  },
  {
    id: 'gastos',
    rotulo: 'Gastos',
    titulo: 'Quanto custa',
    frase: 'Cada item do kit com preço e fonte: de onde vem cada real.',
    tela: 'gastos',
    cenario: 'case',
  },
  {
    id: 'parceiros',
    rotulo: 'Parceiros',
    titulo: 'Quem ajuda',
    frase: 'O item crítico encontra o parceiro mais próximo com o recurso.',
    tela: 'parceiros',
    cenario: 'case',
  },
  {
    id: 'carta',
    rotulo: 'Carta de Crise',
    titulo: 'Carta de Crise ao vivo',
    frase: 'Um evento real de 2024 cai na mesa — e o sistema inteiro recalcula.',
    tela: 'rotas',
    cenario: 'case',
    carta: 'br116-canoas',
  },
  {
    id: 'prontidao',
    rotulo: 'Prontidão',
    titulo: 'A próxima cheia já tem previsão',
    frase: 'Estoque pré-posicionado antes da chuva custa menos que a compra de emergência.',
    tela: 'panorama',
    cenario: 'prontidao',
  },
  {
    id: 'bastidores',
    rotulo: 'Bastidores',
    titulo: 'Como o sistema é organizado',
    frase: 'Fontes → Dados → Motor → Telas. Todo número na tela tem origem.',
    tela: 'fontes',
    cenario: 'case',
  },
  {
    id: 'encerramento',
    rotulo: 'Encerramento',
    titulo: 'Liderar é transformar coordenação em confiança.',
    frase: 'Da resposta à prontidão — Solução Distribuidora · Ação Social RS.',
    tela: 'panorama',
    cenario: 'case',
    camera: 'encerramento',
  },
];
