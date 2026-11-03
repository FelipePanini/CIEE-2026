/**
 * Camada humana — mural de relatos. Textos de exemplo escritos para o exercício, sempre com o selo
 * "relato ilustrativo". Nenhum nome, foto ou dado de pessoa real.
 */
import { DADOS } from '../../data/carregar';
import { Painel } from '../../ui/blocos';
import { SeloCamada } from '../../ui/SeloCamada';

const INCLINACAO = ['-rotate-1', 'rotate-1', 'rotate-0', '-rotate-[0.5deg]', 'rotate-[0.6deg]'];

export function MuralRelatos({ max }: { max?: number }) {
  const relatos = DADOS.relatos.relatos.slice(0, max);
  return (
    <Painel titulo="Mural de relatos">
      <p className="text-xs text-creme-200">{DADOS.relatos.aviso}</p>
      <ul
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px,100%), 1fr))' }}
      >
        {relatos.map((r, i) => (
          <li
            key={r.id}
            className={`painel-claro flex flex-col gap-2 p-3 text-navy-900 shadow ${INCLINACAO[i % INCLINACAO.length]}`}
          >
            <SeloCamada camada="SIMULADO" texto={r.selo} className="self-start" />
            <blockquote className="text-[0.8rem] leading-snug">“{r.texto}”</blockquote>
            <p className="text-[0.66rem] font-semibold uppercase tracking-wide opacity-70">
              {r.local}
            </p>
          </li>
        ))}
      </ul>
    </Painel>
  );
}
