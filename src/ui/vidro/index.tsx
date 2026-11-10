/**
 * Wrappers finos do liquid glass. O resto do app usa SÓ estes componentes, nunca os `lg-*`.
 *
 * Regra de ouro: os elementos da biblioteca reorganizam os próprios filhos (light DOM). Por isso
 * cada wrapper entrega ao elemento UM filho estável; o React só reconcilia dentro dele e nunca
 * precisa inserir ou remover nós que a biblioteca mudou de lugar.
 *
 * Fora do modo "refracao" (qualidade Média/2D, flag desligada) os wrappers desenham HTML comum com
 * as classes .vidro-* (src/ui/vidro/vidro.css).
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useModoVidro } from './modo';
import { carregarVidro, vidroCarregado } from './carregar';
import type { LgSegmentedEl, LgSliderEl, LgSwitchEl } from './lg';

/* ------------------------------------------------------------------------------------------ Painel */

interface PainelProps {
  children: ReactNode;
  className?: string;
  /** classes do conteúdo interno (padding, rolagem…) */
  classeCorpo?: string;
  raio?: number;
  style?: CSSProperties;
  /** false = nunca refrata (vidro simples), para poupar o orçamento de vidro */
  refrata?: boolean;
  role?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
  'data-modo'?: string;
  id?: string;
}

