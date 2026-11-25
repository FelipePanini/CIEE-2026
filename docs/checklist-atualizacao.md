# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 25/11/2026, 16:14:01.

## Automático (feito pelo script)

- [ ] Telemetria da ANA indisponível nesta execução — o app usa o último JSON salvo.

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 25/11/2026 06:47 — [Defesa Civil alerta: INUNDAÇ&Atilde;O do rio Uruguai. Risco MUITO ALTO em Iraí](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-inundacao-do-rio-uruguai-risco-muito-alto-em-irai-6b06ae9686900)
- 24/11/2026 20:26 — [Defesa Civil alerta: elevação do rio Uruguai. Risco ALTO de inundação em Ira](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-elevacao-do-rio-uruguai-risco-alto-de-inundacao-em-ira)
- 23/11/2026 00:00 — [Defesa Civil mobiliza voluntários e reforça assistência a famílias atingidas em Tupanciretã](https://www.defesacivil.rs.gov.br/defesa-civil-mobiliza-voluntarios-e-reforca-assistencia-a-familias-atingidas-em-tupancireta)
- 23/11/2026 00:00 — [Defesa Civil mobiliza voluntários e reforça assistência a famílias atingidas em Tupanciretã](https://www.defesacivil.rs.gov.br/defesa-civil-mobiliza-voluntarios-e-reforca-assistencia-a-familias-atingidas-em-tupancireta-6b06f7df54d0d)
- 24/11/2026 09:56 — [Defesa Civil alerta: condição de ALERTA para chuvas volumosas que atuam nas proximidades de Ipê](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuvas-volumosas-que-atuam-nas-proximidades-de-ipe)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
