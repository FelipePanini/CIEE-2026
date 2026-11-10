/**
 * Barra superior em três zonas, num único painel de vidro flutuante:
 *   esquerda = identidade · centro = contexto (cenário + frase de fase/boletim) · direita = ações.
 * Qualidade gráfica, pausar animações e critérios ficam agrupados no menu "⋯".
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CENARIOS, NIVEIS_ALERTA, type CenarioId } from '../engine/cenarios';
import { FASES } from '../engine/urgencia';
import { useOperacao, useResultado, type Qualidade } from '../store';
import { GlassButton, GlassPanel, GlassSegmented, GlassSwitch } from './vidro';
import { BotaoCartaCrise } from './CartaCrise';
import { PainelConfiguracao } from './Controles';
import { Icone } from './icones';

const BOLETINS = [
  { id: '2026-07', rotulo: '23/07 (pico)' },
  { id: '2026-09', rotulo: '22/09 (recente)' },
] as const;

/** Popover simples ancorado ao gatilho; fecha com Esc ou clique fora. */
function Popover({
  aberto,
  fechar,
  children,
  rotulo,
  alinhar = 'centro',
}: {
  aberto: boolean;
  fechar: () => void;
  children: ReactNode;
  rotulo: string;
  alinhar?: 'centro' | 'direita';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    const fora = (e: PointerEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) fechar();
    };
    window.addEventListener('keydown', tecla);
    window.addEventListener('pointerdown', fora);
    return () => {
      window.removeEventListener('keydown', tecla);
      window.removeEventListener('pointerdown', fora);
    };
  }, [aberto, fechar]);
  if (!aberto) return null;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={rotulo}
      className={`popover-vidro absolute top-[calc(100%+0.6rem)] z-50 w-72 ${alinhar === 'centro' ? 'left-1/2 -translate-x-1/2' : 'right-0'}`}
    >
      {children}
    </div>
  );
}

