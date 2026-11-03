import { Cabecalho, LegendaCamadas, Rodape } from './ui/Cabecalho';
import { IndicadorAlerta, PainelConfiguracao, SeletorCenario, SeletorFase } from './ui/Controles';
import { BannerCrise, BotaoCartaCrise } from './ui/CartaCrise';
import { Navegacao, useRotaURL } from './ui/Navegacao';
import { moduloPorId } from './modules/registro';
import { useOperacao } from './store';

export function App() {
  useRotaURL();
  const tela = useOperacao((s) => s.tela);
  const Modulo = moduloPorId(tela).Painel2D;
  return (
    <div className="flex h-full flex-col">
      <Cabecalho>
        <SeletorCenario />
        <SeletorFase />
        <IndicadorAlerta />
        <BotaoCartaCrise />
        <PainelConfiguracao />
      </Cabecalho>
      <BannerCrise />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Navegacao />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10">
            <Modulo />
            <div className="pt-2">
              <LegendaCamadas />
            </div>
          </div>
        </main>
      </div>
      <Rodape />
    </div>
  );
}
