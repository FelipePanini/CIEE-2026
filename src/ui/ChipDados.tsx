/** Chip discreto no canto com a data dos dados (e a leitura ao vivo dos rios, quando houver) + LGPD. */
import { useState } from 'react';
import { DADOS } from '../data/carregar';
import { useOperacao } from '../store';

const curto = (iso: string) => {
  const d = new Date(iso.length <= 16 ? `${iso}:00-03:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function ChipDados() {
  const [aberto, setAberto] = useState(false);
  const vivos = useOperacao((s) => s.entrada.niveisReais);
  const refs = Object.values(vivos ?? {}).map((d) => d!.data_referencia);
  const aoVivo = refs.length ? refs.sort().at(-1)! : null;
  const jsonRios = DADOS.rios.estacoes
    .map((e) => e.nivel_atual.data_referencia)
    .sort()
    .at(-1)!;
  return (
    <div className="chip-dados pointer-events-auto relative flex max-w-full flex-col items-start gap-1">
      {aberto && (
        <div
          role="tooltip"
          className="popover-vidro mb-1 w-80 text-[0.7rem] leading-snug text-texto-2"
        >
          <p>
            <strong className="text-texto">Dados:</strong> arquivos de <code>data/*.json</code>,
            atualizados todo dia pela GitHub Action (telemetria da ANA, avisos da Defesa Civil RS).
          </p>
          <p className="mt-1">
            <strong className="text-texto">Rios:</strong> leitura da ANA de {curto(jsonRios)} no
            arquivo publicado
            {aoVivo
              ? `; ao vivo (função /api/niveis) de ${curto(aoVivo)}.`
              : '; sem leitura ao vivo mais nova.'}
          </p>
          <p className="mt-1">
            <strong className="text-texto">Privacidade (LGPD):</strong> este painel não usa nenhuma
            informação pessoal real. Parceiros têm nomes fictícios, relatos são ilustrativos e o
            rastreio de kits não contém dados de famílias. Estudo Dirigido CIEE · Solução
            Distribuidora é uma empresa fictícia.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        onBlur={() => setAberto(false)}
        aria-expanded={aberto}
        className="vidro-simples rounded-full border border-linha px-3 py-1.5 text-[0.68rem] tabular-nums text-texto-2 hover:text-texto"
        title="Fontes e data dos dados"
      >
        Dados de {curto(DADOS.meta.ultima_atualizacao)}
        {aoVivo ? ` · rios ao vivo ${curto(aoVivo)}` : ''}
      </button>
      <span className="pl-1 text-[0.6rem] text-texto-3 [text-shadow:0_1px_2px_var(--color-fundo-0)]">
        LGPD: nenhum dado pessoal real · parceiros fictícios
      </span>
    </div>
  );
}
