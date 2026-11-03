import { describe, expect, it } from 'vitest';
import { validar } from './validar-dados';

describe('Regra nº 1 — data/*.json', () => {
  it('todos os arquivos seguem o esquema, com fonte, url e camada', () => {
    const { erros, arquivos } = validar();
    expect(erros).toEqual([]);
    expect(arquivos).toBeGreaterThan(15);
  });
});
