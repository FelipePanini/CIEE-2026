/**
 * Leitura da telemetria pública da ANA (ServiceANA.asmx/DadosHidrometeorologicos).
 * Compartilhado por scripts/atualizar-dados.ts, scripts/processar-brutos.ts e api/niveis.ts.
 * O nível vem em centímetros na régua da estação; convertemos para metros.
 */
export interface Leitura {
  /** "AAAA-MM-DD HH:mm:ss" no horário local da estação (BRT). */
  dataHora: string;
  nivel_m: number;
}

export const ESTACOES_ANA = {
  'taquari-lajeado': { codigo: '86879300', nome: 'Rio Taquari — Estrela/Lajeado (86879300)' },
  'guaiba-cais-maua': { codigo: '87450004', nome: 'Guaíba — Cais Mauá C6 (87450004)' },
} as const;
export type IdEstacao = keyof typeof ESTACOES_ANA;

export const urlTelemetria = (codigo: string, inicio: Date, fim: Date): string => {
  const f = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=${codigo}&dataInicio=${f(inicio)}&dataFim=${f(fim)}`;
};

export function lerTelemetria(xml: string): Leitura[] {
  const out: Leitura[] = [];
  const re = /<DadosHidrometereologicos[^>]*>([\s\S]*?)<\/DadosHidrometereologicos>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const bloco = m[1]!;
    const dh = /<DataHora>([^<]+)<\/DataHora>/.exec(bloco)?.[1]?.trim();
    const nv = /<Nivel>([^<]+)<\/Nivel>/.exec(bloco)?.[1]?.trim();
    if (!dh || !nv) continue;
    const cm = Number(nv);
    if (!Number.isFinite(cm)) continue;
    out.push({ dataHora: dh, nivel_m: Math.round(cm) / 100 });
  }
  return out.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}

/** Máximo diário (AAAA-MM-DD → metros). */
export function maximoDiario(l: Leitura[]): [string, number][] {
  const mapa = new Map<string, number>();
  for (const x of l) {
    const d = x.dataHora.slice(0, 10);
    mapa.set(d, Math.max(mapa.get(d) ?? -Infinity, x.nivel_m));
  }
  return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** Picos acima de um limiar, um por evento (eventos separados por pelo menos `gapDias`). */
export function picosAcima(l: Leitura[], limiar_m: number, gapDias = 3): Leitura[] {
  const picos: Leitura[] = [];
  let atual: Leitura | null = null;
  let ultimoAcima = '';
  const dias = (a: string, b: string) =>
    (Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86_400_000;
  for (const x of l) {
    if (x.nivel_m < limiar_m) continue;
    if (atual && dias(ultimoAcima, x.dataHora) > gapDias) {
      picos.push(atual);
      atual = null;
    }
    if (!atual || x.nivel_m > atual.nivel_m) atual = x;
    ultimoAcima = x.dataHora;
  }
  if (atual) picos.push(atual);
  return picos;
}

export const ultimaLeitura = (l: Leitura[]): Leitura | null => (l.length ? l[l.length - 1]! : null);

/** Dado (Regra nº 1) do nível atual a partir da leitura mais recente — mesmo formato em JSON e na API. */
export function dadoNivelAtual(estacao: IdEstacao, ult: Leitura, url: string, consulta: string) {
  const d = ult.dataHora;
  return {
    valor: ult.nivel_m,
    unidade: 'm',
    fonte: `ANA — telemetria ${ESTACOES_ANA[estacao].nome}, leitura de ${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} ${d.slice(11, 16)}`,
    url,
    data_referencia: d.replace(' ', 'T').slice(0, 16),
    data_consulta: consulta,
    camada: 'ATUAL' as const,
    nota: 'Leitura telemétrica mais recente disponível (dado bruto, sujeito a consistência pela ANA/SGB).',
  };
}
