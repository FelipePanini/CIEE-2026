import { useOperacao, useResultado } from '../../store';
import { nomeMunicipio } from '../../data/carregar';
import { Numero } from '../../ui/Numero';
import { Termometro } from '../../ui/Termometro';
import { fmt } from '../../ui/formato';

const COR_SEMAFORO = {
  verde: 'var(--color-ok)',
  amarelo: 'var(--color-alerta)',
  vermelho: 'var(--color-coral-500)',
} as const;
const AREAS = {
  administracao: 'Administração',
  comercio: 'Comércio e Varejo',
  logistica: 'Logística',
  producao: 'Produção',
} as const;

/** Fase 2: o motor em números — cenário, urgência por abrigo, semáforo das áreas e custo. */
export function ResumoMotor() {
  const r = useResultado();
  const par = useOperacao((s) => s.entrada.parametros);
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">{r.cenario.nome}</h2>
          <p className="max-w-3xl text-sm text-creme-200">{r.cenario.descricao}</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(AREAS) as (keyof typeof AREAS)[]).map((a) => (
            <span
              key={a}
              className="flex items-center gap-1.5 rounded-full bg-navy-800 px-2.5 py-1 text-xs"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: COR_SEMAFORO[r.semaforo[a]] }}
              />
              {AREAS[a]}
            </span>
          ))}
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="painel p-3">
          <p className="text-xs opacity-70">Pessoas atendidas</p>
          <p className="font-display text-2xl">{fmt.int(r.kpis.pessoas)}</p>
        </div>
        <div className="painel p-3">
          <p className="text-xs opacity-70">Itens críticos</p>
          <p className="font-display text-2xl text-coral-500">{r.kpis.critico}</p>
        </div>
        <div className="painel p-3">
          <p className="text-xs opacity-70">
            Custo do kit (1 família de {par.familia_ref} por {par.dias_kit} dias)
          </p>
          <p className="font-display text-2xl">
            <Numero dado={r.kit.custo} formatar={fmt.brl} />
          </p>
        </div>
        <div className="painel p-3">
          <p className="text-xs opacity-70">Custo total da resposta</p>
          <p className="font-display text-2xl">
            <Numero dado={r.custos.total} formatar={fmt.brl} selo />
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {r.locais
          .filter((l) => l.pessoasN > 0)
          .map((l) => (
            <article key={l.id} className="painel flex flex-col gap-2 p-3">
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold leading-tight">{l.nome}</h3>
                  <p className="text-[0.7rem] text-creme-200">
                    {nomeMunicipio(l.municipio)} · <Numero dado={l.pessoas} formatar={fmt.int} />{' '}
                    pessoas ·{' '}
                    {l.semRota ? (
                      <span className="text-coral-500">sem rota</span>
                    ) : l.eta ? (
                      `ETA ${fmt.dec1(l.eta.valor * 24)} h`
                    ) : (
                      ''
                    )}
                  </p>
                </div>
                {l.acimaCapacidade && (
                  <span className="rounded bg-coral-500 px-1.5 text-[0.6rem] font-bold text-navy-950">
                    ACIMA DA CAPACIDADE
                  </span>
                )}
              </header>
              {l.urgencias.map((u) => (
                <Termometro key={u.item} u={u} />
              ))}
            </article>
          ))}
      </div>
    </section>
  );
}
