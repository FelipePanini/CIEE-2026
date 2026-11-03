/**
 * npm run atualizar-dados
 *
 * 1. Busca a telemetria da ANA (Taquari em Estrela/Lajeado e Guaíba no Cais Mauá) dos últimos 125 dias
 *    e atualiza data/series-rios.json (série ATUAL) e data/rios.json (nivel_atual).
 * 2. Lê a página de avisos da Defesa Civil RS e lista os avisos/alertas mais recentes.
 * 3. Gera docs/checklist-atualizacao.md com o que precisa ser conferido à mão (boletins em PDF,
 *    DIEESE do mês, tabela ANTT, abrigos) — fontes sem API.
 * 4. Registra a data/hora em data/meta.json.
 *
 * Opções:
 *   --brutos   usa os arquivos de data/brutos/ (coleta-bruta) em vez da rede
 *   --sem-rede só regenera o checklist e o meta
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ESTACOES_ANA,
  lerTelemetria,
  maximoDiario,
  ultimaLeitura,
  urlTelemetria,
  type IdEstacao,
  type Leitura,
} from './lib/ana.ts';

const RAIZ = process.cwd();
const DATA = join(RAIZ, 'data');
const args = new Set(process.argv.slice(2));
const usarBrutos = args.has('--brutos');
const semRede = args.has('--sem-rede');
const hoje = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);

type Json = Record<string, unknown>;
const ler = <T = Json>(arq: string): T => JSON.parse(readFileSync(join(DATA, arq), 'utf8')) as T;
const gravar = (arq: string, obj: unknown) =>
  writeFileSync(join(DATA, arq), JSON.stringify(obj, null, 2) + '\n');

const BRUTOS: Record<IdEstacao, string> = {
  'taquari-lajeado': 'ana-telemetria-86879300-estrela.xml',
  'guaiba-cais-maua': 'ana-telemetria-87450004-caismaua-2026.xml',
};

async function baixar(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'CentralDeComando-AcaoSocialRS/0.1 (projeto educacional CIEE)' },
    signal: AbortSignal.timeout(90_000),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.text();
}

interface Resultado {
  estacao: IdEstacao;
  url: string;
  leituras: Leitura[];
}

async function telemetria(): Promise<Resultado[]> {
  const fim = hoje;
  const inicio = new Date(hoje.getTime() - 125 * 86_400_000);
  const out: Resultado[] = [];
  for (const [id, est] of Object.entries(ESTACOES_ANA) as [
    IdEstacao,
    (typeof ESTACOES_ANA)[IdEstacao],
  ][]) {
    const url = urlTelemetria(est.codigo, inicio, fim);
    try {
      const xml = usarBrutos
        ? readFileSync(join(DATA, 'brutos', BRUTOS[id]), 'utf8')
        : await baixar(url);
      const leituras = lerTelemetria(xml);
      if (!leituras.length) throw new Error('sem leituras');
      const urlFonte = usarBrutos
        ? (ler<Record<string, { url: string }>>('brutos/manifesto.json')[
            BRUTOS[id].replace('.xml', '')
          ]?.url ?? url)
        : url;
      out.push({ estacao: id, url: urlFonte, leituras });
      console.log(
        `✓ ANA ${est.codigo}: ${leituras.length} leituras, última ${ultimaLeitura(leituras)?.dataHora}`,
      );
    } catch (e) {
      console.warn(`✗ ANA ${est.codigo}: ${String(e)} — mantido o último JSON salvo`);
    }
  }
  return out;
}

function atualizarRios(res: Resultado[]): void {
  if (!res.length) return;
  const rios = ler<{ estacoes: Json[] }>('rios.json');
  const series = ler<{ series: Json[] }>('series-rios.json');
  for (const r of res) {
    const ult = ultimaLeitura(r.leituras)!;
    const est = rios.estacoes.find((e) => e.id === r.estacao);
    if (est) {
      est.nivel_atual = {
        valor: ult.nivel_m,
        unidade: 'm',
        fonte: `ANA — telemetria ${ESTACOES_ANA[r.estacao].nome}, leitura de ${ult.dataHora.slice(8, 10)}/${ult.dataHora.slice(5, 7)}/${ult.dataHora.slice(0, 4)} ${ult.dataHora.slice(11, 16)}`,
        url: r.url,
        data_referencia: ult.dataHora.replace(' ', 'T').slice(0, 16),
        data_consulta: iso(hoje),
        camada: 'ATUAL',
        nota: 'Leitura telemétrica mais recente disponível (dado bruto, sujeito a consistência pela ANA/SGB).',
      };
    }
    const id = `${r.estacao}-recente`;
    const serie = {
      estacao: r.estacao,
      codigo_ana: ESTACOES_ANA[r.estacao].codigo,
      rotulo: 'Últimos 125 dias',
      camada: 'ATUAL',
      fonte: `ANA — telemetria ${ESTACOES_ANA[r.estacao].nome}`,
      url: r.url,
      data_consulta: iso(hoje),
      unidade: 'm',
      agregacao: 'máximo diário',
      pontos: maximoDiario(r.leituras),
      id,
    };
    const i = series.series.findIndex((s) => s.id === id);
    if (i >= 0) series.series[i] = serie;
    else series.series.push(serie);
  }
  gravar('rios.json', rios);
  gravar('series-rios.json', series);
}

const ENTIDADES: Record<string, string> = {
  amp: '&',
  quot: '"',
  nbsp: ' ',
  ccedil: 'ç',
  Ccedil: 'Ç',
  atilde: 'ã',
  otilde: 'õ',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  acirc: 'â',
  ecirc: 'ê',
  ocirc: 'ô',
  agrave: 'à',
  Aacute: 'Á',
  Eacute: 'É',
};
const decodificar = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&([a-zA-Z]+);/g, (m, n: string) => ENTIDADES[n] ?? m);

async function avisosDefesaCivil(): Promise<{ data: string; titulo: string; url: string }[]> {
  try {
    const html = usarBrutos
      ? readFileSync(join(DATA, 'brutos', 'defesacivil-home.html'), 'utf8')
      : await baixar('https://www.defesacivil.rs.gov.br/');
    const itens: { data: string; titulo: string; url: string }[] = [];
    const re =
      /(\d{2}\/\d{2}\/\d{4}) - (\d{2})h(\d{2})min[\s\S]{0,1500}?href="(\/defesa-civil-[^"]+)"[^>]*>\s*([^<]{10,200})</g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && itens.length < 12) {
      const url = 'https://www.defesacivil.rs.gov.br' + m[4];
      const titulo = decodificar(m[5]!.trim());
      if (!titulo || itens.some((x) => x.url === url)) continue;
      itens.push({ data: `${m[1]} ${m[2]}:${m[3]}`, titulo, url });
    }
    return itens;
  } catch (e) {
    console.warn(`✗ Defesa Civil: ${String(e)}`);
    return [];
  }
}

function checklist(
  avisos: { data: string; titulo: string; url: string }[],
  res: Resultado[],
): void {
  const eventos = ler<{
    eventos: {
      id: string;
      nome: string;
      indicadores: Record<string, { valor: unknown; data_referencia: string }>;
    }[];
  }>('eventos.json');
  const ultimoEvento = eventos.eventos[eventos.eventos.length - 1]!;
  const precos = ler<{ cesta_dieese_total: { data_referencia: string } }>('precos.json');
  const linhas = [
    '# Checklist de atualização dos dados',
    '',
    `Gerado por \`npm run atualizar-dados\` em ${hoje.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
    '',
    '## Automático (feito pelo script)',
    '',
    ...(res.length
      ? res.map((r) => {
          const u = ultimaLeitura(r.leituras)!;
          return `- [x] Nível atual — ${ESTACOES_ANA[r.estacao].nome}: **${u.nivel_m.toFixed(2)} m** em ${u.dataHora} ([fonte](${r.url}))`;
        })
      : ['- [ ] Telemetria da ANA indisponível nesta execução — o app usa o último JSON salvo.']),
    '',
    '## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)',
    '',
    ...(avisos.length
      ? avisos.map((a) => `- ${a.data} — [${a.titulo}](${a.url})`)
      : ['- (não foi possível ler a página — abrir manualmente)']),
    '',
    '## Manual (fontes sem API — conferir e editar o JSON correspondente)',
    '',
    `- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → \`data/eventos.json\`. Último evento registrado: _${ultimoEvento.nome}_ (municípios afetados com referência ${ultimoEvento.indicadores.municipios_afetados?.data_referencia}). https://www.defesacivil.rs.gov.br/avisos-e-boletins`,
    '- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).',
    '- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/',
    `- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: ${precos.cesta_dieese_total.data_referencia}) → \`data/precos.json\`. https://www.dieese.org.br/cesta/`,
    '- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/',
    '- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas',
    '- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.',
    '- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.',
    '',
  ];
  writeFileSync(join(RAIZ, 'docs', 'checklist-atualizacao.md'), linhas.join('\n'));
}

async function main() {
  const res = semRede ? [] : await telemetria();
  atualizarRios(res);
  const avisos = semRede ? [] : await avisosDefesaCivil();
  checklist(avisos, res);
  const meta = ler('meta.json');
  meta.ultima_atualizacao = new Date().toISOString();
  gravar('meta.json', meta);
  console.log('✓ meta.json, docs/checklist-atualizacao.md atualizados');
  if (!existsSync(join(DATA, 'series-rios.json'))) console.warn('series-rios.json ausente');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
