/**
 * Arquitetura do sistema em 4 camadas (Fontes → Dados → Motor → Telas) com as contagens reais:
 * inventário dos JSONs (src/engine/inventario.ts) e contagem do código feita no build (vite.config.ts).
 * Usado pelos Bastidores em 3D e pelo equivalente 2D na tela Fontes — sem depender do three.js.
 */
import { DADOS } from '../../data/carregar';
import { inventariar } from '../../engine/inventario';
import { MODULOS } from '../registro';

export const INVENTARIO = inventariar(DADOS);
const ARQ = __ARQUITETURA__;

/** Função (não constante) para evitar o ciclo registro → TelaFontes → arquitetura no carregamento. */
export const camadasArquitetura = () =>
  [
    {
      id: 'fontes',
      nome: 'Fontes',
      cor: '#8cc7c5',
      linhas: [
        `${INVENTARIO.urls} links · ${INVENTARIO.dominios.length} domínios`,
        'ANA · Defesa Civil RS · IBGE · INMET · DIEESE · OSM',
      ],
    },
    {
      id: 'dados',
      nome: 'Dados',
      cor: '#f3efe6',
      linhas: [
        `${INVENTARIO.arquivos} JSONs · ${INVENTARIO.dados} números com fonte`,
        `${INVENTARIO.aConfirmar} A CONFIRMAR · validados no CI (zod)`,
      ],
    },
    {
      id: 'motor',
      nome: 'Motor',
      cor: '#ef6a4b',
      linhas: [
        `${ARQ.modulosMotor} módulos puros · ${ARQ.testes} testes (Vitest)`,
        'urgência · Dijkstra + 2-opt · custos · produção',
      ],
    },
    {
      id: 'telas',
      nome: 'Telas',
      cor: '#c6b4e6',
      linhas: [
        `${MODULOS.length} telas · ${ARQ.componentes3d} componentes 3D`,
        'um único Canvas · fallback 2D completo',
      ],
    },
  ] as const;
