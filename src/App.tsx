import { lazy, Suspense } from 'react';
import { Cabecalho, LegendaCamadas, Rodape } from './ui/Cabecalho';
import { IndicadorAlerta, PainelConfiguracao, SeletorCenario, SeletorFase } from './ui/Controles';
import { BannerCrise, BotaoCartaCrise } from './ui/CartaCrise';
import { Navegacao, useRotaURL } from './ui/Navegacao';
import { AvisoModoLeve, SeletorQualidade } from './ui/Qualidade';
import { moduloPorId } from './modules/registro';
import { useOperacao } from './store';

const Palco = lazy(() => import('./three/Palco'));

export function App() {
  useRotaURL();
  const tela = useOperacao((s) => s.tela);
  const qualidade = useOperacao((s) => s.qualidade);
  const recolhido = useOperacao((s) => s.painelRecolhido);
  const setRecolhido = useOperacao((s) => s.setPainelRecolhido);
  const Modulo = moduloPorId(tela).Painel2D;
  const com3d = qualidade !== '2d';
  return (
    <div className="flex h-full flex-col">
      <Cabecalho>
        <SeletorCenario />
        <SeletorFase />
        <IndicadorAlerta />
        <BotaoCartaCrise />
        <SeletorQualidade />
        <PainelConfiguracao />
      </Cabecalho>
      <BannerCrise />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Navegacao />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          {com3d && (
            <Suspense
              fallback={
                <div className="absolute inset-0 grid place-items-center text-sm text-creme-200">
                  Carregando o mundo 3D…
                </div>
              }
            >
              <Palco />
            </Suspense>
          )}
          <AvisoModoLeve />
          {com3d && (
            <button
              onClick={() => setRecolhido(!recolhido)}
              className="absolute right-3 top-3 z-20 rounded-md bg-navy-950/85 px-2.5 py-1.5 text-xs font-semibold ring-1 ring-piscina-300/40"
              aria-expanded={!recolhido}
            >
              {recolhido ? '◧ Mostrar painel' : '▭ Só o 3D'}
            </button>
          )}
          <div
            className={
              com3d
                ? `absolute bottom-0 right-0 top-12 z-10 w-[min(34rem,100%)] overflow-y-auto rounded-tl-2xl bg-navy-900/88 p-4 shadow-2xl ring-1 ring-piscina-300/20 backdrop-blur transition-transform duration-300 ${recolhido ? 'translate-x-full' : ''}`
                : 'h-full overflow-y-auto'
            }
            data-modo={com3d ? '3d' : '2d'}
          >
            <div
              className={
                com3d
                  ? 'flex flex-col gap-4 pb-10'
                  : 'mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10'
              }
            >
              <Modulo />
              <LegendaCamadas />
            </div>
          </div>
        </main>
      </div>
      <Rodape />
    </div>
  );
}
