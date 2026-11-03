import type { UrgenciaItem } from '../engine/urgencia';
import { itemPorId } from '../engine/urgencia';
import { Numero } from './Numero';
import { fmt } from './formato';
import { corUrgencia } from './cores';

/** Termômetro de urgência de um item num abrigo: barra = cobertura em dias × prazo crítico. */
export function Termometro({ u, compacto = false }: { u: UrgenciaItem; compacto?: boolean }) {
  const def = itemPorId(u.item);
  const dias = u.coberturaNaChegada.valor;
  const escala = Math.max(u.prazo * 2, 1);
  const largura = Math.min(100, (Math.min(dias, escala) / escala) * 100);
  const marcaPrazo = (u.prazo / escala) * 100;
  const cor = corUrgencia(u.urgencia.valor, u.critico);
  return (
    <div className={`flex flex-col gap-1 ${compacto ? 'text-[0.68rem]' : 'text-xs'}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-semibold">{def.nome}</span>
        <span className="flex items-baseline gap-1 tabular-nums">
          <Numero
            dado={u.coberturaNaChegada}
            formatar={(v) => (v >= 999 ? 'coberto' : `${fmt.dec1(v)} d`)}
          />
          <span className="opacity-60">/ {u.prazo} d</span>
        </span>
      </div>
      <div
        className="relative h-2.5 overflow-hidden rounded-full bg-navy-700"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={escala}
        aria-valuenow={Math.min(dias, escala)}
        aria-label={`${def.nome}: ${fmt.dec1(dias)} dias de cobertura`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${largura}%`, background: cor }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-creme-100/70"
          style={{ left: `${marcaPrazo}%` }}
          title="Prazo crítico"
        />
      </div>
      {!compacto && (
        <div className="flex justify-between text-[0.65rem] text-creme-200/80">
          <span>{def.humano(u.estoque)} em estoque</span>
          <span>
            urgência <Numero dado={u.urgencia} formatar={(v) => fmt.dec2(v)} />
          </span>
        </div>
      )}
    </div>
  );
}
