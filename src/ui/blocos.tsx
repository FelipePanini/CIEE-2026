import type { ReactNode } from 'react';

export const AREA_ROTULO = {
  administracao: 'Administração',
  comercio: 'Comércio e Varejo',
  logistica: 'Logística',
  producao: 'Produção',
  lider: 'Líder do Projeto',
  geral: 'Visão geral',
} as const;
export type Area = keyof typeof AREA_ROTULO;

export function TituloTela({
  titulo,
  area,
  pergunta,
  children,
}: {
  titulo: string;
  area: Area;
  pergunta?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-piscina-300">
          {AREA_ROTULO[area]}
          {pergunta && <span className="text-coral-400"> · {pergunta}</span>}
        </p>
        <h1 className="font-display text-2xl leading-tight text-creme-100 sm:text-3xl">{titulo}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Painel({
  titulo,
  children,
  className = '',
  acao,
}: {
  titulo?: ReactNode;
  children: ReactNode;
  className?: string;
  acao?: ReactNode;
}) {
  return (
    <section className={`painel flex min-w-0 flex-col gap-3 p-4 ${className}`}>
      {(titulo || acao) && (
        <header className="flex items-center justify-between gap-2">
          {titulo && <h2 className="font-display text-base text-creme-100">{titulo}</h2>}
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  rotulo,
  children,
  destaque = false,
  nota,
}: {
  rotulo: string;
  children: ReactNode;
  destaque?: boolean;
  nota?: ReactNode;
}) {
  return (
    <div className="painel flex min-w-0 flex-col gap-1 p-3">
      <span className="text-[0.7rem] text-creme-200/80">{rotulo}</span>
      <span
        className={`font-display text-2xl leading-none ${destaque ? 'text-coral-500' : 'text-creme-100'}`}
      >
        {children}
      </span>
      {nota && <span className="text-[0.68rem] text-creme-200/70">{nota}</span>}
    </div>
  );
}

export function Grade({ children, min = 320 }: { children: ReactNode; min?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {children}
    </div>
  );
}

export function Botao({
  children,
  onClick,
  tipo = 'secundario',
  ...resto
}: {
  children: ReactNode;
  onClick?: () => void;
  tipo?: 'primario' | 'secundario' | 'perigo';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls =
    tipo === 'primario'
      ? 'bg-coral-500 text-navy-950 hover:bg-coral-400'
      : tipo === 'perigo'
        ? 'bg-navy-700 text-coral-400 ring-1 ring-coral-500/50 hover:bg-navy-600'
        : 'bg-navy-700 text-creme-100 hover:bg-navy-600';
  return (
    <button
      type="button"
      onClick={onClick}
      {...resto}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${cls} ${resto.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function Semaforo({ cor }: { cor: 'verde' | 'amarelo' | 'vermelho' }) {
  const bg =
    cor === 'verde'
      ? 'var(--color-ok)'
      : cor === 'amarelo'
        ? 'var(--color-alerta)'
        : 'var(--color-coral-500)';
  const txt = cor === 'verde' ? 'em dia' : cor === 'amarelo' ? 'atenção' : 'crítico';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: bg }} aria-hidden />
      <span>{txt}</span>
    </span>
  );
}
