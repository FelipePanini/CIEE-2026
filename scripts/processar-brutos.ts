/**
 * Transforma a coleta bruta (data/brutos/) nos JSONs de séries históricas dos rios.
 * Roda uma vez por coleta: npx tsx scripts/processar-brutos.ts
 * (as séries recentes são mantidas por scripts/atualizar-dados.ts)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ESTACOES_ANA, lerTelemetria, maximoDiario, type IdEstacao } from './lib/ana.ts';

const DATA = join(process.cwd(), 'data');
const manifesto = JSON.parse(
  readFileSync(join(DATA, 'brutos', 'manifesto.json'), 'utf8'),
) as Record<string, { url: string; data_consulta: string }>;

const HISTORICAS: {
  id: string;
  estacao: IdEstacao;
  bruto: string;
  rotulo: string;
  nota?: string;
}[] = [
  {
    id: 'guaiba-cais-maua-2024',
    estacao: 'guaiba-cais-maua',
    bruto: 'ana-telemetria-87450004-caismaua-2024',
    rotulo: 'Enchente de 2024 (telemetria até falhar em 02/05)',
  },
  {
    id: 'guaiba-cais-maua-2025',
    estacao: 'guaiba-cais-maua',
    bruto: 'ana-telemetria-87450004-caismaua-2025',
    rotulo: 'Cheia de junho/2025',
  },
  {
    id: 'taquari-lajeado-2024',
    estacao: 'taquari-lajeado',
    bruto: 'ana-telemetria-86879300-estrela-2024',
    rotulo: 'Enchente de 2024',
  },
  {
    id: 'taquari-lajeado-2025',
    estacao: 'taquari-lajeado',
    bruto: 'ana-telemetria-86879300-estrela-2025',
    rotulo: 'Cheia de junho/2025',
  },
];

const arq = join(DATA, 'series-rios.json');
const atual = existsSync(arq)
  ? (JSON.parse(readFileSync(arq, 'utf8')) as { series: { id: string }[] })
  : { series: [] };
const outras = atual.series.filter((s) => !HISTORICAS.some((h) => h.id === s.id));
const series = HISTORICAS.map((h) => {
  const m = manifesto[h.bruto]!;
  const l = lerTelemetria(readFileSync(join(DATA, 'brutos', `${h.bruto}.xml`), 'utf8'));
  return {
    id: h.id,
    estacao: h.estacao,
    codigo_ana: ESTACOES_ANA[h.estacao].codigo,
    rotulo: h.rotulo,
    camada: 'HISTORICO',
    fonte: `ANA — telemetria ${ESTACOES_ANA[h.estacao].nome}`,
    url: m.url,
    data_consulta: m.data_consulta.slice(0, 10),
    unidade: 'm',
    agregacao: 'máximo diário',
    pontos: maximoDiario(l),
  };
});
writeFileSync(arq, JSON.stringify({ series: [...series, ...outras] }, null, 2) + '\n');
console.log(`✓ ${series.length} séries históricas em data/series-rios.json`);
