# Checklist de atualização dos dados

Gerado por `npm run atualizar-dados` em 17/11/2026, 15:33:20.

## Automático (feito pelo script)

- [ ] Telemetria da ANA indisponível nesta execução — o app usa o último JSON salvo.

## Avisos e alertas recentes da Defesa Civil RS (conferir se há cheia ativa)

- 17/11/2026 12:19 — [Defesa Civil alerta: condição de ALERTA para chuva intensa  que atua nas proximidades de Soledade](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuva-intensa-que-atua-nas-proximidades-de-soledade)
- 17/11/2026 11:44 — [Defesa Civil alerta: condição de ALERTA para chuva intensa e volumosa que atua nas proximidades de Três de Maio](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-para-chuva-intensa-e-volumosa-que-atua-nas-proximidades-de-tres-de-maio)
- 17/11/2026 11:28 — [Defesa Civil alerta: condição de ALERTA nas proximidades de Carazinho](https://www.defesacivil.rs.gov.br/defesa-civil-alerta-condicao-de-alerta-nas-proximidades-de-carazinho)

## Manual (fontes sem API — conferir e editar o JSON correspondente)

- [ ] **Boletim mais recente da Defesa Civil RS** (PDF/notícia): municípios afetados, desabrigados, desalojados, abrigos, rodovias bloqueadas → `data/eventos.json`. Último evento registrado: _Cheias de setembro de 2026 no Vale do Taquari_ (municípios afetados com referência 2026-09-22). https://www.defesacivil.rs.gov.br/avisos-e-boletins
- [ ] **Abrigos oficiais** com endereço e pessoas abrigadas → `data/abrigos.json` (prefeituras / Painel de Abrigos do RS).
- [ ] **Rodovias bloqueadas** citadas no boletim → `data/rede-viaria.json` (`bloqueios_reais`). https://www.daer.rs.gov.br/ · https://www.prf.gov.br/
- [ ] **DIEESE — cesta básica de Porto Alegre** (mês mais recente; atual: 2026-09) → `data/precos.json`. https://www.dieese.org.br/cesta/
- [ ] **ANTT — piso mínimo de frete** (conferir portaria/resolução mais recente) → `data/frete.json`. https://www.gov.br/antt/
- [ ] **INMET/Cemaden — prognóstico climático** (nota técnica do trimestre) → `data/previsao.json`. https://portal.inmet.gov.br/notasTecnicas
- [ ] **SES-RS — leptospirose** após cheias → `data/saude.json`.
- [ ] Rodar `npm run validar-dados` e revisar `docs/a-confirmar.md`.
