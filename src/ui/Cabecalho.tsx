import type { ReactNode } from 'react';
import { DADOS } from '../data/carregar';
import { formatarDataHora } from './formato';
import { SeloCamada } from './SeloCamada';

/** Cabeçalho fixo: marca, data da última atualização dos dados e controles globais (passados como filhos). */
export function Cabecalho({ children }: { children?: ReactNode }) {
  return (
    <header className="relative z-20 flex h-[var(--altura-cabecalho)] items-center gap-4 border-b border-piscina-300/20 bg-navy-950/90 px-4 backdrop-blur">
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-display text-lg text-creme-100 sm:text-xl">Central de Comando</span>
        <span className="truncate text-xs text-piscina-300">
          Solução Distribuidora · Ação Social RS
        </span>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">{children}</div>
      <div className="hidden flex-col items-end text-right text-[0.7rem] leading-tight text-creme-200 md:flex">
        <span className="opacity-70">Dados atualizados em</span>
        <span className="font-semibold tabular-nums text-creme-100">
          {formatarDataHora(DADOS.meta.ultima_atualizacao)}
        </span>
      </div>
    </header>
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
    <footer className="relative z-20 border-t border-piscina-300/15 bg-navy-950/90 px-4 py-2 text-[0.68rem] text-creme-200/80">
      <strong className="text-creme-100">Privacidade (LGPD):</strong> este painel não usa nenhuma
      informação pessoal real. Parceiros têm nomes fictícios, relatos são ilustrativos e o rastreio
      de kits não contém dados de famílias. Estudo Dirigido CIEE · Solução Distribuidora é uma
      empresa fictícia.
    </footer>
  );
}
