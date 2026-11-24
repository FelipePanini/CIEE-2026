# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 24/11/2026, 17:09:15.

## Automático (feito pelo script)

- [x] Nível atual — Rio Taquari — Estrela/Lajeado (86879300): **13.46 m** em 2026-11-24 07:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=22/07/2026&dataFim=24/11/2026))
- [x] Nível atual — Guaíba — Cais Mauá C6 (87450004): **0.88 m** em 2026-11-24 16:00:00 ([fonte](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=22/07/2026&dataFim=24/11/2026))

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 24/11/2026 08:21 — [Defesa Civil alerta: condição de ALERTA para tempestade com vento e granizo que atuam nas proximidades de Sananduva](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-tempestade-com-vento-e-granizo-que-atuam-nas-proximidades-de-sananduva)
- 05/11/2026 12:13 — [Defesa Civil do Estado apoia município de Nova Prata após tempestades](https://www.defesacivil.rs.gov.br/defesa-civil-do-estado-apoia-municipio-de-nova-prata-apos-tempestades)
- 04/11/2026 17:37 — [Defesa Civil assina junto ao MPRS, TCERS e MPCRS Nota Técnica de Estrutura Mínima para Compdecs](https://www.defesacivil.rs.gov.br/defesa-civil-assina-junto-ao-mprs-tcers-e-mpcrs-nota-tecnica-de-estrutura-minima-para-compdecs)
- 24/11/2026 09:56 — [Defesa Civil alerta: condição de ALERTA para chuvas volumosas que atuam nas proximidades de Ipê](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuvas-volumosas-que-atuam-nas-proximidades-de-ipe)
- 24/11/2026 09:29 — [Defesa Civil alerta: condição de ALERTA para chuva, granizo e vento que atuam nas proximidades de Lagoa Vermelha](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuva-granizo-e-vento-que-atuam-nas-proximidades-de-marau-6b0582bddd55b)
- 24/11/2026 07:30 — [Defesa Civil alerta SEVERO/CELL BROADCAST para chuva volumosa que atua nas proximidades de Garruchos](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-severo-cell-broadcast-para-chuva-volumosa-que-atua-nas-proximidades-de-garruchos)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
