import { Cabecalho, LegendaCamadas, Rodape } from './ui/Cabecalho';
import { TelaFontes } from './modules/fontes/TelaFontes';

export function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Cabecalho>
        <LegendaCamadas />
      </Cabecalho>
      <main className="flex-1">
        <TelaFontes />
      </main>
      <Rodape />
    </div>
  );
}
