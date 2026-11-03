import type { Camada } from '../engine/tipos';
import { ROTULO_CAMADA } from '../engine/camadas';
import { COR_CAMADA } from './cores';

const COR: Record<Camada | 'PARAMETRO' | 'CALCULADO', string> = {
  HISTORICO: 'bg-[var(--color-camada-historico)] text-navy-950',
  ATUAL: 'bg-[var(--color-camada-atual)] text-navy-950',
  PREVISAO: 'bg-[var(--color-camada-previsao)] text-navy-950',
  SIMULADO: 'bg-[var(--color-camada-simulado)] text-navy-950',
  PARAMETRO: 'bg-[var(--color-camada-parametro)] text-navy-950',
  CALCULADO: 'bg-transparent text-creme-100 ring-1 ring-piscina-300/60',
};

interface Props {
  camada: Camada | 'PARAMETRO' | 'CALCULADO';
  texto?: string;
  pontos?: Camada[];
  className?: string;
}

/** Selo visível da camada do dado: HISTÓRICO · ATUAL · PREVISÃO · SIMULADO (+ critério do grupo / calculado). */
export function SeloCamada({ camada, texto, pontos, className = '' }: Props) {
  const rotulo =
    texto ??
    (camada === 'PARAMETRO'
      ? 'CRITÉRIO DO GRUPO'
      : camada === 'CALCULADO'
        ? 'CALCULADO'
        : ROTULO_CAMADA[camada]);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[1px] text-[0.62rem] font-bold uppercase tracking-wider ${COR[camada]} ${className}`}
    >
      {pontos?.map((c) => (
        <span
          key={c}
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: COR_CAMADA[c] }}
        />
      ))}
      {rotulo}
    </span>
  );
}
