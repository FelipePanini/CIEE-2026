import { lazy, Suspense, useState } from 'react';
import { Cabecalho, LegendaCamadas, Rodape } from './ui/Cabecalho';
import { IndicadorAlerta, PainelConfiguracao, SeletorCenario, SeletorFase } from './ui/Controles';
import { BannerCrise, BotaoCartaCrise } from './ui/CartaCrise';
import { Navegacao, useRotaURL } from './ui/Navegacao';
import { AvisoModoLeve, SeletorQualidade } from './ui/Qualidade';
import { moduloPorId } from './modules/registro';
import { useOperacao } from './store';
import { PaginaRastreio } from './modules/humano/Rastreio';
import { useNiveisAoVivo } from './data/niveisAoVivo';
import { BotaoApresentacao, ModoApresentacao } from './modules/apresentacao/ModoApresentacao';

const Palco = lazy(() => import('./three/Palco'));

/** /rastreio/KIT-AAAA-NNNN abre a página pública do doador (aberta pelo QR); o resto é a Central. */
export function App() {
  const rastreio = /^\/rastreio\/([^/]+)\/?$/.exec(window.location.pathname);
  if (rastreio) return <PaginaRastreio codigo={rastreio[1]!.toUpperCase()} />;
  return <Central />;
}

function Central() {
  useRotaURL();
  useNiveisAoVivo();
  const tela = useOperacao((s) => s.tela);
  const qualidade = useOperacao((s) => s.qualidade);
  const recolhido = useOperacao((s) => s.painelRecolhido);
  const setRecolhido = useOperacao((s) => s.setPainelRecolhido);
  const apresentando = useOperacao((s) => s.apresentacao.ativa);
  const Modulo = moduloPorId(tela).Painel2D;
  const com3d = qualidade !== '2d';
  const painelFechado = recolhido || apresentando;
  // o Canvas é criado na primeira vez que o 3D é pedido e nunca mais desmontado (um único contexto WebGL)
  const [montado3d, setMontado3d] = useState(com3d);
  if (com3d && !montado3d) setMontado3d(true);
  return (
    <div className="flex h-full flex-col">
      {!apresentando && (
        <>
          <Cabecalho>
            <SeletorCenario />
            <SeletorFase />
            <IndicadorAlerta />
            <BotaoCartaCrise />
            <BotaoApresentacao />
            <SeletorQualidade />
            <PainelConfiguracao />
          </Cabecalho>
          <BannerCrise />
        </>
      )}
      {apresentando && com3d && <ModoApresentacao com3d />}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {!apresentando && <Navegacao />}
        <main className="relative min-h-0 flex-1 overflow-hidden">
          {montado3d && (
            <div
              className="absolute inset-0"
              style={{ display: com3d ? 'block' : 'none' }}
              aria-hidden={!com3d}
            >
              <Suspense
                fallback={
                  <div className="absolute inset-0 grid place-items-center text-sm text-texto-2">
                    Carregando o mundo 3D…
                  </div>
                }
              >
                <Palco ativo={com3d} />
              </Suspense>
            </div>
          )}
          {!apresentando && <AvisoModoLeve />}
          {com3d && !apresentando && (
            <button
              onClick={() => setRecolhido(!recolhido)}
              className="absolute right-3 top-3 z-20 rounded-md bg-fundo-0/85 px-2.5 py-1.5 text-xs font-semibold ring-1 ring-linha-forte"
              aria-expanded={!recolhido}
            >
              {recolhido ? '◧ Mostrar painel' : '▭ Só o 3D'}
            </button>
          )}
          <div
            className={
              com3d
                ? `absolute bottom-0 right-0 top-12 z-10 w-[min(34rem,100%)] overflow-y-auto rounded-tl-2xl bg-fundo-1/88 p-4 shadow-2xl ring-1 ring-linha backdrop-blur transition-transform duration-300 ${painelFechado ? 'translate-x-full' : ''}`
                : 'h-full overflow-y-auto'
            }
            data-modo={com3d ? '3d' : '2d'}
            aria-hidden={com3d && apresentando}
          >
            <div
              className={
                com3d
                  ? 'flex flex-col gap-4 pb-10'
                  : 'mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10'
              }
            >
              {apresentando && !com3d && <ModoApresentacao com3d={false} />}
              <Modulo />
              <LegendaCamadas />
            </div>
          </div>
        </main>
      </div>
      {!apresentando && <Rodape />}
    </div>
  );
}
