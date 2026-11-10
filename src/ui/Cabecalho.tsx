import type { ReactNode } from 'react';
import { DADOS } from '../data/carregar';
import { formatarDataHora } from './formato';
import { SeloCamada } from './SeloCamada';
import { useOperacao } from '../store';

/** Cabeçalho fixo: marca, data da última atualização dos dados e controles globais (passados como filhos). */
export function Cabecalho({ children }: { children?: ReactNode }) {
  return (
    <header className="relative z-20 flex min-h-[var(--altura-cabecalho)] flex-wrap items-center gap-x-4 gap-y-2 border-b border-linha bg-fundo-0/90 px-4 py-2 backdrop-blur">
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-display whitespace-nowrap text-lg text-texto sm:text-xl">
          Central de Comando
        </span>
        <span className="truncate text-xs text-texto-2">
          Solução Distribuidora · Ação Social RS
        </span>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{children}</div>
      <div className="hidden flex-col items-end text-right text-[0.7rem] leading-tight text-texto-2 md:flex">
        <span className="opacity-70">Dados atualizados em</span>
        <span className="font-semibold tabular-nums text-texto">
          {formatarDataHora(DADOS.meta.ultima_atualizacao)}
        </span>
        <RiosAoVivo />
      </div>
    </header>
  );
}

/** Aparece só quando /api/niveis trouxe uma leitura mais nova que o JSON publicado. */
function RiosAoVivo() {
  const vivos = useOperacao((s) => s.entrada.niveisReais);
  const refs = Object.values(vivos ?? {}).map((d) => d!.data_referencia);
  if (!refs.length) return null;
  const ultima = refs.sort().at(-1)!;
  return (
    <span className="text-texto-2" title="Telemetria da ANA via /api/niveis">
      rios ao vivo (ANA): {ultima.slice(8, 10)}/{ultima.slice(5, 7)} {ultima.slice(11, 16)}
    </span>
  );
}

export function LegendaCamadas() {
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Legenda das camadas de dado">
      <SeloCamada camada="HISTORICO" />
      <SeloCamada camada="ATUAL" />
      <SeloCamada camada="PREVISAO" />
      <SeloCamada camada="SIMULADO" />
      <SeloCamada camada="PARAMETRO" />
      <SeloCamada camada="CALCULADO" />
    </div>
  );
}

export function Rodape() {
  return (
    <footer className="relative z-20 border-t border-linha bg-fundo-0/90 px-4 py-2 text-[0.68rem] text-texto-2">
      <strong className="text-texto">Privacidade (LGPD):</strong> este painel não usa nenhuma
      informação pessoal real. Parceiros têm nomes fictícios, relatos são ilustrativos e o rastreio
      de kits não contém dados de famílias. Estudo Dirigido CIEE · Solução Distribuidora é uma
      empresa fictícia.
    </footer>
  );
}
