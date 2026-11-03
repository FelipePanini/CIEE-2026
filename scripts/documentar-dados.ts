/**
 * Atualiza no README a tabela de fontes (indicador → camada → fonte → link → data de referência)
 * e a lista de valores "A CONFIRMAR", a partir de data/*.json.
 * Uso: npx tsx scripts/documentar-dados.ts   (também roda dentro de npm run validar-dados)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { listarJson } from './lib/arquivos.ts';

const RAIZ = process.cwd();
const DATA = join(RAIZ, 'data');
const ROTULO: Record<string, string> = {
  HISTORICO: 'HISTÓRICO',
  ATUAL: 'ATUAL',
  PREVISAO: 'PREVISÃO',
  SIMULADO: 'SIMULADO',
};

interface Linha {
  arquivo: string;
  indicador: string;
  camada: string;
  fonte: string;
  url: string | null;
  ref: string;
  valor: unknown;
}

function coletar(): Linha[] {
  const out: Linha[] = [];
  for (const arq of listarJson(DATA)) {
    const rel = relative(DATA, arq).replaceAll('\\', '/');
    if (rel.startsWith('simulado/') || rel === 'series-rios.json') continue;
    const json = JSON.parse(readFileSync(arq, 'utf8')) as unknown;
    const andar = (v: unknown, caminho: string, rotulo: string) => {
      if (Array.isArray(v)) v.forEach((x, i) => andar(x, `${caminho}[${i}]`, rotulo));
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        const nome = (o.nome ?? o.rotulo ?? o.titulo ?? o.id) as string | undefined;
        if ('camada' in o && 'fonte' in o && 'valor' in o) {
          out.push({
            arquivo: rel,
            indicador: rotulo || caminho,
            camada: String(o.camada),
            fonte: String(o.fonte),
            url: (o.url as string) ?? null,
            ref: String(o.data_referencia),
            valor: o.valor,
          });
          return;
        }
        for (const [k, x] of Object.entries(o))
          andar(x, `${caminho}.${k}`, [nome ?? rotulo, k].filter(Boolean).join(' › '));
      }
    };
    andar(json, '', '');
  }
  return out;
}

const esc = (s: string) => s.replaceAll('|', '/').replaceAll('\n', ' ');

export function documentar(): void {
  const linhas = coletar();
  const vistos = new Set<string>();
  const tabela = [
    '| Indicador | Camada | Fonte | Link | Data de referência |',
    '|---|---|---|---|---|',
    ...linhas
      .filter((l) => {
        const k = `${l.fonte}|${l.indicador.split(' › ').slice(-1)[0]}`;
        if (vistos.has(k)) return false;
        vistos.add(k);
        return true;
      })
      .map(
        (l) =>
          `| ${esc(l.indicador)} (\`${l.arquivo}\`) | ${ROTULO[l.camada] ?? l.camada} | ${esc(l.fonte)} | ${l.url ? `[link](${l.url})` : '—'} | ${l.ref} |`,
      ),
  ].join('\n');
  const pend = linhas.filter((l) => l.valor === 'A CONFIRMAR');
  const lista = pend.length
    ? pend
        .map(
          (l) =>
            `- **${esc(l.indicador)}** (\`${l.arquivo}\`) — conferir em: ${esc(l.fonte)}${l.url ? ` ([link](${l.url}))` : ''}`,
        )
        .join('\n')
    : '- Nenhum valor pendente.';
  const readme = join(RAIZ, 'README.md');
  let s = readFileSync(readme, 'utf8');
  const trocar = (marca: string, conteudo: string) => {
    const ini = `<!-- ${marca}:inicio -->`;
    const fim = `<!-- ${marca}:fim -->`;
    const a = s.indexOf(ini);
    const b = s.indexOf(fim);
    if (a < 0 || b < 0) return;
    s = s.slice(0, a + ini.length) + '\n\n' + conteudo + '\n\n' + s.slice(b);
  };
  trocar('fontes', tabela);
  trocar('a-confirmar', lista);
  writeFileSync(readme, s);
  console.log(
    `✓ README: ${vistos.size} linhas na tabela de fontes, ${pend.length} itens A CONFIRMAR`,
  );
}

if (process.argv[1]?.endsWith('documentar-dados.ts')) documentar();
