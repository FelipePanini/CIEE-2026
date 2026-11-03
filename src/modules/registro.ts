import type { ComponentType } from 'react';
import { Painel2DPanorama } from './panorama/Painel2D';
import { Painel2DLinhaDoTempo } from './linha-do-tempo/Painel2D';
import { Painel2DArrecadacao, Painel2DUrgencia } from './urgencia/Painel2D';
import { Painel2DRotas } from './rotas/Painel2D';
import { Painel2DQuadra } from './quadra/Painel2D';
import { Painel2DGastos } from './gastos/Painel2D';
import { Painel2DAdministracao } from './administracao/Painel2D';
import { Painel2DParceiros } from './parceiros/Painel2D';
import { TelaFontes } from './fontes/TelaFontes';
import type { Area } from '../ui/blocos';

export interface Modulo {
  id: string;
  rotulo: string;
  icone: string;
  area: Area;
  pergunta: string;
  Painel2D: ComponentType;
}

/** Ordem da navegação. Cada módulo tem um Painel2D (fallback completo) e, a partir da fase 4, uma cena 3D. */
export const MODULOS: Modulo[] = [
  {
    id: 'panorama',
    rotulo: 'Panorama',
    icone: '🗺',
    area: 'geral',
    pergunta: 'onde falta',
    Painel2D: Painel2DPanorama,
  },
  {
    id: 'linha-do-tempo',
    rotulo: 'Linha do tempo',
    icone: '📈',
    area: 'geral',
    pergunta: 'não foi isolado',
    Painel2D: Painel2DLinhaDoTempo,
  },
  {
    id: 'urgencia',
    rotulo: 'Urgência',
    icone: '🌡',
    area: 'comercio',
    pergunta: 'o que falta',
    Painel2D: Painel2DUrgencia,
  },
  {
    id: 'arrecadacao',
    rotulo: 'Arrecadação',
    icone: '🛒',
    area: 'comercio',
    pergunta: 'onde falta',
    Painel2D: Painel2DArrecadacao,
  },
  {
    id: 'rotas',
    rotulo: 'Rotas',
    icone: '🚚',
    area: 'logistica',
    pergunta: 'como chega',
    Painel2D: Painel2DRotas,
  },
  {
    id: 'quadra',
    rotulo: 'Quadra',
    icone: '📦',
    area: 'producao',
    pergunta: 'como chega',
    Painel2D: Painel2DQuadra,
  },
  {
    id: 'gastos',
    rotulo: 'Gastos',
    icone: 'R$',
    area: 'administracao',
    pergunta: 'quanto custa',
    Painel2D: Painel2DGastos,
  },
  {
    id: 'administracao',
    rotulo: 'Administração',
    icone: '⏱',
    area: 'administracao',
    pergunta: 'prazos',
    Painel2D: Painel2DAdministracao,
  },
  {
    id: 'parceiros',
    rotulo: 'Parceiros',
    icone: '🤝',
    area: 'comercio',
    pergunta: 'quem ajuda',
    Painel2D: Painel2DParceiros,
  },
  {
    id: 'fontes',
    rotulo: 'Fontes',
    icone: 'ⓘ',
    area: 'geral',
    pergunta: 'de onde vem',
    Painel2D: TelaFontes,
  },
];

export const moduloPorId = (id: string) => MODULOS.find((m) => m.id === id) ?? MODULOS[0]!;
