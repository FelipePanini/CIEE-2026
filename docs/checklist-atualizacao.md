# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 14/11/2026, 12:47:54.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **12.95 m** em 2026-11-14 12:15:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=12/07/2026&dataFim=14/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **0.86 m** em 2026-11-14 12:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=12/07/2026&dataFim=14/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 12/11/2026 18:03 — [Defesa Civil alerta: condição de ALERTA para chuva intensa nas proximidades de Independência](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuva-intensa-nas-proximidades-de-independencia)
- 12/11/2026 12:56 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento nas proximidades de Sananduva](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-nas-proximidades-de-sananduva)
- 12/11/2026 10:09 — [Defesa Civil alerta: inundação do rio Uruguai. Risco MUITO ALTO de inundação em Uruguaiana](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-inundacao-do-rio-uruguai-risco-muito-alto-de-inundacao-em-uruguaiana)
- 12/11/2026 10:05 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento nas proximidades de Giruá](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-nas-proximidades-de-girua)
- 11/11/2026 07:07 — [Defesa Civil alerta: condição de ALERTA para tempestade c/ granizo e vento nas proximidades de  Uruguaiana e Barra do Quaraí](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-c-granizo-e-vento-nas-proximidades-de-uruguaiana-e-barra-do-quarai)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
