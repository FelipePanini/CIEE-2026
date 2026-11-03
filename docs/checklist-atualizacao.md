# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 03/11/2026, 12:12:44.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **12.86 m** em 2026-11-03 11:15:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=01/07/2026&dataFim=03/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **1.18 m** em 2026-11-03 11:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=01/07/2026&dataFim=03/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 01/11/2026 21:12 — [Defesa Civil alerta: condição de ALERTA para tempestade com vento e granizo que atuam nas proximidades de Lagoa Vermelha](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-vento-e-granizo-que-atuam-nas-proximidades-de-lagoa-vermelha)
- 01/11/2026 22:11 — [Defesa Civil alerta: condição de ALERTA para tempestade com vento e granizo que atuam nas proximidades de Vacaria](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-vento-e-granizo-que-atuam-nas-proximidades-de-vacaria)
- 01/11/2026 20:52 — [Defesa Civil alerta: condição de ALERTA para tempestade com vento e granizo que atuam nas proximidades de Nonoai](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-vento-e-granizo-que-atuam-nas-proximidades-de-nonoai-6ae7d0cc13742)
- 01/11/2026 19:38 — [Defesa Civil alerta: condição de ALERTA para tempestade com vento e granizo que atuam nas proximidades de Nonoai](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-vento-e-granizo-que-atuam-nas-proximidades-de-nonoai)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
