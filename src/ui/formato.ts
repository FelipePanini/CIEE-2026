const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatarNumero(v: number, unidade?: string): string {
  if (unidade === 'R$') return brl.format(v);
  if (unidade === 'R$ compacto') return brlCompacto.format(v);
  if (unidade === 'm') return `${nf2.format(v)} m`;
  if (unidade === 'R$/km') return `${brl.format(v)}/km`;
  const abs = Math.abs(v);
  const s = abs >= 100 || Number.isInteger(v) ? nf0.format(v) : nf1.format(v);
  return unidade ? `${s} ${unidade}` : s;
}

export const fmt = {
  int: (v: number) => nf0.format(v),
  dec1: (v: number) => nf1.format(v),
  dec2: (v: number) => nf2.format(v),
  brl: (v: number) => brl.format(v),
  brlCompacto: (v: number) => brlCompacto.format(v),
  pct: (v: number) => `${nf0.format(v * 100)}%`,
};

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
