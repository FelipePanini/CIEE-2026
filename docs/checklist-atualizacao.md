# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 20/11/2026, 14:47:09.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **12.86 m** em 2026-11-20 14:30:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=18/07/2026&dataFim=20/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **0.80 m** em 2026-11-20 14:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=18/07/2026&dataFim=20/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 20/11/2026 12:46 — [Defesa Civil alerta: condição de ALERTA para tempestades com granizo e vento que atuam nas proximidades de Esmeralda](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestades-com-granizo-e-vento-que-atuam-nas-proximidades-de-esmeralda)
- 20/11/2026 12:22 — [Defesa Civil alerta: condição de ALERTA para tempestades com granizo e vento que atuam nas proximidades de Santiago](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestades-com-granizo-e-vento-que-atuam-nas-proximidades-de-santiago)
- 20/11/2026 12:22 — [Defesa Civil alerta: condição de ALERTA para tempestades com granizo e vento que atuam nas proximidades de Júlio de Castilhos](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestades-com-granizo-e-vento-que-atuam-nas-proximidades-de-julio-de-castilhos)
- 20/11/2026 11:32 — [Defesa Civil alerta: condição de ALERTA para tempestades com granizo e vento que atuam nas proximidades de Itacurubi](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestades-com-granizo-e-vento-que-atuam-nas-proximidades-de-itacurubi)
- 20/11/2026 11:11 — [Defesa Civil alerta: condição de ALERTA para tempestades com granizo e vento que atuam nas proximidades de São Borja](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestades-com-granizo-e-vento-que-atuam-nas-proximidades-de-sao-borj-6b00552986ec9)
- 20/11/2026 07:18 — [Defesa Civil alerta: condição de ALERTA para chuva, granizo e vento que atuam nas proximidades de Vacaria](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuva-granizo-e-vento-que-atuam-nas-proximidades-de-vacaria)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
