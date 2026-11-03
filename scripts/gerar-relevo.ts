/**
 * Gera o heightmap leve da bacia do Guaíba (Vale do Taquari → Região Metropolitana)
 * a partir do Copernicus DEM GLO-30 (AWS Open Data), lendo só as visões reduzidas (COG).
 *
 * Saída:
 *   public/geo/relevo.bin   Int16 little-endian, metros, linha 0 = norte
 *   public/geo/relevo.json  metadados (bbox, dimensões, fonte, data)
 *
 * Uso: npm run gerar-relevo   (no container de dev: NODE_USE_ENV_PROXY=1)
 */
import { fromUrl } from 'geotiff';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BBOX = { oeste: -52.45, leste: -50.8, sul: -30.45, norte: -28.95 };
const LARGURA = 660;
const ALTURA = Math.round(
  (LARGURA * (BBOX.norte - BBOX.sul)) /
    ((BBOX.leste - BBOX.oeste) * Math.cos((((BBOX.norte + BBOX.sul) / 2) * Math.PI) / 180)),
);

const nomeTile = (lat: number, lon: number) => {
  const ns = lat < 0 ? `S${String(-lat).padStart(2, '0')}` : `N${String(lat).padStart(2, '0')}`;
  const ew = lon < 0 ? `W${String(-lon).padStart(3, '0')}` : `E${String(lon).padStart(3, '0')}`;
  const n = `Copernicus_DSM_COG_10_${ns}_00_${ew}_00_DEM`;
  return `https://copernicus-dem-30m.s3.amazonaws.com/${n}/${n}.tif`;
};

async function main() {
  const saida = new Float32Array(LARGURA * ALTURA).fill(Number.NaN);
  const dx = (BBOX.leste - BBOX.oeste) / LARGURA;
  const dy = (BBOX.norte - BBOX.sul) / ALTURA;
  const tiles: string[] = [];

  for (let lat = Math.floor(BBOX.sul) - 1; lat <= Math.ceil(BBOX.norte); lat++) {
    for (let lon = Math.floor(BBOX.oeste) - 1; lon <= Math.ceil(BBOX.leste); lon++) {
      const url = nomeTile(lat, lon);
      let tiff;
      try {
        tiff = await fromUrl(url);
      } catch {
        continue;
      }
      const img = await tiff.getImage();
      const [x0, y0, x1, y1] = img.getBoundingBox() as [number, number, number, number];
      const ix0 = Math.max(x0, BBOX.oeste);
      const ix1 = Math.min(x1, BBOX.leste);
      const iy0 = Math.max(y0, BBOX.sul);
      const iy1 = Math.min(y1, BBOX.norte);
      if (ix0 >= ix1 || iy0 >= iy1) continue;
      // janela de saída correspondente
      const c0 = Math.round((ix0 - BBOX.oeste) / dx);
      const c1 = Math.round((ix1 - BBOX.oeste) / dx);
      const r0 = Math.round((BBOX.norte - iy1) / dy);
      const r1 = Math.round((BBOX.norte - iy0) / dy);
      const w = c1 - c0;
      const h = r1 - r0;
      if (w <= 0 || h <= 0) continue;
      const bx0 = BBOX.oeste + c0 * dx;
      const bx1 = BBOX.oeste + c1 * dx;
      const by1 = BBOX.norte - r0 * dy;
      const by0 = BBOX.norte - r1 * dy;
      const ras = (await tiff.readRasters({
        bbox: [bx0, by0, bx1, by1],
        width: w,
        height: h,
        resampleMethod: 'bilinear',
        samples: [0],
      })) as unknown as Float32Array[];
      const banda = ras[0]!;
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          saida[(r0 + r) * LARGURA + (c0 + c)] = banda[r * w + c]!;
        }
      }
      tiles.push(url);
      console.log(`ok ${url.split('/').pop()} → janela ${w}×${h}`);
    }
  }

  // preenche lacunas (oceano/sem dado) com 0 m
  let min = Infinity;
  let max = -Infinity;
  const i16 = new Int16Array(LARGURA * ALTURA);
  for (let i = 0; i < saida.length; i++) {
    const v = Number.isFinite(saida[i]!) ? saida[i]! : 0;
    const q = Math.max(-100, Math.min(3000, Math.round(v)));
    i16[i] = q;
    if (q < min) min = q;
    if (q > max) max = q;
  }

  const dir = join(process.cwd(), 'public', 'geo');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'relevo.bin'), Buffer.from(i16.buffer));
  const meta = {
    bbox: BBOX,
    largura: LARGURA,
    altura: ALTURA,
    formato: 'Int16LE, metros acima do nível do mar, linha 0 = borda norte',
    min,
    max,
    fonte: 'Copernicus DEM GLO-30 (ESA/Airbus), AWS Open Data Registry',
    url: 'https://registry.opendata.aws/copernicus-dem/',
    licenca:
      'Copernicus DEM © DLR e.V. 2010-2014 e © Airbus Defence and Space GmbH 2014-2018, licença Copernicus',
    tiles,
    resolucao_aprox_m: Math.round(dx * 111_320 * Math.cos((-29.7 * Math.PI) / 180)),
    data_geracao: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(join(dir, 'relevo.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`relevo ${LARGURA}×${ALTURA}, min ${min} m, max ${max} m`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
