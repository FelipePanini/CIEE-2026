import { Cabecalho, Rodape } from './ui/Cabecalho';
import { IndicadorAlerta, PainelConfiguracao, SeletorCenario, SeletorFase } from './ui/Controles';
import { ResumoMotor } from './modules/resumo/ResumoMotor';
import { TelaFontes } from './modules/fontes/TelaFontes';

export function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Cabecalho>
        <SeletorCenario />
        <SeletorFase />
        <IndicadorAlerta />
        <PainelConfiguracao />
      </Cabecalho>
      <main className="flex-1">
        <ResumoMotor />
        <TelaFontes />
      </main>
      <Rodape />
    </div>
  );
}
