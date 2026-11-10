import { useEffect, useState } from 'react';
import { useOperacao, useResultado } from '../../store';
import { Botao, Grade, Painel, Semaforo, TituloTela, AREA_ROTULO } from '../../ui/blocos';
import { AREAS_ORG, CRONOGRAMA, DURACAO_TOTAL_MIN, PAPEIS, type AreaOrg } from './organograma';
import type { Alerta } from '../../engine/simulacao';
import { cor } from '../../ui/cores';

const COR_NIVEL: Record<Alerta['nivel'], string> = {
  info: cor('cinza-2'),
  atencao: cor('atencao'),
  alerta: cor('alerta'),
  critico: cor('alerta'),
};

function useAgora(ativo: boolean) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return;
    const id = window.setInterval(() => setT(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [ativo]);
  return t;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function Cronograma() {
  const c = useOperacao((s) => s.cronometro);
  const iniciar = useOperacao((s) => s.iniciarCronometro);
  const pausar = useOperacao((s) => s.pausarCronometro);
  const zerar = useOperacao((s) => s.zerarCronometro);
  const marcos = useOperacao((s) => s.marcos);
  const alternar = useOperacao((s) => s.alternarMarco);
  const agora = useAgora(!!c.inicio);
  const decorrido = c.acumuladoMs + (c.inicio ? agora - c.inicio : 0);
  const min = decorrido / 60000;
  let acc = 0;
  const fases = CRONOGRAMA.map((f) => {
    const ini = acc;
    acc += f.minutos;
    return { ...f, ini, fim: acc };
  });
  const atual = fases.find((f) => min >= f.ini && min < f.fim);
  const folga = DURACAO_TOTAL_MIN - acc;
  return (
    <Painel
      titulo="Cronograma tático — 4 horas"
      acao={
        <span className="font-display text-2xl tabular-nums text-texto">{mmss(decorrido)}</span>
      }
    >
      <div
        className="flex h-10 overflow-hidden rounded-lg"
        role="img"
        aria-label="Linha do cronograma de 4 horas"
      >
        {fases.map((f) => (
          <div
            key={f.id}
            className="relative flex items-center justify-center text-[0.68rem] font-bold"
            style={{
              width: `${(f.minutos / DURACAO_TOTAL_MIN) * 100}%`,
              background: f.cor,
              color: f.id === 'producao' ? cor('texto') : cor('fundo-0'),
            }}
          >
            {f.nome} ·{' '}
            {f.minutos >= 60
              ? `${Math.floor(f.minutos / 60)}h${f.minutos % 60 ? String(f.minutos % 60).padStart(2, '0') : ''}`
              : `${f.minutos} min`}
          </div>
        ))}
        {folga > 0 && (
          <div
            className="flex items-center justify-center bg-superficie-2 text-[0.62rem] text-texto-2"
            style={{ width: `${(folga / DURACAO_TOTAL_MIN) * 100}%` }}
          >
            folga {folga} min
          </div>
        )}
      </div>
      <div className="relative h-1 rounded bg-superficie-2">
        <div
          className="absolute -top-1 h-3 w-0.5 bg-texto"
          style={{ left: `${Math.min(100, (min / DURACAO_TOTAL_MIN) * 100)}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {c.inicio ? (
          <Botao onClick={pausar}>⏸ Pausar</Botao>
        ) : (
          <Botao tipo="primario" onClick={iniciar}>
            ▶ Iniciar operação
          </Botao>
        )}
        <Botao onClick={zerar}>Zerar</Botao>
        <span className="text-xs text-texto-2">
          {atual
            ? `Fase atual: ${atual.nome} — entrega: ${atual.entrega}`
            : min >= acc
              ? 'Cronograma concluído'
              : 'Aguardando início'}
        </span>
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {fases.map((f) => {
          const atrasado = min > f.fim && !marcos.includes(f.id);
          return (
            <li key={f.id}>
              <label className={`flex items-center gap-2 ${atrasado ? 'text-alerta' : ''}`}>
                <input
                  type="checkbox"
                  checked={marcos.includes(f.id)}
                  onChange={() => alternar(f.id)}
                  className="accent-texto"
                />
                Marco {f.nome}: {f.entrega} {atrasado && '— atrasado'}
              </label>
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}

export function CentralAlertas({ limite = 12 }: { limite?: number }) {
  const r = useResultado();
  const mensagens = useOperacao((s) => s.mensagens);
  const enviar = useOperacao((s) => s.enviarMensagem);
  const [para, setPara] = useState<AreaOrg>('logistica');
  const [texto, setTexto] = useState('');
  const itens = [
    ...r.alertas.map((a) => ({ ...a, tipo: 'alerta' as const })),
    ...mensagens.map((m) => ({
      id: m.uid,
      em: m.em,
      nivel: 'info' as const,
      area: m.para as Alerta['area'],
      titulo: `Mensagem: ${AREA_ROTULO[m.de as AreaOrg] ?? m.de} → ${AREA_ROTULO[m.para as AreaOrg] ?? m.para}`,
      mensagem: m.texto,
      tipo: 'msg' as const,
    })),
  ].sort((a, b) => b.em.localeCompare(a.em));
  return (
    <Painel
      titulo="Central de alertas"
      acao={
        <span className="text-[0.65rem] text-texto-2">
          mensagens claras e datadas para as equipes
        </span>
      }
    >
      <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
        {itens.slice(0, limite).map((a) => (
          <li
            key={a.id}
            className="rounded-lg bg-superficie p-2 text-xs"
            style={{ borderLeft: `4px solid ${COR_NIVEL[a.nivel]}` }}
          >
            <div className="flex justify-between gap-2">
              <strong>{a.titulo}</strong>
              <time className="shrink-0 tabular-nums text-texto-2" dateTime={a.em}>
                {new Date(a.em).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
            <p className="text-texto-2">{a.mensagem}</p>
            <p className="text-[0.62rem] uppercase tracking-wider text-texto-2">
              {a.nivel} · para {AREA_ROTULO[a.area as keyof typeof AREA_ROTULO] ?? a.area}
            </p>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap gap-2 text-xs"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          enviar({ de: 'lider', para, texto: texto.trim().slice(0, 200) });
          setTexto('');
        }}
      >
        <select
          value={para}
          onChange={(e) => setPara(e.target.value as AreaOrg)}
          className="rounded bg-superficie px-2 py-1.5"
          aria-label="Área de destino"
        >
          {AREAS_ORG.filter((a) => a.id !== 'lider').map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Mensagem do líder…"
          className="min-w-40 flex-1 rounded bg-superficie px-2 py-1.5"
          aria-label="Mensagem"
        />
        <Botao tipo="primario" type="submit">
          Enviar
        </Botao>
      </form>
    </Painel>
  );
}

export function OrganogramaEditavel() {
  const nomes = useOperacao((s) => s.organograma);
  const setNome = useOperacao((s) => s.setNomePapel);
  const r = useResultado();
  const corArea = (a: AreaOrg) => (a === 'lider' ? null : r.semaforo[a]);
  return (
    <Painel
      titulo="Organograma da operação"
      acao={<span className="text-[0.65rem] text-texto-2">nomes ficam só neste navegador</span>}
    >
      <div className="flex flex-col items-center gap-3">
        {AREAS_ORG.filter((a) => a.id === 'lider').map((a) => (
          <div
            key={a.id}
            className="w-full max-w-sm rounded-xl bg-claro p-3 text-center text-fundo-0"
          >
            <p className="text-xs font-bold uppercase tracking-wider">{a.nome}</p>
            <input
              value={nomes.lider ?? ''}
              onChange={(e) => setNome('lider', e.target.value)}
              placeholder="(nome eleito pelo grupo)"
              className="mt-1 w-full rounded bg-branco/60 px-2 py-1 text-center text-sm font-semibold placeholder:text-fundo-0"
              aria-label="Nome do Líder do Projeto"
            />
            <p className="mt-1 text-[0.65rem]">{a.missao}</p>
          </div>
        ))}
        <div
          className="grid w-full gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px,100%),1fr))' }}
        >
          {AREAS_ORG.filter((a) => a.id !== 'lider').map((a) => (
            <div key={a.id} className="painel-claro flex flex-col gap-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wider">{a.nome}</p>
                {corArea(a.id) && <Semaforo cor={corArea(a.id)!} />}
              </div>
              <p className="text-[0.65rem] text-fundo-3">{a.missao}</p>
              {PAPEIS.filter((p) => p.area === a.id).map((p) => (
                <label key={p.id} className="flex flex-col text-[0.7rem]">
                  <span className="font-semibold">{p.titulo}</span>
                  <input
                    value={nomes[p.id] ?? ''}
                    onChange={(e) => setNome(p.id, e.target.value)}
                    placeholder="(nome)"
                    className="rounded bg-branco/70 px-2 py-0.5 text-sm"
                    aria-label={p.titulo}
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Painel>
  );
}

export function LinhaDecisoes() {
  const r = useResultado();
  const desfazer = useOperacao((s) => s.desfazerCarta);
  if (!r.decisoes.length) return null;
  return (
    <Painel titulo="Linha do tempo de decisões (Cartas de Crise)">
      <ol className="flex flex-col gap-2 text-xs">
        {r.decisoes.map((d) => (
          <li key={d.uid} className="rounded-lg bg-superficie p-2">
            <div className="flex justify-between gap-2">
              <strong>
                {new Date(d.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                · {d.titulo}
              </strong>
              <button onClick={() => desfazer(d.uid)} className="text-alerta underline">
                desfazer
              </button>
            </div>
            <p className="text-texto-2">Resposta sugerida: {d.resposta}</p>
            {d.inspirado && (
              <a
                href={d.inspirado.url}
                target="_blank"
                rel="noreferrer"
                className="text-texto-2 underline"
              >
                Inspirado em fato real: {d.inspirado.texto}
              </a>
            )}
          </li>
        ))}
      </ol>
    </Painel>
  );
}

export function Painel2DAdministracao() {
  const r = useResultado();
  return (
    <div className="flex flex-col gap-4">
      <TituloTela
        titulo="Administração — o plano vivo"
        area="administracao"
        pergunta="organização e prazos"
      />
      <Grade min={160}>
        {(['administracao', 'comercio', 'logistica', 'producao'] as const).map((a) => (
          <div key={a} className="painel flex items-center justify-between gap-2 p-3">
            <span className="text-sm font-semibold">{AREA_ROTULO[a]}</span>
            <Semaforo cor={r.semaforo[a]} />
          </div>
        ))}
      </Grade>
      <Cronograma />
      <Grade min={360}>
        <CentralAlertas />
        <LinhaDecisoes />
      </Grade>
      <OrganogramaEditavel />
    </div>
  );
}