function Contexto() {
  const cenario = useOperacao((s) => s.entrada.cenario);
  const setCenario = useOperacao((s) => s.setCenario);
  const fase = useOperacao((s) => s.entrada.fase);
  const setFase = useOperacao((s) => s.setFase);
  const boletim = useOperacao((s) => s.entrada.boletim);
  const setBoletim = useOperacao((s) => s.setBoletim);
  const [aberto, setAberto] = useState(false);
  const nomeFase = FASES.find((f) => f.id === fase)!.rotulo.toLowerCase();
  const nomeBoletim = BOLETINS.find((b) => b.id === boletim)?.rotulo;
  return (
    <div className="relative flex min-w-0 flex-col items-center gap-1">
      <GlassSegmented<CenarioId>
        rotulo="Cenário"
        valor={cenario}
        onMudar={setCenario}
        opcoes={CENARIOS.map((c) => ({ valor: c.id, rotulo: c.curto, titulo: c.descricao }))}
      />
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className="max-w-full truncate rounded-full px-2 text-[0.7rem] leading-tight text-texto-2 underline decoration-dotted underline-offset-2 hover:text-texto"
        title="Mudar a fase e o boletim"
      >
        Fase: {nomeFase}
        {cenario === 'atual' && nomeBoletim ? ` · Boletim ${nomeBoletim}` : ''}
      </button>
      <Popover aberto={aberto} fechar={() => setAberto(false)} rotulo="Fase e boletim">
        <div className="flex flex-col gap-3 text-xs">
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 font-semibold text-texto-2">Fase da operação</legend>
            {FASES.map((f) => (
              <label
                key={f.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg p-1.5 hover:bg-superficie"
              >
                <input
                  type="radio"
                  name="fase"
                  className="mt-0.5 accent-texto"
                  checked={fase === f.id}
                  onChange={() => setFase(f.id)}
                />
                <span>
                  <strong className="block text-texto">{f.rotulo}</strong>
                  <span className="text-texto-2">{f.descricao}</span>
                </span>
              </label>
            ))}
          </fieldset>
          {cenario === 'atual' && (
            <fieldset className="flex flex-col gap-1">
              <legend className="mb-1 font-semibold text-texto-2">Boletim da Defesa Civil</legend>
              {BOLETINS.map((b) => (
                <label
                  key={b.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 hover:bg-superficie"
                >
                  <input
                    type="radio"
                    name="boletim"
                    className="accent-texto"
                    checked={boletim === b.id}
                    onChange={() => setBoletim(b.id)}
                  />
                  {b.rotulo}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      </Popover>
    </div>
  );
}

/** Indicador discreto: bolinha + nível. Só ganha cor (e pulsa) quando há alerta. */
function Status() {
  const r = useResultado();
  const n = NIVEIS_ALERTA[r.nivelAlerta]!;
  const ativo = r.nivelAlerta >= 1;
  return (
    <span
      role="status"
      className="flex items-center gap-1.5 whitespace-nowrap px-1 text-xs font-semibold"
      style={{ color: ativo ? `var(--color-${n.tom})` : 'var(--color-texto-2)' }}
      title="Nível de alerta da operação (deriva do cenário, dos rios e das Cartas de Crise)"
    >
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full bg-current ${r.nivelAlerta >= 2 ? 'anima-pulso' : ''}`}
      />
      {n.nome}
    </span>
  );
}

const QUALIDADES: { valor: Qualidade; rotulo: string; titulo: string }[] = [
  { valor: 'alta', rotulo: 'Alta', titulo: '3D completo com vidro que refrata' },
  { valor: 'media', rotulo: 'Média', titulo: '3D leve; vidro com desfoque simples' },
  { valor: '2d', rotulo: '2D', titulo: 'Sem 3D: tudo em gráficos e tabelas' },
];

function MenuMais() {
  const [aberto, setAberto] = useState(false);
  const q = useOperacao((s) => s.qualidade);
  const setQ = useOperacao((s) => s.setQualidade);
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const setPausado = useOperacao((s) => s.setAnimacoesPausadas);
  return (
    <div className="relative">
      <GlassButton
        variante="sutil"
        aria-label="Mais opções: qualidade gráfica, animações e critérios"
        aria-expanded={aberto}
        aria-haspopup="dialog"
        onClick={() => setAberto((v) => !v)}
        className="!px-2"
      >
        <Icone nome="mais" />
      </GlassButton>
      <Popover
        aberto={aberto}
        fechar={() => setAberto(false)}
        rotulo="Mais opções"
        alinhar="direita"
      >
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-texto-2">Qualidade gráfica</span>
            <GlassSegmented<Qualidade>
              rotulo="Qualidade gráfica"
              valor={q}
              onMudar={setQ}
              opcoes={QUALIDADES}
            />
          </div>
          <GlassSwitch ligado={pausado} onMudar={setPausado}>
            Pausar animações
          </GlassSwitch>
          <PainelConfiguracao
            gatilho={(abrir) => (
              <GlassButton
                variante="vidro"
                onClick={() => {
                  setAberto(false);
                  abrir();
                }}
                className="w-full"
              >
                Critérios do grupo
              </GlassButton>
            )}
          />
          <p className="text-[0.66rem] text-texto-3">Tecla F: painel de desempenho e flags.</p>
        </div>
      </Popover>
    </div>
  );
}

export function BarraSuperior() {
  const setApresentacao = useOperacao((s) => s.setApresentacao);
  return (
    <GlassPanel
      raio={22}
      className="barra-superior"
      classeCorpo="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-6 px-5 py-2.5"
      role="banner"
    >
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="font-display truncate text-lg text-texto">Central de Comando</span>
        <span className="truncate text-[0.7rem] text-texto-2">
          Solução Distribuidora · Ação Social RS
        </span>
      </div>
      <Contexto />
      <div className="flex min-w-0 items-center justify-end gap-2">
        <Status />
        <BotaoCartaCrise
          gatilho={(abrir) => (
            <GlassButton variante="primario" onClick={abrir}>
              <Icone nome="carta" tamanho={16} />
              Carta de Crise
            </GlassButton>
          )}
        />
        <GlassButton
          variante="vidro"
          onClick={() => setApresentacao({ ativa: true, etapa: 0 })}
          title="Modo Apresentação (tela cheia, navegação pelas setas)"
        >
          <Icone nome="apresentar" tamanho={15} />
          Apresentar
        </GlassButton>
        <MenuMais />
      </div>
    </GlassPanel>
  );
}
