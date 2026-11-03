import { describe, expect, it } from 'vitest';
import { DADOS } from '../data/carregar';
import { simular, type Entrada } from './simulacao';
import { PARAMETROS_PADRAO } from './parametros';
import { VOLUNTARIOS_PADRAO } from './producao';
import { procedencia } from './camadas';

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
  agora: '2026-11-03T12:00:00-03:00',
  ...o,
});

describe('motor de simulação', () => {
  it('os três cenários respondem com locais, rotas e custos', () => {
    for (const cenario of ['case', 'atual', 'prontidao'] as const) {
      const r = simular(DADOS, base({ cenario }));
      expect(r.locais.length).toBeGreaterThan(2);
      expect(r.kit.custo.valor).toBeGreaterThan(0);
      expect(r.alertas.length).toBeGreaterThan(0);
    }
    expect(simular(DADOS, base({ cenario: 'prontidao' })).custos.prevenirReagir).not.toBeNull();
  });

  it('visão sistêmica: bloquear rotas muda ETA → urgência → metas → semáforo da Logística', () => {
    const r0 = simular(DADOS, base());
    const r1 = simular(DADOS, base({ importarBloqueiosReais: true }));
    expect(r1.arestasBloqueadas.length).toBeGreaterThan(0);
    const u = (r: typeof r0) =>
      r.locais.reduce((s, l) => s + l.urgencias.reduce((a, x) => a + x.urgencia.valor, 0), 0);
    expect(u(r1)).toBeGreaterThanOrEqual(u(r0));
    expect(r1.semaforo.logistica).not.toBe('verde');
  });

  it('Carta de Crise: +500 pessoas sobe a urgência; desfazer volta exatamente ao estado anterior', () => {
    const e0 = base({ cenario: 'atual' });
    const r0 = simular(DADOS, e0);
    const t0 = performance.now();
    const r1 = simular(DADOS, {
      ...e0,
      eventos: [{ uid: 'x1', carta: 'mais-500', em: '2026-11-03T12:05:00-03:00' }],
    });
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(1000);
    const imig = (r: typeof r0) => r.locais.find((l) => l.id === 'a-lajeado-imigrante')!;
    expect(imig(r1).pessoasN).toBe(imig(r0).pessoasN + 500);
    expect(imig(r1).urgenciaMax).toBeGreaterThan(imig(r0).urgenciaMax);
    expect(r1.decisoes).toHaveLength(1);
    const desfeito = simular(DADOS, { ...e0, eventos: [] });
    expect(JSON.stringify(desfeito.locais)).toBe(JSON.stringify(r0.locais));
  });

  it('ponto lotado gera alerta automático para a Logística e entra na rota', () => {
    const r = simular(
      DADOS,
      base({ eventos: [{ uid: 'p', carta: 'ponto-lotado', em: '2026-11-03T12:00:00-03:00' }] }),
    );
    const pt = r.pontos.find((p) => p.id === 'p-canoas-centro')!;
    expect(pt.lotado).toBe(true);
    expect(r.alertas.some((a) => a.area === 'logistica' && a.id.startsWith('lotado'))).toBe(true);
    expect(r.rotas.some((ro) => ro.paradas.some((p) => p.no === 'p-canoas-centro'))).toBe(true);
  });

  it('frente fria aplica 4,5 m²/pessoa (Esfera) e reduz a capacidade das quadras', () => {
    const r0 = simular(DADOS, base());
    const r1 = simular(
      DADOS,
      base({ eventos: [{ uid: 'f', carta: 'frente-fria', em: '2026-11-03T12:00:00-03:00' }] }),
    );
    expect(r1.locais[1]!.capacidade.valor).toBeLessThan(r0.locais[1]!.capacidade.valor);
  });

  it('número exibido carrega camadas reais e simuladas na procedência', () => {
    const r = simular(DADOS, base());
    const p = procedencia(r.custos.total);
    expect(p.camadas).toContain('ATUAL');
    expect(p.camadas).toContain('SIMULADO');
  });
});
