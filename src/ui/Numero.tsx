import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { A_CONFIRMAR, ehCalculado, type Calculado, type Dado } from '../engine/tipos';
import { formatarDataCurta, procedencia, rotuloSelo } from '../engine/camadas';
import { SeloCamada } from './SeloCamada';
import { formatarNumero } from './formato';

type Fonte = Dado<number> | Dado<string> | Calculado;

interface Props {
  dado: Fonte;
  /** Formatação customizada do valor numérico. */
  formatar?: (v: number) => string;
  /** Mostrar o selo da camada ao lado do número. */
  selo?: boolean;
  className?: string;
  children?: ReactNode;
}

function valorTexto(d: Fonte, formatar?: (v: number) => string): string {
  if (typeof d.valor === 'number')
    return formatar ? formatar(d.valor) : formatarNumero(d.valor, d.unidade);
  return String(d.valor);
}

/** Número rastreável: ao passar o mouse, focar ou tocar, mostra fonte, link, datas e camada. */
export function Numero({ dado, formatar, selo = false, className = '', children }: Props) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState<{ x: number; y: number; acima: boolean } | null>(null);
  const id = useId();
  const fechar = useRef<number | undefined>(undefined);
  const ancora = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!aberto || !ancora.current) return;
    const r = ancora.current.getBoundingClientRect();
    const largura = Math.min(352, window.innerWidth * 0.8);
    const x = Math.max(8, Math.min(r.left, window.innerWidth - largura - 8));
    const acima = r.bottom > window.innerHeight * 0.62;
    setPosicao({ x, y: acima ? r.top - 6 : r.bottom + 6, acima });
  }, [aberto]);
  const calc = ehCalculado(dado);
  const pendente = !calc && dado.valor === A_CONFIRMAR;

  const abrir = () => {
    window.clearTimeout(fechar.current);
    setAberto(true);
  };
  const agendarFechar = () => {
    fechar.current = window.setTimeout(() => setAberto(false), 120);
  };

  return (
    <span
      className="relative inline-flex items-baseline gap-2"
      onMouseEnter={abrir}
      onMouseLeave={agendarFechar}
    >
      <button
        ref={ancora}
        type="button"
        aria-describedby={aberto ? id : undefined}
        onFocus={abrir}
        onBlur={agendarFechar}
        onClick={() => setAberto((a) => !a)}
        className={`cursor-help border-b border-dotted border-current/40 text-left tabular-nums ${pendente ? 'text-alerta' : ''} ${className}`}
      >
        {children ?? valorTexto(dado, formatar)}
      </button>
      {selo && <SeloDoDado dado={dado} />}
      {aberto &&
        posicao &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            onMouseEnter={abrir}
            onMouseLeave={agendarFechar}
            style={{
              left: posicao.x,
              top: posicao.y,
              transform: posicao.acima ? 'translateY(-100%)' : undefined,
            }}
            className="fixed z-[1000] w-[min(22rem,80vw)] rounded-xl bg-navy-950 p-3 text-left text-xs font-normal leading-snug text-creme-100 shadow-2xl ring-1 ring-piscina-300/40"
          >
            {calc ? <DetalheCalculado c={dado} /> : <DetalheDado d={dado} />}
          </span>,
          document.body,
        )}
    </span>
  );
}

export function SeloDoDado({ dado }: { dado: Fonte }) {
  if (ehCalculado(dado)) {
    const p = procedencia(dado);
    return <SeloCamada camada="CALCULADO" pontos={p.camadas} />;
  }
  return <SeloCamada camada={dado.camada} texto={rotuloSelo(dado)} />;
}

function DetalheDado({ d }: { d: Dado<number> | Dado<string> }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <SeloCamada camada={d.camada} texto={rotuloSelo(d)} />
        <span className="opacity-70">{d.unidade}</span>
      </span>
      <span className="font-semibold">{d.fonte}</span>
      <span className="opacity-80">
        Referência: {formatarDataCurta(d.data_referencia)} · consultado em{' '}
        {formatarDataCurta(d.data_consulta)}
      </span>
      {d.nota && <span className="opacity-80">{d.nota}</span>}
      {d.valor === A_CONFIRMAR && (
        <span className="text-alerta">
          Número não confirmado na fonte oficial — ver README (A CONFIRMAR).
        </span>
      )}
      {d.url && (
        <a
          href={d.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-piscina-300 underline"
        >
          {d.url}
        </a>
      )}
      {d.confirmacoes?.map((c) => (
        <a
          key={c.url}
          href={c.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-piscina-200/80 underline"
        >
          também: {c.fonte}
        </a>
      ))}
    </span>
  );
}

function DetalheCalculado({ c }: { c: Calculado }) {
  const p = procedencia(c);
  return (
    <span className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2">
        <SeloCamada camada="CALCULADO" pontos={p.camadas} />
        <span className="opacity-70">{c.unidade}</span>
      </span>
      <code className="rounded bg-navy-800 px-1.5 py-1 font-mono text-[0.7rem]">{c.formula}</code>
      <span className="opacity-70">Insumos:</span>
      <ul className="flex flex-col gap-1">
        {p.dados.slice(0, 6).map((d, i) => (
          <li key={i} className="flex flex-col">
            <span>
              <SeloCamada camada={d.camada} texto={rotuloSelo(d)} /> {d.fonte}
            </span>
          </li>
        ))}
        {p.dados.length > 6 && <li className="opacity-60">+ {p.dados.length - 6} fontes</li>}
        {p.parametros.map((pr) => (
          <li key={pr.id}>
            <SeloCamada camada="PARAMETRO" /> {pr.rotulo}: {formatarNumero(pr.valor, pr.unidade)}
          </li>
        ))}
      </ul>
    </span>
  );
}
