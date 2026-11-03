/**
 * Busca /api/niveis (função serverless da Vercel) ao abrir o app e a cada 10 minutos.
 * Só aceita leituras válidas (schema do Dado) e mais novas que o JSON publicado; em qualquer falha
 * (offline, dev local sem a função, ANA fora do ar) o app segue com data/rios.json.
 */
import { useEffect } from 'react';
import { z } from 'zod';
import { dadoNumSchema } from './schema';
import { DADOS } from './carregar';
import { useOperacao } from '../store';
import type { Dado } from '../engine/tipos';

const respostaSchema = z.object({
  ok: z.boolean(),
  estacoes: z.record(z.string(), dadoNumSchema),
});

export async function buscarNiveisAoVivo(
  signal?: AbortSignal,
): Promise<Record<string, Dado<number>> | null> {
  try {
    const r = await fetch('/api/niveis', { signal, headers: { accept: 'application/json' } });
    if (!r.ok || !r.headers.get('content-type')?.includes('json')) return null;
    const j = respostaSchema.safeParse(await r.json());
    if (!j.success || !j.data.ok) return null;
    const novos: Record<string, Dado<number>> = {};
    for (const est of DADOS.rios.estacoes) {
      const vivo = j.data.estacoes[est.id] as Dado<number> | undefined;
      if (vivo && vivo.camada === 'ATUAL' && vivo.data_referencia > est.nivel_atual.data_referencia)
        novos[est.id] = vivo;
    }
    return Object.keys(novos).length ? novos : null;
  } catch {
    return null;
  }
}

export function useNiveisAoVivo() {
  const setNiveis = useOperacao((s) => s.setNiveisAoVivo);
  useEffect(() => {
    const ctrl = new AbortController();
    const atualizar = () =>
      void buscarNiveisAoVivo(ctrl.signal).then((n) => {
        if (n) setNiveis(n);
      });
    atualizar();
    const id = window.setInterval(atualizar, 10 * 60_000);
    return () => {
      ctrl.abort();
      window.clearInterval(id);
    };
  }, [setNiveis]);
}
