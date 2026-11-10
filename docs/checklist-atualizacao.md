# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 10/11/2026, 14:00:51.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **13.05 m** em 2026-11-10 13:30:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=08/07/2026&dataFim=10/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **1.33 m** em 2026-11-09 19:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=08/07/2026&dataFim=10/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 06/11/2026 18:13 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento, atuam nas proximidades de São José do Ouro](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-atuam-nas-proximidades-de-sao-jose-do-ouro)
- 06/11/2026 17:39 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento, atuam nas proximidades de Maximiliano de Almeida](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-atuam-nas-proximidades-de-maximiliano-de-almeida)
- 06/11/2026 17:07 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento, atuam nas proximidades de Erechim](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-atuam-nas-proximidades-de-erechim)
- 03/11/2026 17:06 — [Defesa Civil alerta: condição SEVERA para tempestade com granizo grande que atua nas proximidades de Mormaço, Espumoso e Tapera](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-severa-para-tempestade-com-granizo-grande-que-atua-nas-proximidades-de-mormaco-espumoso-e-tapera)
- 10/11/2026 08:12 — [Defesa Civil alerta: inundação do rio Uruguai. Risco MUITO ALTO de inundação em São Borja](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-inundacao-do-rio-uruguai-risco-muito-alto-de-inundacao-em-sao-borja)
- 06/11/2026 21:21 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento, atuam nas proximidades de Barracão](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-atuam-nas-proximidades-de-barracao)
- 06/11/2026 20:46 — [Defesa Civil alerta: elevação do rio Carreiro. Risco ALTO de inundação em Guaporé](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-elevacao-do-rio-carreiro-risco-alto-de-inundacao-em-guapore)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
