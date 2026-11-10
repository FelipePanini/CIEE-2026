import type { Camada } from '../engine/tipos';
import { ROTULO_CAMADA } from '../engine/camadas';
import { SIMBOLO_CAMADA } from './cores';

/**
 * Na paleta neutra as camadas não têm cor própria (cor é só para alerta, atenção e ok).
 * Cada selo se distingue por TEXTO + SÍMBOLO + ESTILO DE BORDA:
 *   ● ATUAL preenchido · ◆ HISTÓRICO contorno cheio · ◐ PREVISÃO tracejado · ◇ SIMULADO pontilhado
 */
const ESTILO: Record<Camada | 'PARAMETRO' | 'CALCULADO', string> = {
  ATUAL: 'bg-texto text-fundo-0 border border-transparent',
  HISTORICO: 'bg-fundo-2 text-texto border border-solid border-cinza-3',
  PREVISAO: 'bg-fundo-2 text-texto border border-dashed border-cinza-2',
  SIMULADO: 'bg-fundo-2 text-texto-2 border border-dotted border-cinza-2',
  PARAMETRO: 'bg-fundo-2 text-texto-2 border border-double border-cinza-3',
  CALCULADO: 'bg-transparent text-texto border border-solid border-linha-forte',
};
const SIMBOLO: Record<Camada | 'PARAMETRO' | 'CALCULADO', string> = {
  ...SIMBOLO_CAMADA,
  PARAMETRO: '✎',
  CALCULADO: 'ƒ',
};

interface Props {
  camada: Camada | 'PARAMETRO' | 'CALCULADO';
  texto?: string;
  /** Camadas dos insumos de um valor calculado (aparecem como símbolos). */
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
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[1px] text-[0.62rem] font-bold uppercase tracking-wider ${ESTILO[camada]} ${className}`}
    >
      <span aria-hidden className="text-[0.7em] leading-none">
        {pontos?.length ? pontos.map((c) => SIMBOLO_CAMADA[c]).join('') : SIMBOLO[camada]}
      </span>
      {rotulo}
    </span>
  );
}
