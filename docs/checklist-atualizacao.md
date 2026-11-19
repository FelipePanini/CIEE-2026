# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 19/11/2026, 15:15:36.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **12.82 m** em 2026-11-19 15:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=17/07/2026&dataFim=19/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **0.99 m** em 2026-11-19 14:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=17/07/2026&dataFim=19/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 19/11/2026 14:33 — [Defesa Civil alerta: condição de ALERTA para tempestade com granizo e vento que atuam nas proximidades de Maquiné.](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-granizo-e-vento-que-atuam-nas-proximidades-de-maquine)
- 19/11/2026 14:27 — [Defesa Civil alerta: condição de ALERTA para tempestade com granizo e vento que atuam nas proximidades de Vacaria](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-granizo-e-vento-que-atuam-nas-proximidades-de-vacaria)
- 19/11/2026 13:13 — [Defesa Civil alerta: condição de ALERTA para tempestade com granizo e vento que atuam nas proximidades de Barra do Ribeiro](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-granizo-e-vento-que-atuam-nas-proximidades-de-barra-do-ribeiro)
- 19/11/2026 12:23 — [Defesa Civil alerta: condição de ALERTA para tempestade com granizo e vento que atuam nas proximidades de Cidreira](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-granizo-e-vento-que-atuam-nas-proximidades-de-cidreira)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
