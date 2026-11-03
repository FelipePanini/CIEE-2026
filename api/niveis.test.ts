import { describe, expect, it } from 'vitest';
import { buscarNiveis } from './niveis';

const xml = (linhas: [string, string][]) =>
  `<DataTable>${linhas
    .map(
      ([dh, nv]) =>
        `<DadosHidrometereologicos><CodEstacao>1</CodEstacao><DataHora>${dh}</DataHora><Nivel>${nv}</Nivel></DadosHidrometereologicos>`,
    )
    .join('')}</DataTable>`;

describe('/api/niveis', () => {
  it('devolve a leitura mais recente de cada estação no formato Dado', async () => {
    const buscar = async (url: string) => ({
      ok: true,
      status: 200,
      text: async () =>
        url.includes('86879300')
          ? xml([
              ['2026-11-03 10:00:00', '1290'],
              ['2026-11-03 11:00:00', '1286'],
            ])
          : xml([['2026-11-03 11:00:00', '118']]),
    });
    const r = await buscarNiveis(buscar, new Date('2026-11-03T15:00:00Z'));
    expect(r.ok).toBe(true);
    expect(r.estacoes['taquari-lajeado']).toMatchObject({
      valor: 12.86,
      unidade: 'm',
      camada: 'ATUAL',
      data_referencia: '2026-11-03T11:00',
    });
    expect(r.estacoes['guaiba-cais-maua']!.valor).toBe(1.18);
    expect(r.estacoes['guaiba-cais-maua']!.url).toContain('telemetriaws1.ana.gov.br');
  });

  it('marca a falha sem derrubar a outra estação', async () => {
    const buscar = async (url: string) =>
      url.includes('87450004')
        ? { ok: false, status: 503, text: async () => '' }
        : { ok: true, status: 200, text: async () => xml([['2026-11-03 11:00:00', '1286']]) };
    const r = await buscarNiveis(buscar, new Date('2026-11-03T15:00:00Z'));
    expect(r.ok).toBe(true);
    expect(r.erros).toEqual([{ estacao: 'guaiba-cais-maua', erro: 'HTTP 503' }]);
  });
});
