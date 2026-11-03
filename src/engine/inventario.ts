/**
 * Inventário da arquitetura para os Bastidores: quantos números com fonte existem em cada camada,
 * quantas fontes distintas os sustentam e quantos arquivos de dados há. Percorre os JSONs já
 * validados (nada é digitado à mão), então o 3D e o 2D dos Bastidores mostram o sistema real.
 */
import { CAMADAS, ehDado, type Camada } from './tipos';

export interface Inventario {
  arquivos: number;
  dados: number;
  porCamada: Record<Camada, number>;
  aConfirmar: number;
  urls: number;
  dominios: string[];
}

export function inventariar(dados: Record<string, unknown>): Inventario {
  const porCamada = Object.fromEntries(CAMADAS.map((c) => [c, 0])) as Record<Camada, number>;
  const urls = new Set<string>();
  let total = 0;
  let aConfirmar = 0;
  const visitar = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(visitar);
    if (typeof v !== 'object' || v === null) return;
    if (ehDado(v)) {
      const d = v as { camada: Camada; url: string | null; valor: unknown };
      total++;
      porCamada[d.camada]++;
      if (d.valor === 'A CONFIRMAR') aConfirmar++;
      if (d.url) urls.add(d.url);
    }
    for (const filho of Object.values(v)) visitar(filho);
  };
  visitar(dados);
  const dominios = [
    ...new Set(
      [...urls].flatMap((u) => {
        try {
          return [new URL(u).hostname.replace(/^www\./, '')];
        } catch {
          return [];
        }
      }),
    ),
  ].sort();
  return {
    arquivos: Object.keys(dados).length,
    dados: total,
    porCamada,
    aConfirmar,
    urls: urls.size,
    dominios,
  };
}
