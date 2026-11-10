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
import { useFlag } from './config/flags';
import { BarraSuperior } from './ui/BarraSuperior';
import { DockNavegacao } from './ui/DockNavegacao';
import { ChipDados } from './ui/ChipDados';
import { AvisosVidro } from './ui/AvisosVidro';
import { Icone } from './ui/icones';
import { GlassButton, GlassPanel, useVidroGlobal } from './ui/vidro';
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
  useVidroGlobal();
  const tela = useOperacao((s) => s.tela);
  const qualidade = useOperacao((s) => s.qualidade);
  const recolhido = useOperacao((s) => s.painelRecolhido);
  const setRecolhido = useOperacao((s) => s.setPainelRecolhido);
  const apresentando = useOperacao((s) => s.apresentacao.ativa);
  const barraNova = useFlag('barraNova');
  const dock = useFlag('dock');
  const vidro = useFlag('vidro');
  const vidroLateral = useFlag('vidroPainelLateral');
  const Modulo = moduloPorId(tela).Painel2D;
  const com3d = qualidade !== '2d';
  const painelFechado = recolhido || apresentando;
  // o Canvas é criado na primeira vez que o 3D é pedido e nunca mais desmontado (um único contexto WebGL)
  const [montado3d, setMontado3d] = useState(com3d);
  if (com3d && !montado3d) setMontado3d(true);
  // margens da área útil conforme o que está ligado (barra nova flutua; a da v1 é uma faixa)
  const topo = barraNova ? '5.6rem' : '4.4rem';
  const base = dock ? '5.4rem' : '0.75rem';
  const esquerda = dock ? '0.75rem' : '10.75rem';
  return (
    <div
      className="relative h-full overflow-hidden"
      style={{
        ['--topo' as string]: topo,
        ['--base' as string]: base,
        ['--esq' as string]: esquerda,
      }}
    >
      {/* 1. o mundo 3D ocupa a tela toda; a interface flutua por cima */}
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
      <div id="palco-toasts" className="pointer-events-none absolute inset-0 z-[60]" />
      {vidro && <AvisosVidro />}

      {/* 2. barra superior */}
      {!apresentando &&
        (barraNova ? (
          <div className="absolute inset-x-3 top-3 z-40">
            <BarraSuperior />
          </div>
        ) : (
          <div className="absolute inset-x-0 top-0 z-40">
            <Cabecalho>
              <SeletorCenario />
              <SeletorFase />
              <IndicadorAlerta />
              <BotaoCartaCrise />
              <BotaoApresentacao />
              <SeletorQualidade />
              <PainelConfiguracao />
            </Cabecalho>
          </div>
        ))}
      {!apresentando && (
        <div className="absolute bottom-[calc(var(--base)+0.25rem)] left-[var(--esq)] z-30 w-[min(34rem,calc(100vw-1.5rem))]">
          <BannerCrise />
        </div>
      )}
      {apresentando && com3d && <ModoApresentacao com3d />}

      {/* 3. navegação: dock de vidro embaixo (ou o menu lateral da v1) */}
      {!apresentando &&
        (dock ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center">
            <div className="pointer-events-auto">
              <DockNavegacao />
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 top-[var(--topo)] z-30 flex">
            <Navegacao />
          </div>
        ))}

      {/* 4. painel da tela */}
      {!apresentando && <AvisoModoLeve />}
      {com3d ? (
        <>
          {!apresentando && (
            <div
              className={`absolute top-[var(--topo)] z-30 transition-[right] duration-300 ${painelFechado ? 'right-3' : 'right-[calc(min(33rem,100vw-1.5rem)+1.25rem)]'}`}
            >
              <GlassButton
                refrata
                onClick={() => setRecolhido(!recolhido)}
                aria-expanded={!recolhido}
                title={recolhido ? 'Mostrar o painel da tela' : 'Ocultar o painel e ver só o 3D'}
              >
                <Icone nome="painel" tamanho={16} />
                {recolhido ? 'Mostrar painel' : 'Ocultar painel'}
              </GlassButton>
            </div>
          )}
          <GlassPanel
            raio={22}
            refrata={vidroLateral}
            className={`painel-lateral !absolute bottom-[var(--base)] right-3 top-[var(--topo)] z-20 w-[min(33rem,calc(100vw-1.5rem))] transition-transform duration-300 ${painelFechado ? 'translate-x-[calc(100%+1.5rem)]' : ''}`}
            classeCorpo="h-full overflow-y-auto p-4"
            data-modo="3d"
            aria-hidden={apresentando || painelFechado}
          >
            <div className="flex flex-col gap-4 pb-6">
              <Modulo />
              <LegendaCamadas />
            </div>
          </GlassPanel>
        </>
      ) : (
        <div
          className="absolute inset-0 overflow-y-auto pb-[var(--base)] pl-[var(--esq)] pr-3 pt-[var(--topo)]"
          data-modo="2d"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10">
            {apresentando && <ModoApresentacao com3d={false} />}
            <Modulo />
            <LegendaCamadas />
          </div>
        </div>
      )}

      {/* 5. data dos dados + LGPD (sempre visível) */}
      {!apresentando &&
        (barraNova ? (
          <div className="pointer-events-none absolute bottom-3 left-[var(--esq)] z-30 max-w-[22rem]">
            <ChipDados />
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 z-30">
            <Rodape />
          </div>
        ))}
    </div>
  );
}
