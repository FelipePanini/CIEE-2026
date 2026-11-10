import { useOperacao, type Qualidade } from '../store';

const OPCOES: { id: Qualidade; rotulo: string; dica: string }[] = [
  { id: 'alta', rotulo: 'Alta', dica: '3D com pós-processamento (GPU dedicada ou boa integrada)' },
  { id: 'media', rotulo: 'Média', dica: '3D leve, sem pós-processamento' },
  { id: '2d', rotulo: '2D', dica: 'Sem 3D: todos os dados em gráficos e tabelas' },
];

export function SeletorQualidade() {
  const q = useOperacao((s) => s.qualidade);
  const setQ = useOperacao((s) => s.setQualidade);
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const setPausado = useOperacao((s) => s.setAnimacoesPausadas);
  return (
    <div className="flex items-center gap-1">
      <div
        role="radiogroup"
        aria-label="Qualidade gráfica"
        className="flex rounded-md bg-superficie p-0.5 text-[0.68rem]"
      >
        {OPCOES.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={q === o.id}
            title={o.dica}
            onClick={() => setQ(o.id)}
            className={`rounded px-2 py-1 font-semibold ${q === o.id ? 'bg-cinza-2 text-fundo-0' : 'text-texto-2'}`}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      {q !== '2d' && (
        <button
          onClick={() => setPausado(!pausado)}
          title={pausado ? 'Retomar animações' : 'Pausar animações'}
          aria-pressed={pausado}
          className="rounded-md bg-superficie px-2 py-1 text-xs"
        >
          {pausado ? '▶' : '⏸'}
        </button>
      )}
    </div>
  );
}

export function AvisoModoLeve() {
  const sugerir = useOperacao((s) => s.sugestaoModoLeve);
  const setSugerir = useOperacao((s) => s.setSugestaoModoLeve);
  const setQ = useOperacao((s) => s.setQualidade);
  if (!sugerir) return null;
  return (
    <div
      role="status"
      className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-fundo-0 px-4 py-2 text-sm shadow-xl ring-1 ring-atencao/60"
    >
      <span>O 3D está abaixo de 60 fps nesta máquina. Usar o modo leve?</span>
      <button
        className="rounded bg-atencao px-2 py-1 text-xs font-bold text-fundo-0"
        onClick={() => {
          setQ('media');
          setSugerir(false);
        }}
      >
        Modo médio
      </button>
      <button
        className="rounded bg-superficie-2 px-2 py-1 text-xs"
        onClick={() => {
          setQ('2d');
          setSugerir(false);
        }}
      >
        2D
      </button>
      <button className="text-xs text-texto-2 underline" onClick={() => setSugerir(false)}>
        manter
      </button>
    </div>
  );
}
