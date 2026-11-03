import { describe, expect, it } from 'vitest';
import { DADOS, nomeMunicipio } from '../data/carregar';
import { simular } from './simulacao';
import { PARAMETROS_PADRAO } from './parametros';
import { VOLUNTARIOS_PADRAO } from './producao';
import { codigoKit, jornadaKit } from './rastreio';

const r = simular(DADOS, {
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
});

describe('rastreio do kit', () => {
  it('é determinístico e termina num abrigo do cenário', () => {
    const c = codigoKit(2026, 42);
    expect(c).toBe('KIT-2026-0042');
    const a = jornadaKit(c, r, DADOS, ['Força!'], nomeMunicipio)!;
    const b = jornadaKit(c, r, DADOS, ['Força!'], nomeMunicipio)!;
    expect(a).toEqual(b);
    expect(a.etapas[0]!.id).toBe('coleta');
    expect(a.etapas.at(-1)!.id).toBe('entrega');
    expect(r.locais.some((l) => l.nome === a.destino.nome)).toBe(true);
  });

  it('recusa códigos fora do padrão e não carrega dado de família', () => {
    expect(jornadaKit('qualquer-coisa', r, DADOS, [], nomeMunicipio)).toBeNull();
    const j = jornadaKit(codigoKit(2026, 7), r, DADOS, [], nomeMunicipio)!;
    const texto = JSON.stringify(j).toLowerCase();
    for (const proibido of ['cpf', 'telefone', 'família ', 'nome da família', 'endereço'])
      expect(texto).not.toContain(proibido);
  });
});
