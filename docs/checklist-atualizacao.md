# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 22/11/2026, 14:08:18.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **15.48 m** em 2026-11-21 14:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=20/07/2026&dataFim=22/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **0.94 m** em 2026-11-22 13:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=20/07/2026&dataFim=22/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 22/11/2026 08:04 — [Defesa Civil alerta: condição de ALERTA para tempestade com ranizo e vento que atua nas proximidades de Ronda Alta](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-ranizo-e-vento-que-atua-nas-proximidades-de-ronda-alta)
- 04/11/2026 17:37 — [Defesa Civil assina junto ao MPRS, TCERS e MPCRS Nota Técnica de Estrutura Mínima para Compdecs](https://www.defesacivil.rs.gov.br/defesa-civil-assina-junto-ao-mprs-tcers-e-mpcrs-nota-tecnica-de-estrutura-minima-para-compdecs)
- 22/11/2026 07:42 — [Defesa Civil alerta: condição SEVERA para tempestade com granizo grande e vendaval que atua nas proximidades de Chapada](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-severa-para-tempestade-com-granizo-grande-e-vendaval-que-atua-nas-proximidades-de-chapada)
- 22/11/2026 07:15 — [Defesa Civil alerta SEVERO para tempestade com granizo grande e vendaval que atua nas proximidades de Palmeira das Missões](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-severo-para-tempestade-com-granizo-grande-e-vendaval-que-atua-nas-proximidades-de-palmeira-das-missoes)
- 22/11/2026 06:58 — [Defesa Civil alerta: condição de ALERTA para tempestades com granizo e vento que atuam nas proximidades de Capão da Canoa](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestades-com-granizo-e-vento-que-atuam-nas-proximidades-de-capao-da-6b02bdf86aaa9)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
