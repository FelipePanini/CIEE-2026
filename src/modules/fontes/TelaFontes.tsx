import { useNivelAtual } from '../../store';
import { camadasArquitetura, INVENTARIO } from './arquitetura';
import { TituloTela } from '../../ui/blocos';
import { SeloCamada } from '../../ui/SeloCamada';
import { corCamada } from '../../ui/cores';
import { CAMADAS } from '../../engine/tipos';
import { ROTULO_CAMADA } from '../../engine/camadas';
import { DADOS, nomeMunicipio } from '../../data/carregar';
import { Numero } from '../../ui/Numero';
import { fmt } from '../../ui/formato';

/** Fase 1: vitrine da camada de dados — cada número com selo, fonte e data. */
export function TelaFontes() {
  const { eventos, rios, previsao, orcamento, precos, esfera } = DADOS;
  return (
    <div className="flex flex-col gap-6">
      <Arquitetura />
      <section className="flex flex-col gap-2">
        <h2 className="font-display text-2xl text-texto sm:text-3xl">
          A enchente não acabou em 2024.
        </h2>
        <p className="max-w-3xl text-texto-2">
          Cheias com pessoas fora de casa no RS de 2024 a 2026 — e a previsão para os próximos
          meses. Passe o mouse (ou toque) em qualquer número para ver a fonte, o link e a data.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {eventos.eventos.map((e) => (
          <article key={e.id} className="painel flex flex-col gap-2 p-4">
            <header className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-xl text-texto">{e.rotulo_curto}</h2>
              <span className="text-[0.65rem] uppercase tracking-wider text-texto-2">
                {e.bacia_principal}
              </span>
            </header>
            <p className="text-xs leading-snug text-texto-2">{e.resumo}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="opacity-70">Municípios</dt>
              <dd>
                <Numero dado={e.indicadores.municipios_afetados} formatar={fmt.int} />
              </dd>
              <dt className="opacity-70">Desabrigados</dt>
              <dd>
                <Numero dado={e.indicadores.desabrigados} formatar={fmt.int} />
              </dd>
              <dt className="opacity-70">Desalojados</dt>
              <dd>
                <Numero dado={e.indicadores.desalojados} formatar={fmt.int} />
              </dd>
              {e.indicadores.fora_de_casa && (
                <>
                  <dt className="opacity-70">Fora de casa</dt>
                  <dd>
                    <Numero dado={e.indicadores.fora_de_casa} formatar={fmt.int} />
                  </dd>
                </>
              )}
              {e.picos.map((p, i) => (
                <div key={i} className="contents">
                  <dt className="opacity-70">
                    Pico {p.estacao.startsWith('guaiba') ? 'Guaíba' : 'Taquari'}
                  </dt>
                  <dd>
                    <Numero dado={p.nivel} formatar={(v) => `${fmt.dec2(v)} m`} />
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-1">
              <Numero dado={e.indicadores.municipios_afetados} selo>
                <span className="sr-only">camada</span>
              </Numero>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <article className="painel p-4">
          <h2 className="font-display mb-2 text-lg">Rios agora</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {rios.estacoes.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3">
                <span className="min-w-56 opacity-80">{r.nome}</span>
                <NivelAtual estacao={r.id} />
                <span className="text-xs opacity-70">
                  cota de inundação{' '}
                  <Numero dado={r.cota_inundacao} formatar={(v) => `${fmt.dec2(v)} m`} />
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="painel p-4">
          <h2 className="font-display mb-2 text-lg">Próximos meses</h2>
          {previsao.prognosticos.map((p) => (
            <div key={p.id} className="mb-2 text-sm">
              <p className="font-semibold text-texto-2">{p.orgao}</p>
              <p className="text-xs text-texto-2">{p.resumo}</p>
              <div className="mt-1 flex flex-wrap gap-3">
                {p.indicadores.map((i) => (
                  <span key={i.id} className="text-xs">
                    {i.rotulo}: <Numero dado={i.dado} selo />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="painel p-4 text-sm">
          <h2 className="font-display mb-2 text-lg">Orçamento de referência</h2>
          <p>
            Pix SOS RS arrecadou{' '}
            <Numero dado={orcamento.pix_sos_rs.arrecadado!} formatar={fmt.brl} selo />
          </p>
          <p className="mt-1">
            <Numero dado={orcamento.pix_sos_rs.familias_beneficiadas!} formatar={fmt.int} />{' '}
            famílias receberam{' '}
            <Numero dado={orcamento.pix_sos_rs.valor_por_familia!} formatar={fmt.brl} />
          </p>
        </article>
        <article className="painel p-4 text-sm">
          <h2 className="font-display mb-2 text-lg">Preços (Porto Alegre)</h2>
          <p>
            Cesta básica DIEESE: <Numero dado={precos.cesta_dieese_total} formatar={fmt.brl} selo />
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
            {precos.produtos.slice(0, 10).map((p) => (
              <li key={p.id}>
                {p.nome}: <Numero dado={p.preco} formatar={fmt.brl} />
              </li>
            ))}
          </ul>
        </article>
        <article className="painel p-4 text-sm">
          <h2 className="font-display mb-2 text-lg">Padrões humanitários</h2>
          <ul className="flex flex-col gap-1 text-xs">
            <li>
              Água (mínimo total): <Numero dado={esfera.padroes.agua_total_min_l!} selo />
            </li>
            <li>
              Energia: <Numero dado={esfera.padroes.energia_kcal!} />
            </li>
            <li>
              Sabonete: <Numero dado={esfera.padroes.sabonete_banho_g_mes!} />
            </li>
            <li>
              Espaço (clima frio): <Numero dado={esfera.padroes.espaco_frio_m2!} />
            </li>
          </ul>
        </article>
      </section>

      <section className="painel p-4 text-sm">
        <h2 className="font-display mb-2 text-lg">Municípios no recorte</h2>
        <div className="grid gap-1 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {DADOS.municipios.municipios.map((m) => (
            <span key={m.ibge}>
              {nomeMunicipio(m.ibge)} · <Numero dado={m.populacao} formatar={fmt.int} />
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function NivelAtual({ estacao }: { estacao: string }) {
  const d = useNivelAtual(estacao);
  return <Numero dado={d} formatar={(v) => `${fmt.dec2(v)} m`} selo />;
}

/** Equivalente 2D dos Bastidores 3D: as 4 camadas com as contagens reais e o inventário por camada. */
function Arquitetura() {
  const camadas = camadasArquitetura();
  const total = INVENTARIO.dados || 1;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="titulo-arquitetura">
      <TituloTela
        titulo="Bastidores e fontes"
        area="geral"
        pergunta="como o sistema é organizado"
      />
      <ol className="grid gap-2 md:grid-cols-4" id="titulo-arquitetura">
        {camadas.map((c, i) => (
          <li
            key={c.id}
            className="painel flex flex-col gap-1 p-3"
            style={{ borderTop: `4px solid ${c.cor}` }}
          >
            <span className="font-display text-lg">
              {i + 1}. {c.nome}
              {i < camadas.length - 1 && (
                <span aria-hidden className="ml-2 text-texto-2">
                  →
                </span>
              )}
            </span>
            {c.linhas.map((l) => (
              <span key={l} className="text-xs text-texto-2">
                {l}
              </span>
            ))}
          </li>
        ))}
      </ol>
      <figure className="painel flex flex-col gap-2 p-3">
        <figcaption className="text-xs font-semibold">
          {INVENTARIO.dados} números com fonte, por camada
        </figcaption>
        <div
          className="flex h-5 w-full gap-[2px] overflow-hidden rounded"
          role="img"
          aria-label={CAMADAS.map((c) => `${ROTULO_CAMADA[c]}: ${INVENTARIO.porCamada[c]}`).join(
            ', ',
          )}
        >
          {CAMADAS.map((c) => (
            <div
              key={c}
              title={`${ROTULO_CAMADA[c]}: ${INVENTARIO.porCamada[c]}`}
              style={{
                width: `${(INVENTARIO.porCamada[c] / total) * 100}%`,
                background: corCamada(c),
              }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {CAMADAS.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <SeloCamada camada={c} /> {INVENTARIO.porCamada[c]}
            </span>
          ))}
          <span className="text-texto-2">· {INVENTARIO.aConfirmar} marcados A CONFIRMAR</span>
        </div>
        <p className="text-[0.68rem] text-texto-2">
          Domínios consultados: {INVENTARIO.dominios.join(' · ')}
        </p>
      </figure>
    </section>
  );
}
