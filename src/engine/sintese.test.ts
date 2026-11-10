import { describe, expect, it } from 'vitest';
import { DADOS } from '../data/carregar';
import { simular, type Entrada } from './simulacao';
import { PARAMETROS_PADRAO } from './parametros';
import { VOLUNTARIOS_PADRAO } from './producao';
import {
  abrigosAtivos,
  foraDeCasa,
  fraseSintese,
  mudancas,
  municipiosCriticos,
  riosAcimaDaCota,
} from './sintese';
import { eventoReferencia } from './cenarios';

const base = (o: Partial<Entrada> = {}): Entrada => ({
  cenario: 'case',
  boletim: '2026-07',
  fase: 'cheia',
  parametros: PARAMETROS_PADRAO,
  pesos: {},
  voluntarios: VOLUNTARIOS_PADRAO,
  bloqueiosManuais: [],
  importarBloqueiosReais: false,
  ajustes: [],
  eventos: [],
  niveis: {},
  agora: '2026-11-10T12:00:00-03:00',
  ...o,
});

describe('panorama em 5 segundos', () => {
  it('a frase-síntese traz rio, pessoas e previsão, cada número com a sua fonte', () => {
    const e = base();
    const f = fraseSintese(DADOS, simular(DADOS, e), eventoReferencia(e.cenario, e.boletim));
    expect(f).toHaveLength(3);
    expect(f[0]!.depois).toContain('da cota');
    expect(f[1]!.dado && 'fonte' in f[1]!.dado && f[1]!.dado.fonte).toBeTruthy();
    expect(f[2]!.dado && 'camada' in f[2]!.dado && f[2]!.dado.camada).toBe('PREVISAO');
  });

  it('nível simulado acima da cota vira alerta e é marcado como simulado', () => {
    const e = base({ niveis: { 'guaiba-cais-maua': 5.35 } });
    const r = simular(DADOS, e);
    const f = fraseSintese(DADOS, r, '2024-05');
    expect(f[0]!.tom).toBe('alerta');
    expect(f[0]!.depois).toContain('acima da cota (nível simulado)');
    expect(riosAcimaDaCota(DADOS, r).valor).toBe(1);
  });

  it('sem evento (Prontidão) a frase diz que não há cheia ativa', () => {
    const e = base({ cenario: 'prontidao', fase: 'prontidao' });
    const f = fraseSintese(DADOS, simular(DADOS, e), eventoReferencia(e.cenario, e.boletim));
    expect(f[1]!.antes).toContain('nenhuma cheia ativa');
  });

  it('fora de casa = desabrigados + desalojados quando o boletim não traz o total', () => {
    const ev = DADOS.eventos.eventos.find((x) => x.id === '2024-05')!;
    const f = foraDeCasa(ev)!;
    expect(f.valor).toBe(81285 + 581638);
    expect('formula' in f).toBe(true);
  });

  it('"o que mudou" compara com o evento anterior e não inventa quando falta dado', () => {
    const m = mudancas(DADOS, '2026-07')!;
    expect(m.de).toBe('Jun/2025');
    const des = m.itens.find((i) => i.rotulo === 'Desabrigados')!;
    expect(des.variacao).toBeCloseTo((1207 - 1583) / 1583, 5);
    const set = mudancas(DADOS, '2026-09')!;
    expect(set.itens.find((i) => i.rotulo === 'Municípios afetados')!.variacao).toBeNull();
    expect(mudancas(DADOS, '2024-05')).toBeNull();
  });

  it('municípios críticos saem do motor, ordenados por urgência', () => {
    const r = simular(DADOS, base());
    const top = municipiosCriticos(r);
    expect(top.length).toBeGreaterThan(0);
    expect(top.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < top.length; i++)
      expect(top[i - 1]!.urgencia).toBeGreaterThanOrEqual(top[i]!.urgencia);
    expect(abrigosAtivos(r).valor).toBe(r.locais.filter((l) => l.pessoasN > 0).length);
  });
});
