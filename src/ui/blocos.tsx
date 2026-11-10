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
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-texto-2">
          {AREA_ROTULO[area]}
          {pergunta && <span className="text-texto"> · {pergunta}</span>}
        </p>
        <h1 className="font-display text-2xl leading-tight text-texto sm:text-3xl">{titulo}</h1>
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
          {titulo && <h2 className="font-display text-base text-texto">{titulo}</h2>}
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
      <span className="text-[0.7rem] text-texto-2">{rotulo}</span>
      <span
        className={`font-display text-2xl leading-none ${destaque ? 'text-alerta' : 'text-texto'}`}
      >
        {children}
      </span>
      {nota && <span className="text-[0.68rem] text-texto-2">{nota}</span>}
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
  const variante = tipo === 'primario' ? 'primario' : tipo === 'perigo' ? 'perigo' : 'vidro';
  return (
    <button
      type="button"
      onClick={onClick}
      {...resto}
      className={`vidro-botao vidro-botao--compacto vidro-botao--${variante} ${resto.className ?? ''}`}
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
        ? 'var(--color-atencao)'
        : 'var(--color-alerta)';
  const txt = cor === 'verde' ? 'em dia' : cor === 'amarelo' ? 'atenção' : 'crítico';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: bg }} aria-hidden />
      <span>{txt}</span>
    </span>
  );
}
