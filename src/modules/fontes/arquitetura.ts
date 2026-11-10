/**
 * Arquitetura do sistema em 4 camadas (Fontes → Dados → Motor → Telas) com as contagens reais:
 * inventário dos JSONs (src/engine/inventario.ts) e contagem do código feita no build (vite.config.ts).
 * Usado pelos Bastidores em 3D e pelo equivalente 2D na tela Fontes — sem depender do three.js.
 */
import { DADOS } from '../../data/carregar';
import { inventariar } from '../../engine/inventario';
import { MODULOS } from '../registro';
import { cor } from '../../ui/cores';

export const INVENTARIO = inventariar(DADOS);
const ARQ = __ARQUITETURA__;

/** Função (não constante) para evitar o ciclo registro → TelaFontes → arquitetura no carregamento. */
export const camadasArquitetura = () =>
  [
    {
      id: 'fontes',
      nome: 'Fontes',
      cor: cor('cinza-4'),
      linhas: [
        `${INVENTARIO.urls} links · ${INVENTARIO.dominios.length} domínios`,
        'ANA · Defesa Civil RS · IBGE · INMET · DIEESE · OSM',
      ],
    },
    {
      id: 'dados',
      nome: 'Dados',
      cor: cor('cinza-3'),
      linhas: [
        `${INVENTARIO.arquivos} JSONs · ${INVENTARIO.dados} números com fonte`,
        `${INVENTARIO.aConfirmar} A CONFIRMAR · validados no CI (zod)`,
      ],
    },
    {
      id: 'motor',
      nome: 'Motor',
      cor: cor('cinza-2'),
      linhas: [
        `${ARQ.modulosMotor} módulos puros · ${ARQ.testes} testes (Vitest)`,
        'urgência · Dijkstra + 2-opt · custos · produção',
      ],
    },
    {
      id: 'telas',
      nome: 'Telas',
      cor: cor('cinza-1'),
      linhas: [
        `${MODULOS.length} telas · ${ARQ.componentes3d} componentes 3D`,
        'um único Canvas · fallback 2D completo',
      ],
    },
  ] as const;
