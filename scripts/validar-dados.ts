/**
 * Valida a Regra nº 1 em todos os arquivos de data/:
 *  - cada arquivo segue seu esquema (zod);
 *  - todo objeto com "camada" tem fonte, url (fora de SIMULADO), datas e unidade;
 *  - a camada SIMULADO só aparece em data/simulado/;
 *  - nomes de parceiros são fictícios ("<Tipo> Parceiro(a) X");
 *  - gera docs/a-confirmar.md com a lista de valores "A CONFIRMAR".
 *
 * Uso: npm run validar-dados   (sai com código 1 se houver erro)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { ZodTypeAny } from 'zod';
import * as S from '../src/data/schema.ts';
import { listarJson } from './lib/arquivos.ts';
import { documentar } from './documentar-dados.ts';

const RAIZ = process.cwd();
const DATA = join(RAIZ, 'data');

const ESQUEMAS: Record<string, ZodTypeAny> = {
  'meta.json': S.metaSchema,
  'municipios.json': S.municipiosSchema,
  'eventos.json': S.eventosSchema,
  'rios.json': S.riosSchema,
  'previsao.json': S.previsaoSchema,
  'abrigos.json': S.abrigosSchema,
  'escolas-base.json': S.escolasSchema,
  'precos.json': S.precosSchema,
  'frete.json': S.freteSchema,
  'veiculos.json': S.veiculosSchema,
  'esfera.json': S.esferaSchema,
  'nutricao.json': S.nutricaoSchema,
  'saude.json': S.saudeSchema,
  'orcamento.json': S.orcamentoSchema,
  'rede-viaria.json': S.redeViariaSchema,
  'series-rios.json': S.seriesRiosSchema,
  'simulado/estoques.json': S.estoquesSchema,
  'simulado/parceiros.json': S.parceirosSchema,
  'simulado/relatos.json': S.relatosSchema,
  'simulado/cartas-crise.json': S.cartasSchema,
};

interface Pendencia {
  arquivo: string;
  caminho: string;
  fonte: string;
  nota?: string;
}

function percorrer(
  v: unknown,
  caminho: string,
  visitar: (obj: Record<string, unknown>, caminho: string) => void,
): void {
  if (Array.isArray(v)) v.forEach((x, i) => percorrer(x, `${caminho}[${i}]`, visitar));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    visitar(o, caminho);
    for (const [k, x] of Object.entries(o)) percorrer(x, caminho ? `${caminho}.${k}` : k, visitar);
  }
}

export function validar(): { erros: string[]; pendencias: Pendencia[]; arquivos: number } {
  const erros: string[] = [];
  const pendencias: Pendencia[] = [];
  const arquivos = listarJson(DATA);

  for (const esperado of Object.keys(ESQUEMAS)) {
    if (!arquivos.some((a) => relative(DATA, a) === esperado))
      erros.push(`faltando: data/${esperado}`);
  }

  for (const arq of arquivos) {
    const rel = relative(DATA, arq).replaceAll('\\', '/');
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(arq, 'utf8'));
    } catch (e) {
      erros.push(`${rel}: JSON inválido (${String(e)})`);
      continue;
    }
    const esquema = ESQUEMAS[rel];
    if (!esquema) {
      erros.push(`${rel}: arquivo sem esquema registrado em scripts/validar-dados.ts`);
      continue;
    }
    const r = esquema.safeParse(json);
    if (!r.success) {
      for (const issue of r.error.issues.slice(0, 15)) {
        erros.push(`${rel}: ${issue.path.join('.')} — ${issue.message}`);
      }
    }
    const simulado = rel.startsWith('simulado/');
    percorrer(json, '', (o, caminho) => {
      if (!('camada' in o) || !('fonte' in o)) return;
      if (o.camada === 'SIMULADO' && !simulado)
        erros.push(`${rel}: ${caminho} — SIMULADO fora de data/simulado/`);
      if (o.camada !== 'SIMULADO' && simulado)
        erros.push(`${rel}: ${caminho} — arquivo simulado com camada ${String(o.camada)}`);
      if (o.valor === 'A CONFIRMAR') {
        pendencias.push({
          arquivo: rel,
          caminho,
          fonte: String(o.fonte),
          nota: o.nota as string | undefined,
        });
      }
    });
  }
  return { erros, pendencias, arquivos: arquivos.length };
}

function escreverPendencias(p: Pendencia[]): void {
  const linhas = [
    '# Valores "A CONFIRMAR"',
    '',
    'Gerado por `npm run validar-dados`. Cada item abaixo aparece na interface em amarelo, com o selo da camada,',
    'até ser confirmado na fonte oficial. Não preencha com estimativa: atualize o JSON com valor, fonte, url e datas.',
    '',
    '| Arquivo | Campo | Fonte a consultar | Observação |',
    '|---|---|---|---|',
    ...p.map(
      (x) =>
        `| \`${x.arquivo}\` | \`${x.caminho}\` | ${x.fonte} | ${(x.nota ?? '').replaceAll('|', '/')} |`,
    ),
    '',
  ];
  writeFileSync(join(RAIZ, 'docs', 'a-confirmar.md'), linhas.join('\n'));
}

const executadoDireto =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop()!);
if (executadoDireto) {
  const { erros, pendencias, arquivos } = validar();
  escreverPendencias(pendencias);
  documentar();
  if (erros.length) {
    console.error(`✗ ${erros.length} erro(s) em data/:`);
    for (const e of erros) console.error('  - ' + e);
    process.exit(1);
  }
  console.log(
    `✓ ${arquivos} arquivos válidos · ${pendencias.length} valor(es) A CONFIRMAR (docs/a-confirmar.md)`,
  );
}
