# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 27/11/2026, 15:56:08.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **13.51 m** em 2026-11-27 15:30:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=25/07/2026&dataFim=27/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **1.05 m** em 2026-11-27 14:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=25/07/2026&dataFim=27/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 27/11/2026 06:43 — [Defesa Civil alerta: inundação do rio Uruguai. Risco MUITO ALTO de inundação em São Borja](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-inundacao-do-rio-uruguai-risco-muito-alto-de-inundacao-em-sao-borja-6b0950a7bca77)
- 23/11/2026 00:00 — [Defesa Civil mobiliza voluntários e reforça assistência a famílias atingidas em Tupanciretã](https://www.defesacivil.rs.gov.br/defesa-civil-mobiliza-voluntarios-e-reforca-assistencia-a-familias-atingidas-em-tupancireta)
- 26/11/2026 06:57 — [Defesa Civil alerta: inundação do rio Uruguai. Risco MUITO ALTO de inundação em São Borja](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-inundacao-do-rio-uruguai-risco-muito-alto-de-inundacao-em-irai-6b0839986c21e-6b0839cff0824)
- 25/11/2026 17:13 — [Defesa Civil alerta: inundação do rio Uruguai. Risco MUITO ALTO de inundação em Iraí](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-inundacao-do-rio-uruguai-risco-muito-alto-de-inundacao-em-irai-6b0839986c21e)
- 25/11/2026 14:31 — [Defesa Civil alerta: elevação do rio Uruguai. Risco ALTO de inundação entre Barra do Guarita e Porto Mauá](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-elevacao-do-rio-uruguai-risco-alto-de-inundacao-entre-barra-do-guarita-e-porto-maua)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
