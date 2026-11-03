/**
 * GET /api/niveis — função serverless da Vercel.
 * Busca a leitura mais recente da telemetria da ANA (Taquari em Estrela/Lajeado e Guaíba no Cais Mauá)
 * no servidor, contornando o CORS do serviço, e devolve cada nível no formato Dado (Regra nº 1).
 * Cache na borda por 10 min (s-maxage) + 1 h servindo o último valor enquanto revalida.
 * Se a ANA falhar, responde 502 e o app continua com o último JSON publicado (data/rios.json).
 * Nenhuma chave de API é necessária; se um dia for, ela fica só nas variáveis de ambiente da Vercel.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  dadoNivelAtual,
  ESTACOES_ANA,
  lerTelemetria,
  ultimaLeitura,
  urlTelemetria,
  type IdEstacao,
} from '../scripts/lib/ana.js';

type Buscar = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export interface RespostaNiveis {
  ok: boolean;
  consultado_em: string;
  estacoes: Partial<Record<IdEstacao, ReturnType<typeof dadoNivelAtual>>>;
  erros: { estacao: IdEstacao; erro: string }[];
}

export async function buscarNiveis(
  buscar: Buscar = fetch,
  agora = new Date(),
  timeoutMs = 8000,
): Promise<RespostaNiveis> {
  const inicio = new Date(agora.getTime() - 3 * 86_400_000);
  const consulta = agora.toISOString().slice(0, 10);
  const ids = Object.keys(ESTACOES_ANA) as IdEstacao[];
  const lidos = await Promise.allSettled(
    ids.map(async (id) => {
      const url = urlTelemetria(ESTACOES_ANA[id].codigo, inicio, agora);
      const r = await buscar(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ult = ultimaLeitura(lerTelemetria(await r.text()));
      if (!ult) throw new Error('sem leitura nos últimos 3 dias');
      return dadoNivelAtual(id, ult, url, consulta);
    }),
  );
  const estacoes: RespostaNiveis['estacoes'] = {};
  const erros: RespostaNiveis['erros'] = [];
  lidos.forEach((r, i) => {
    const id = ids[i]!;
    if (r.status === 'fulfilled') estacoes[id] = r.value;
    else erros.push({ estacao: id, erro: String((r.reason as Error)?.message ?? r.reason) });
  });
  return {
    ok: Object.keys(estacoes).length > 0,
    consultado_em: agora.toISOString(),
    estacoes,
    erros,
  };
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const corpo = await buscarNiveis();
  res.setHeader(
    'Cache-Control',
    corpo.ok ? 'public, s-maxage=600, stale-while-revalidate=3600' : 'public, s-maxage=60',
  );
  res.status(corpo.ok ? 200 : 502).json(corpo);
}
