import { describe, expect, it } from 'vitest';
import { aplicarLista, FLAGS_PADRAO } from './flags';

describe('feature flags', () => {
  it('"-a,+b" desliga e liga; nomes desconhecidos são ignorados', () => {
    const f = aplicarLista({ ...FLAGS_PADRAO }, '-vidro, -corredorSP,+dock,naoExiste');
    expect(f.vidro).toBe(false);
    expect(f.corredorSP).toBe(false);
    expect(f.dock).toBe(true);
    expect(Object.keys(f)).toEqual(Object.keys(FLAGS_PADRAO));
  });
});
