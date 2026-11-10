import { describe, expect, it } from 'vitest';
import { cenaDaTela, nivelDaDistancia } from './zoom';

describe('zoom e cenas', () => {
  it('a distância da câmera vira nível de narrativa', () => {
    expect(nivelDaDistancia(20)).toBe('cidade');
    expect(nivelDaDistancia(120)).toBe('bacia');
    expect(nivelDaDistancia(500)).toBe('corredor');
    expect(nivelDaDistancia(1400)).toBe('pais');
  });
  it('cada tela mostra só a própria cena', () => {
    expect(cenaDaTela('panorama')).toBe('bacia');
    expect(cenaDaTela('rotas')).toBe('bacia');
    expect(cenaDaTela('quadra')).toBe('quadra');
    expect(cenaDaTela('urgencia')).toBe('prateleira');
    expect(cenaDaTela('fontes')).toBe('bastidores');
  });
});