export function GlassPanel({
  children,
  className = '',
  classeCorpo = '',
  raio = 20,
  refrata = true,
  style,
  ...resto
}: PainelProps) {
  const modo = useModoVidro();
  if (modo === 'refracao' && refrata)
    return (
      <lg-panel
        class={`vidro-painel ${className}`}
        radius={raio}
        style={{ ...style, ['--raio' as string]: `${raio}px` }}
        {...resto}
      >
        <div className={`vidro-corpo ${classeCorpo}`}>{children}</div>
      </lg-panel>
    );
  return (
    <div
      className={`vidro-painel vidro-simples ${className}`}
      style={{ ...style, ['--raio' as string]: `${raio}px` }}
      {...resto}
    >
      <div className={`vidro-corpo ${classeCorpo}`}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------- Botão */

type BotaoProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  /** primario = preenchido claro; vidro = cápsula de vidro; sutil = só texto */
  variante?: 'vidro' | 'primario' | 'sutil' | 'perigo';
  compacto?: boolean;
  /** true = cápsula que refrata o fundo (conta no orçamento). Dentro de painéis de vidro, deixe false. */
  refrata?: boolean;
};

export function GlassButton({
  children,
  variante = 'vidro',
  compacto = true,
  refrata = false,
  className = '',
  disabled,
  onClick,
  ...resto
}: BotaoProps) {
  const modo = useModoVidro();
  const ref = useRef<HTMLElement>(null);
  const aria = Object.fromEntries(Object.entries(resto).filter(([k]) => k.startsWith('aria-')));
  const ariaJson = JSON.stringify(aria);
  useEffect(() => {
    // a lib cria o <button> real por dentro: repassa os atributos ARIA dinâmicos para ele
    const b = ref.current?.querySelector('button');
    if (!b) return;
    for (const [k, v] of Object.entries(JSON.parse(ariaJson) as Record<string, unknown>))
      if (v === undefined || v === null) b.removeAttribute(k);
      else b.setAttribute(k, String(v));
  });
  const classe = `vidro-botao vidro-botao--${variante} ${compacto ? 'vidro-botao--compacto' : ''} ${className}`;
  if (modo === 'refracao' && refrata && variante === 'vidro')
    return (
      <lg-button
        ref={ref}
        class={classe}
        disabled={disabled || undefined}
        title={resto.title}
        onClick={disabled ? undefined : (onClick as never)}
      >
        <span className="vidro-rotulo">{children}</span>
      </lg-button>
    );
  return (
    <button type="button" className={classe} disabled={disabled} onClick={onClick} {...resto}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------------------- Segmentado */

export interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
  titulo?: string;
}

export function GlassSegmented<T extends string>({
  valor,
  opcoes,
  onMudar,
  rotulo,
  className = '',
}: {
  valor: T;
  opcoes: Opcao<T>[];
  onMudar: (v: T) => void;
  rotulo: string;
  className?: string;
}) {
  const modo = useModoVidro();
  const host = useRef<HTMLSpanElement>(null);
  const el = useRef<LgSegmentedEl | null>(null);
  const cb = useRef(onMudar);
  cb.current = onMudar;
  const valorAtual = useRef(valor);
  valorAtual.current = valor;
  const chave = opcoes.map((o) => `${o.valor}=${o.rotulo}`).join('|');
  const refracao = modo === 'refracao';

  // O <lg-segmented> é criado à mão: o React 19 atribuiria `value` como propriedade antes de o
  // elemento montar, e o setter da biblioteca falha nesse momento. Assim o React nunca toca nele.
  useLayoutEffect(() => {
    if (!refracao || !host.current) return;
    const seg = document.createElement('lg-segmented') as LgSegmentedEl;
    seg.className = 'vidro-seg';
    seg.setAttribute('value', valorAtual.current);
    seg.setAttribute('label', rotulo);
    for (const o of opcoes) {
      const b = document.createElement('button');
      b.value = o.valor;
      b.textContent = o.rotulo;
      if (o.titulo) b.title = o.titulo;
      seg.append(b);
    }
    const ouvir = (e: Event) => {
      const v = (e as CustomEvent<{ value: string }>).detail?.value;
      if (v !== undefined && v !== valorAtual.current) cb.current(v as T);
    };
    seg.addEventListener('change', ouvir);
    host.current.append(seg);
    el.current = seg;
    return () => {
      seg.removeEventListener('change', ouvir);
      seg.remove();
      el.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refracao, chave, rotulo]);

  // valor controlado de fora (ex.: o Modo Apresentação troca o cenário): move a lente
  useEffect(() => {
    const sincronizar = () => {
      const seg = el.current;
      if (seg && customElements.get('lg-segmented') && seg.value !== valor) seg.value = valor;
    };
    if (vidroCarregado()) sincronizar();
    else void carregarVidro().then(sincronizar);
  }, [valor, refracao, chave]);

  if (refracao) return <span ref={host} className={`inline-flex ${className}`} />;
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={`vidro-seg vidro-seg--simples ${className}`}
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          title={o.titulo}
          onClick={() => onMudar(o.valor)}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ Switch */

export function GlassSwitch({
  ligado,
  onMudar,
  children,
  className = '',
}: {
  ligado: boolean;
  onMudar: (v: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  const modo = useModoVidro();
  const ref = useRef<LgSwitchEl>(null);
  const cb = useRef(onMudar);
  cb.current = onMudar;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ouvir = (e: Event) => {
      const alvo = e.target as HTMLInputElement;
      if (alvo?.type === 'checkbox') cb.current(alvo.checked);
    };
    el.addEventListener('change', ouvir);
    return () => el.removeEventListener('change', ouvir);
  }, [modo]);
  useEffect(() => {
    const el = ref.current;
    if (el && 'checked' in el && el.checked !== ligado) el.checked = ligado;
  }, [ligado, modo]);
  if (modo === 'refracao')
    return (
      <lg-switch ref={ref} class={`vidro-switch ${className}`} checked={ligado || undefined}>
        <span>{children}</span>
      </lg-switch>
    );
  return (
    <label className={`vidro-switch vidro-switch--simples ${className}`}>
      <span>{children}</span>
      <input
        type="checkbox"
        role="switch"
        checked={ligado}
        onChange={(e) => onMudar(e.target.checked)}
      />
    </label>
  );
}

/* ------------------------------------------------------------------------------------------ Slider */

export function GlassSlider({
  valor,
  min,
  max,
  passo,
  onMudar,
  rotulo,
  className = '',
}: {
  valor: number;
  min: number;
  max: number;
  passo: number;
  onMudar: (v: number) => void;
  rotulo: string;
  className?: string;
}) {
  const modo = useModoVidro();
  const ref = useRef<LgSliderEl>(null);
  const cb = useRef(onMudar);
  cb.current = onMudar;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ouvir = (e: Event) => {
      const alvo = e.target as HTMLInputElement;
      if (alvo?.type === 'range') cb.current(Number(alvo.value));
    };
    el.addEventListener('input', ouvir);
    return () => el.removeEventListener('input', ouvir);
  }, [modo]);
  useEffect(() => {
    const el = ref.current;
    if (el && vidroCarregado() && Math.abs(Number(el.value) - valor) > passo / 2) el.value = valor;
  }, [valor, passo, modo]);
  if (modo === 'refracao')
    return (
      <lg-slider
        ref={ref}
        class={`vidro-slider ${className}`}
        min={min}
        max={max}
        step={passo}
        value={valor}
        label={rotulo}
      />
    );
  return (
    <input
      type="range"
      className={`vidro-slider vidro-slider--simples ${className}`}
      min={min}
      max={max}
      step={passo}
      value={valor}
      aria-label={rotulo}
      onChange={(e) => onMudar(Number(e.target.value))}
    />
  );
}

/* -------------------------------------------------------------------------------------------- Dock */

export function GlassDock({
  children,
  className = '',
  rotulo,
}: {
  children: ReactNode;
  className?: string;
  rotulo: string;
}) {
  const modo = useModoVidro();
  if (modo === 'refracao')
    return (
      <lg-dock class={`vidro-dock ${className}`} radius={26} role="navigation" aria-label={rotulo}>
        {children}
      </lg-dock>
    );
  return (
    <nav
      aria-label={rotulo}
      className={`vidro-dock vidro-dock--simples vidro-simples ${className}`}
    >
      <div className="lg-dock__items">{children}</div>
    </nav>
  );
}

export { toastVidro } from './toast';
export { useModoVidro, useVidroGlobal, contarVidros } from './modo';
