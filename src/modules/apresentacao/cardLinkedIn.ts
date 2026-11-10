/**
 * "Gerar card para o LinkedIn": compõe um PNG 1200×627 com o quadro atual do mundo 3D (ou o relevo
 * sombreado no modo 2D), os números de impacto com a fonte de cada um e as hashtags do Diário de Bordo.
 * Também gera a imagem Open Graph (1200×630) usada quando o link é compartilhado.
 */
import { DADOS } from '../../data/carregar';
import { formatarDataHora, fmt } from '../../ui/formato';
import { capturarQuadro3D } from '../../three/captura';
import type { Resultado } from '../../engine/simulacao';
import { cor, corAlfa } from '../../ui/cores';

export const HASHTAGS = '#CIEE #AprendizCIEE #Conteudos';
export const FRASE_FINAL = 'Liderar é transformar coordenação em confiança.';

interface LinhaImpacto {
  valor: string;
  rotulo: string;
  fonte: string;
}

const n = (v: unknown) => (typeof v === 'number' ? v : null);

export function linhasDeImpacto(r: Resultado): LinhaImpacto[] {
  const ev = DADOS.eventos.eventos.find((e) => e.id === '2024-05')!;
  const cotas = Object.fromEntries(
    DADOS.rios.estacoes.map((e) => [e.id, n(e.cota_inundacao.valor)]),
  );
  const picos = DADOS.eventos.eventos
    .flatMap((e) => e.picos)
    .filter((p) => (n(p.nivel.valor) ?? 0) >= (cotas[p.estacao] ?? Infinity)).length;
  const mun = n(ev.indicadores.municipios_afetados.valor);
  return [
    {
      valor: mun === null ? 'A CONFIRMAR' : fmt.int(mun),
      rotulo: 'municípios atingidos em maio de 2024',
      fonte: 'Defesa Civil RS',
    },
    {
      valor: String(picos),
      rotulo: 'picos de rio acima da cota desde 2024',
      fonte: 'telemetria ANA',
    },
    {
      valor: fmt.int(r.custos.pessoasAtendidas),
      rotulo: `pessoas atendidas · ${fmt.int(r.custos.kitsTotal)} kits planejados`,
      fonte: 'motor da Central (abrigos reais)',
    },
    {
      valor: fmt.brl(r.kit.custo.valor),
      rotulo: 'por kit família (composição do grupo)',
      fonte: 'preços DIEESE + atacado',
    },
  ];
}

export function textoDoPost(r: Resultado): string {
  const l = linhasDeImpacto(r);
  return [
    'Central de Comando — Solução Distribuidora · Ação Social RS (Estudo Dirigido CIEE).',
    `Com dados reais das cheias do RS: ${l[0]!.valor} municípios atingidos em 2024 e ${l[1]!.valor} picos de rio acima da cota desde então. A enchente não acabou em 2024.`,
    `Planejamos ${l[2]!.valor} pessoas atendidas, rotas na malha viária real e kits a ${l[3]!.valor} — da resposta à prontidão.`,
    FRASE_FINAL,
    HASHTAGS,
  ].join('\n\n');
}

const carregarImagem = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });

function cobrir(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const s = Math.max(w / img.width, h / img.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function quebrar(ctx: CanvasRenderingContext2D, texto: string, largura: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  for (const p of texto.split(' ')) {
    const t = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(t).width > largura && atual) {
      linhas.push(atual);
      atual = p;
    } else atual = t;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export async function gerarCard(
  r: Resultado,
  { largura = 1200, altura = 627 }: { largura?: number; altura?: number } = {},
): Promise<HTMLCanvasElement> {
  await Promise.all([
    document.fonts.load('64px "Archivo Black"'),
    document.fonts.load('600 20px "Archivo Variable"'),
  ]).catch(() => undefined);
  const c = document.createElement('canvas');
  c.width = largura;
  c.height = altura;
  const ctx = c.getContext('2d')!;
  const fundo = ctx.createLinearGradient(0, 0, largura, altura);
  fundo.addColorStop(0, cor('fundo-0'));
  fundo.addColorStop(1, cor('fundo-1'));
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, largura, altura);

  // imagem: o quadro 3D atual, ou o relevo sombreado (Copernicus DEM) no modo 2D
  const xImg = largura * 0.44;
  const quadro = capturarQuadro3D();
  const img = await carregarImagem(quadro ?? '/geo/relevo-2d.png');
  if (img) {
    ctx.save();
    ctx.globalAlpha = quadro ? 1 : 0.55;
    cobrir(ctx, img, xImg, 0, largura - xImg, altura);
    ctx.restore();
    const fade = ctx.createLinearGradient(xImg, 0, xImg + 260, 0);
    fade.addColorStop(0, cor('fundo-0'));
    fade.addColorStop(1, corAlfa('fundo-0', 0));
    ctx.fillStyle = fade;
    ctx.fillRect(xImg - 1, 0, 262, altura);
  }

  const m = 56;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = cor('cinza-2');
  ctx.font = '700 15px "Archivo Variable", sans-serif';
  ctx.fillText('ESTUDO DIRIGIDO CIEE · AÇÃO SOCIAL RIO GRANDE DO SUL', m, 66);
  ctx.fillStyle = cor('texto');
  ctx.font = '58px "Archivo Black", sans-serif';
  ctx.fillText('Central de Comando', m, 128);
  ctx.fillStyle = cor('texto-2');
  ctx.font = '600 24px "Archivo Variable", sans-serif';
  ctx.fillText('Solução Distribuidora — da resposta à prontidão', m, 164);

  let y = 236;
  for (const l of linhasDeImpacto(r)) {
    ctx.fillStyle = cor('texto');
    ctx.font = '40px "Archivo Black", sans-serif';
    ctx.fillText(l.valor, m, y);
    const w = ctx.measureText(l.valor).width;
    ctx.font = '600 18px "Archivo Variable", sans-serif';
    ctx.fillStyle = cor('texto-2');
    ctx.fillText(l.rotulo, m + w + 14, y - 14);
    ctx.font = '500 13px "Archivo Variable", sans-serif';
    ctx.fillStyle = cor('cinza-2');
    ctx.fillText(`fonte: ${l.fonte}`, m + w + 14, y + 4);
    y += 74;
  }

  // frase final sobre a imagem
  ctx.font = '30px "Archivo Black", sans-serif';
  const frase = quebrar(ctx, `“${FRASE_FINAL}”`, largura - xImg - 120);
  ctx.fillStyle = corAlfa('fundo-0', 0.72);
  const hF = frase.length * 38 + 28;
  ctx.fillRect(xImg + 80, altura - 112 - hF, largura - xImg - 120, hF);
  ctx.fillStyle = cor('texto');
  frase.forEach((t, i) => ctx.fillText(t, xImg + 96, altura - 112 - hF + 46 + i * 38));

  ctx.fillStyle = cor('cinza-2');
  ctx.font = '800 24px "Archivo Variable", sans-serif';
  ctx.fillText(HASHTAGS, m, altura - 56);
  ctx.fillStyle = cor('texto-2');
  ctx.font = '500 13px "Archivo Variable", sans-serif';
  ctx.fillText(
    `Dados: ANA · Defesa Civil RS · IBGE · INMET · DIEESE — atualizados em ${formatarDataHora(DADOS.meta.ultima_atualizacao)}. Parceiros fictícios; nenhum dado pessoal.`,
    m,
    altura - 28,
  );
  return c;
}

export async function baixarCardLinkedIn(r: Resultado) {
  const c = await gerarCard(r);
  const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'central-de-comando-linkedin.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
