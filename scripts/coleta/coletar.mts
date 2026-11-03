/**
 * Coleta bruta: baixa cada alvo de alvos.ts para data/brutos/ e escreve data/brutos/manifesto.json.
 * Uso: npx tsx scripts/coleta/coletar.mts [filtro-de-id]
 * Pensado para rodar na GitHub Action "coleta-bruta" (internet aberta). Falhas não interrompem a coleta.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ALVOS } from './alvos.mts';

const DIR = join(process.cwd(), 'data', 'brutos');
mkdirSync(DIR, { recursive: true });

interface Registro {
  id: string;
  url: string;
  status: number | 'erro';
  bytes: number;
  sha256: string | null;
  arquivo: string | null;
  data_consulta: string;
  erro?: string;
  nota?: string;
}

const filtro = process.argv[2] ?? process.env.FILTRO_COLETA;
const manifestoPath = join(DIR, 'manifesto.json');
const anterior: Record<string, Registro> = existsSync(manifestoPath)
  ? JSON.parse(readFileSync(manifestoPath, 'utf8'))
  : {};

const UA = 'CentralDeComando-AcaoSocialRS/0.1 (projeto educacional CIEE; coleta de dados publicos)';

async function baixar(alvo: (typeof ALVOS)[number]): Promise<Registro> {
  const base = {
    id: alvo.id,
    url: alvo.url,
    data_consulta: new Date().toISOString(),
    ...(alvo.nota ? { nota: alvo.nota } : {}),
  };
  const urls = [alvo.url, ...(alvo.espelhos ?? [])];
  let ultimoErro: Registro | null = null;
  for (const url of urls) {
    const r = await tentar(alvo, url, base);
    if (typeof r.status === 'number' && r.status < 500 && r.status !== 429) return r;
    ultimoErro = r;
    await new Promise((ok) => setTimeout(ok, 8000));
  }
  return ultimoErro!;
}

async function tentar(
  alvo: (typeof ALVOS)[number],
  url: string,
  base: Omit<Registro, 'status' | 'bytes' | 'sha256' | 'arquivo'>,
): Promise<Registro> {
  try {
    const res = await fetch(url, {
      method: alvo.metodo ?? 'GET',
      headers: {
        'User-Agent': UA,
        ...(alvo.corpo ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        ...alvo.cabecalhos,
      },
      body: alvo.corpo,
      signal: AbortSignal.timeout(120_000),
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const sha256 = createHash('sha256').update(buf).digest('hex');
    let arquivo: string | null = null;
    if (res.ok) {
      if (alvo.tipo === 'pdf') {
        const tmp = join(DIR, `${alvo.id}.pdf`);
        writeFileSync(tmp, buf);
        try {
          execFileSync('pdftotext', ['-layout', tmp, join(DIR, `${alvo.id}.txt`)]);
          arquivo = `${alvo.id}.txt`;
        } finally {
          unlinkSync(tmp);
        }
      } else {
        arquivo = `${alvo.id}.${alvo.tipo}`;
        writeFileSync(join(DIR, arquivo), buf);
      }
    }
    return { ...base, url, status: res.status, bytes: buf.length, sha256, arquivo };
  } catch (e) {
    return { ...base, status: 'erro', bytes: 0, sha256: null, arquivo: null, erro: String(e) };
  }
}

const forcar = process.env.FORCAR_COLETA === '1';
const manifesto: Record<string, Registro> = { ...anterior };
for (const alvo of ALVOS.filter((a) => !filtro || a.id.includes(filtro))) {
  // Por padrão só baixa o que ainda não foi obtido com sucesso (FORCAR_COLETA=1 refaz tudo).
  if (!forcar && [200, 206].includes(anterior[alvo.id]?.status as number)) continue;
  const r = await baixar(alvo);
  // Nunca substitui uma coleta bem-sucedida por uma falha.
  if (![200, 206].includes(r.status as number) && [200, 206].includes(anterior[alvo.id]?.status as number)) {
    console.log(`mantido ${alvo.id} (nova tentativa: ${r.status})`);
    continue;
  }
  manifesto[alvo.id] = r;
  console.log(`${String(r.status).padEnd(5)} ${String(r.bytes).padStart(9)} B  ${alvo.id}${r.erro ? '  ' + r.erro : ''}`);
  // Overpass pede intervalo entre consultas
  if (alvo.url.includes('overpass')) await new Promise((ok) => setTimeout(ok, 5000));
}
writeFileSync(manifestoPath, JSON.stringify(manifesto, null, 2) + '\n');
