# Central de Comando — Solução Distribuidora · Ação Social RS

Painel da ação humanitária da **Solução Distribuidora** (empresa fictícia do Estudo Dirigido _"Ação Social Rio Grande do Sul"_, CIEE) para as famílias atingidas pelas enchentes no RS. Ele responde a cinco perguntas: **o que falta, onde falta, como chega, quanto custa e onde vai faltar**.

> **Da resposta à prontidão.** As enchentes não ficaram em 2024. Em 2025 o Guaíba voltou à cota de inundação. Em 2026 o Taquari passou de 19 m em Lajeado **quatro vezes** (24,77 m em 23/07, 23,99 m em 29/07, 24,46 m em 22/09 e 23,32 m em 30/09, segundo a telemetria da ANA). O INMET prevê chuva até 200 mm acima da média no trimestre out–dez/2026, com 98% de probabilidade de El Niño muito forte.

Os materiais do case estão em [`docs/referencia/`](docs/referencia/): os slides do grupo e o Diário de Bordo.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build estático em dist/
npm run check        # lint + typecheck + validação dos dados + testes
```

Requer Node 20 ou superior.

## Modo Apresentação (para a banca)

Clique em **▶ Apresentar** no cabeçalho. O app entra em tela cheia e percorre o pitch em 13 etapas, sempre no mesmo mundo 3D (a câmera viaja; nada recarrega):

1. Abertura — voo sobre a bacia; a água sobe até o pico de maio/2024 enquanto os contadores sobem junto
2. Linha do tempo — "a enchente não acabou em 2024" (as colunas 3D passam por 2024 → 2025 → 2026)
3. Crise atual no mapa 3D (Vale do Taquari)
4. Urgência · 5. Arrecadação · 6. Rotas · 7. Quadra · 8. Gastos · 9. Parceiros
5. Carta de Crise ao vivo (BR-116 bloqueada em Canoas, inspirada no boletim da PRF de 10/05/2024) — mostra o tempo de recálculo; **D** desfaz
6. Prontidão — "a próxima cheia já tem previsão"
7. Bastidores — Fontes → Dados → Motor → Telas, com as contagens reais
8. Encerramento — "Liderar é transformar coordenação em confiança." + **Gerar card para o LinkedIn**

| Tecla                         | Ação                             |
| ----------------------------- | -------------------------------- |
| → · espaço · Enter · PageDown | próxima etapa                    |
| ← · Backspace · PageUp        | etapa anterior                   |
| Home / End                    | primeira / última                |
| F                             | liga/desliga tela cheia          |
| D                             | desfaz a Carta de Crise          |
| Esc                           | sai e restaura o estado anterior |

O passador de slides (clicker) funciona porque envia PageUp/PageDown. Ao sair, a tela, o cenário, as cartas e os ajustes voltam exatamente como estavam.

**Card do LinkedIn.** Na última etapa, o botão gera um PNG 1200×627 com o quadro atual do 3D, os números de impacto (cada um com a fonte) e as hashtags **#CIEE #AprendizCIEE #Conteudos**. "Copiar texto do post" copia uma legenda pronta. A imagem de compartilhamento (Open Graph, `public/og.jpg`) sai do mesmo gerador: `npm run build && npx vite preview --port 4173` e, em outro terminal, `npm run gerar-og`.

**Rastreio do kit.** A etiqueta com QR fica na tela Quadra. O QR abre `/rastreio/KIT-2026-0001`, a página pública do doador, que mostra só o caminho da caixa (coleta → montagem → bilhete → rota → abrigo), sem nenhum dado de família.

**Sem internet na sala.** Abra o app uma vez com internet (de preferência no mesmo computador da apresentação). O service worker guarda código, dados, relevo e fontes, e depois disso tudo funciona offline com o último dado publicado.

## Atualizar os dados antes da apresentação

```bash
npm run atualizar-dados   # níveis dos rios (ANA) + avisos da Defesa Civil + checklist
npm run validar-dados     # confere a Regra nº 1 e regenera docs/a-confirmar.md e as tabelas deste README
```

1. `atualizar-dados` busca a telemetria da ANA, que traz o nível atual do Taquari (Estrela/Lajeado, 86879300) e do Guaíba (Cais Mauá C6, 87450004). Também lê os avisos em vigor da Defesa Civil RS e grava a data/hora em `data/meta.json`.
2. Boletins em PDF, DIEESE do mês, tabela da ANTT e abrigos não têm API. Para eles o script gera [`docs/checklist-atualizacao.md`](docs/checklist-atualizacao.md): abra cada link e atualize o JSON correspondente.
3. A GitHub Action [`atualizar-dados`](.github/workflows/atualizar-dados.yml) roda o script todo dia e faz commit dos JSONs. A Vercel publica a nova versão sozinha.
4. Se a sala da apresentação não tiver internet, o app usa o último JSON salvo (PWA). Com internet, ele consulta `/api/niveis` para o nível dos rios no momento.

**Coleta bruta.** O ambiente de desenvolvimento usado para construir o projeto não alcança os sites `.gov.br`. Por isso a Action [`coleta-bruta`](.github/workflows/coleta-bruta.yml) baixa as fontes oficiais para [`data/brutos/`](data/brutos/), com um manifesto que registra URL, status, sha256 e data. Ela cobre IBGE/SIDRA, ANA, Defesa Civil, INMET, DIEESE, ANTT, OSM e Manual Esfera.

## Publicar na Vercel (uma vez)

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `felipepanini/ciee-2026`. O preset **Vite** é detectado pelo `vercel.json`.
2. Pronto: cada push gera um _preview deployment_ por branch e o `main` vira produção.
3. O que vem junto, sem configurar nada:
   - **`/api/niveis`** ([`api/niveis.ts`](api/niveis.ts)): função serverless que lê a telemetria da ANA no servidor (contorna o CORS) e devolve cada nível no formato da Regra nº 1. Fica 10 min em cache na borda (`s-maxage=600`, `stale-while-revalidate=3600`). O app consulta a função ao abrir e a cada 10 min. Se ela falhar, o app segue com `data/rios.json`, e o cabeçalho mostra "rios ao vivo (ANA)" só quando a leitura da função é mais nova que o JSON.
   - **PWA** (vite-plugin-pwa): `manifest.webmanifest` + service worker com tudo pré-carregado; `/api/niveis` usa a rede primeiro e, offline, a última resposta salva.
   - **Open Graph**: no build, a URL absoluta da imagem usa `VERCEL_PROJECT_PRODUCTION_URL`, que a própria Vercel define.
4. Opcional: se a ANA exigir credencial no futuro, configure `ANA_USUARIO`/`ANA_SENHA` nas variáveis de ambiente da Vercel. Nunca coloque chaves no código do cliente.

## Regra nº 1: dados confiáveis, rastreáveis e com data

Todo número exibido vem de `data/*.json` com `valor`, `unidade`, `fonte`, `url`, `data_referencia`, `data_consulta` e `camada`. Passe o mouse sobre um número, ou toque nele, para ver a fonte.

| Selo              | O que é                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **HISTÓRICO**     | Balanços fechados de 2024 e 2025 e referências anteriores, como o Censo 2022 e o Manual Esfera                                              |
| **ATUAL**         | 2026: boletim/aviso mais recente da Defesa Civil, telemetria da ANA, DIEESE do mês e ANTT. Mostra a data, como "ATUAL · boletim 23/07/2026" |
| **PREVISÃO**      | Prognósticos do INMET/INPE e do consenso UFPel/FURG/INMET, com o período coberto                                                            |
| **SIMULADO**      | Só estoques internos da operação, nomes dos parceiros, relatos do mural e eventos hipotéticos da Carta de Crise                             |
| CRITÉRIO DO GRUPO | Parâmetros editáveis (prazos, pesos, tamanho da família…) com a referência real ao lado                                                     |
| CALCULADO         | Valores derivados pelo motor; o tooltip mostra a fórmula e a camada de cada insumo                                                          |

`npm run validar-dados` reprova o build nestes casos:

- falta um campo;
- falta a `url` fora da camada SIMULADO;
- aparece SIMULADO fora de `data/simulado/`;
- um parceiro tem nome fora do padrão fictício ("Supermercado Parceiro A").

## Arquitetura

```
data/              números com fonte (4 camadas) · data/simulado/ (o único lugar com SIMULADO) · data/brutos/ (coleta)
scripts/           atualizar-dados · validar-dados · gerar-relevo (Copernicus DEM) · gerar-rede (OSM) · coleta/
api/niveis.ts      função serverless (Vercel): níveis dos rios sem bloqueio de CORS, com cache
src/engine/        motor puro e testado: camadas, urgência, cobertura, rotas (Dijkstra + 2-opt), custos…
src/store/         estado único (Zustand), orientado a eventos: Carta de Crise = evento que se desfaz
src/modules/       uma pasta por tela: panorama, linha-do-tempo, urgencia, rotas, quadra, gastos, administracao, parceiros…
                   + humano/ (rastreio por QR, mural de relatos) · apresentacao/ (13 etapas, card do LinkedIn)
src/three/         Canvas 3D único e persistente: bacia (DEM), ilhas (quadra, prateleira, kit, organograma, bastidores)
src/ui/            selos de camada, número rastreável, componentes
```

## Tabela de fontes

Gerada a partir de `data/*.json` por `npm run validar-dados`.

<!-- fontes:inicio -->

| Indicador | Camada | Fonte | Link | Data de referência |
|---|---|---|---|---|
| Abrigo Parque do Imigrante › pessoas › 2026-07 (`abrigos.json`) | ATUAL | CNN Brasil — abrigo com mais de 500 pessoas em Lajeado (23/07/2026, 9h) | [link](https://www.cnnbrasil.com.br/nacional/sul/rs/inundacao-no-rs-veja-como-e-abrigo-com-mais-de-500-pessoas-em-lajeado/) | 2026-07-23T09:00 |
| Abrigo Parque do Imigrante › pessoas › 2026-09 (`abrigos.json`) | ATUAL | Jornal do Comércio (22/09/2026) | [link](https://www.jornaldocomercio.com/jornal-cidades/2026/09/1264200-rio-taquari-baixa-apos-pico-de-2446-metros-e-limpeza-comeca-em-lajeado.html) | 2026-09-22 |
| Abrigo na Ulbra (campus Canoas) › pessoas › 2024-05 (`abrigos.json`) | HISTÓRICO | Diário de Canoas — edição especial (27/06/2024) | [link](https://pdf.gruposinos.com.br/diariodecanoas/2024/06/27/0856a9/pdf/15XD-27-DIG.pdf) | 2024-05 |
| EMEF Aramy Silva (abrigo temporário) › pessoas › 2024-05 (`abrigos.json`) | HISTÓRICO | Prefeitura de Porto Alegre — SMED | [link](https://prefeitura.poa.br/smed/noticias/quatro-escolas-municipais-atuam-como-abrigos-temporarios) | 2024-05-11 |
| padroes › agua_beber_min_l (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — WASH, necessidades básicas de água (sobrevivência: beber e alimentos) (p. 132 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=132) | 2018 |
| padroes › agua_beber_max_l (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — WASH, necessidades básicas de água (sobrevivência: beber e alimentos) (p. 132 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=132) | 2018 |
| padroes › agua_higiene_min_l (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — WASH, práticas de higiene (p. 132 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=132) | 2018 |
| padroes › agua_higiene_max_l (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — WASH, práticas de higiene (p. 132 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=132) | 2018 |
| padroes › agua_cozinhar_min_l (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — WASH, cozinhar (p. 132 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=132) | 2018 |
| padroes › agua_total_min_l (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Abastecimento de água, padrão 2.1 — indicador-chave (p. 131 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=131) | 2018 |
| padroes › energia_kcal (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Segurança alimentar — necessidades nutricionais (p. 228 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=228) | 2018 |
| padroes › sabonete_banho_g_mes (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Promoção da higiene, padrão 2 — itens de higiene (p. 125 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=125) | 2018 |
| padroes › sabao_roupa_g_mes (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Promoção da higiene, padrão 2 — itens de higiene (p. 125 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=125) | 2018 |
| padroes › cobertor_por_pessoa (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Itens domésticos — roupas e cama (p. 294 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=294) | 2018 |
| padroes › espaco_min_m2 (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Abrigo, padrão 3 — espaço de vida (p. 289 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=289) | 2018 |
| padroes › espaco_frio_m2 (`esfera.json`) | HISTÓRICO | Manual Esfera 2018 — Abrigo, padrão 3 — espaço de vida em clima frio ou urbano (p. 289 do PDF) | [link](https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf#page=289) | 2018 |
| Enchente de abril–maio de 2024 › indicadores › municipios_afetados (`eventos.json`) | HISTÓRICO | Defesa Civil RS — balanço das enchentes (09/06/2024) | [link](https://www.estado.rs.gov.br/defesa-civil-atualiza-balanco-das-enchentes-no-rs-9-6-9h) | 2024-06-09 |
| Enchente de abril–maio de 2024 › indicadores › desabrigados (`eventos.json`) | HISTÓRICO | Defesa Civil RS, via Jornal do Comércio (12/05/2024, tarde) | [link](https://www.jornaldocomercio.com/geral/2024/05/1154325-mais-de-80-mil-gauchos-estao-em-abrigos-538-mil-estao-desalojados.html) | 2024-05-12 |
| Enchente de abril–maio de 2024 › indicadores › desalojados (`eventos.json`) | HISTÓRICO | Defesa Civil RS, via SBT News (26/05/2024) | [link](https://sbtnews.sbt.com.br/noticia/brasil/impacto-das-chuvas-no-rs-nao-mostra-reducao-ao-longo-deste-domingo) | 2024-05-26 |
| Enchente de abril–maio de 2024 › indicadores › obitos (`eventos.json`) | HISTÓRICO | Defesa Civil RS — painel SOS Rio Grande do Sul (situação nos municípios) | [link](https://sosenchentes.rs.gov.br/situacao-nos-municipios) | 2024-04-27/2024-06-30 |
| Enchente de abril–maio de 2024 › indicadores › pessoas_afetadas (`eventos.json`) | HISTÓRICO | Defesa Civil RS — painel SOS Rio Grande do Sul | [link](https://sosenchentes.rs.gov.br/situacao-nos-municipios) | 2024-04-27/2024-06-30 |
| Enchente de abril–maio de 2024 › picos › nivel (`eventos.json`) | HISTÓRICO | Agência Brasil — Guaíba atinge 5,35 m no Cais Mauá (05/05/2024) | [link](https://agenciabrasil.ebc.com.br/geral/noticia/2024-06/nivel-do-guaiba-fica-abaixo-da-cota-de-inundacao-pela-1a-vez-em-um-mes) | 2024-05-05 |
| Enchente de abril–maio de 2024 › picos › nivel (`eventos.json`) | HISTÓRICO | SGB — apresentação na Sala de Crise ANA/Sul (18/09/2024) | [link](https://www.gov.br/ana/pt-br/assuntos/monitoramento-e-eventos-criticos/eventos-criticos/apresentacoes-das-reunioes/2024_09_18_sala-de-crise-ana-sul_sgb.pdf) | 2024-05-02 |
| Enchente de abril–maio de 2024 › picos › nivel (`eventos.json`) | HISTÓRICO | ANA/SGB — telemetria da estação Estrela (86879300), 2º pico em 13/05/2024 05h00 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=25/04/2024&dataFim=20/05/2024) | 2024-05-13T05:00 |
| Enchente de abril–maio de 2024 › municipios › desabrigados (`eventos.json`) | HISTÓRICO | Agência Brasil (14/05/2024), reproduzida pelo IHU-Unisinos | [link](https://ihu.unisinos.br/639424-rs-com-3-da-populacao-gaucha-canoas-lidera-ranking-de-desabrigados) | 2024-05-14 |
| Enchente de abril–maio de 2024 › municipios › abrigos (`eventos.json`) | HISTÓRICO | Agência Brasil (14/05/2024), reproduzida pelo IHU-Unisinos | [link](https://ihu.unisinos.br/639424-rs-com-3-da-populacao-gaucha-canoas-lidera-ranking-de-desabrigados) | 2024-05-14 |
| Enchente de abril–maio de 2024 › municipios › desabrigados (`eventos.json`) | HISTÓRICO | Prefeitura de Porto Alegre — Central de Abrigos | [link](https://prefeitura.poa.br/smds/noticias/numero-de-acolhidos-em-abrigos-reduz-para-98-mil) | 2024-05-13 |
| Enchente de abril–maio de 2024 › municipios › abrigos (`eventos.json`) | HISTÓRICO | Prefeitura de Porto Alegre (12/05/2024) | [link](https://prefeitura.poa.br/defesa-civil/noticias/total-de-pessoas-em-abrigos-chega-142-mil-neste-domingo) | 2024-05-12 |
| Enchente de abril–maio de 2024 › municipios › desabrigados (`eventos.json`) | HISTÓRICO | Agência Brasil — Eldorado do Sul tem 75% dos moradores desalojados | [link](https://agenciabrasil.ebc.com.br/geral/noticia/2024-05/eldorado-do-sul-rs-tem-75-dos-moradores-desalojados-pelas-enchentes) | 2024-05 |
| Enchente de abril–maio de 2024 › municipios › desalojados (`eventos.json`) | HISTÓRICO | Agência Brasil — boletim da Prefeitura de Eldorado do Sul | [link](https://agenciabrasil.ebc.com.br/geral/noticia/2024-05/eldorado-do-sul-rs-tem-75-dos-moradores-desalojados-pelas-enchentes) | 2024-05 |
| Cheia de junho de 2025 › indicadores › municipios_afetados (`eventos.json`) | HISTÓRICO | Defesa Civil RS, via O Timoneiro (24/06/2025) | [link](https://jornaltimoneiro.com.br/index.php/2025/06/24/chuvas-mais-de-7-mil-pessoas-desalojadas-quatro-mortos-e-146-municipios-afetados-no-rs/) | 2025-06-24 |
| Cheia de junho de 2025 › indicadores › desabrigados (`eventos.json`) | HISTÓRICO | Defesa Civil RS, via Jornal do Comércio (19/06/2025) | [link](https://www.jornaldocomercio.com/geral/2025/06/1207243-rio-grande-do-sul-soma-quase-3-mil-pessoas-fora-de-casa-por-causa-das-chuvas.html) | 2025-06-19 |
| Cheia de junho de 2025 › indicadores › desalojados (`eventos.json`) | HISTÓRICO | Defesa Civil RS, via O Timoneiro (24/06/2025) | [link](https://jornaltimoneiro.com.br/index.php/2025/06/24/chuvas-mais-de-7-mil-pessoas-desalojadas-quatro-mortos-e-146-municipios-afetados-no-rs/) | 2025-06-24 |
| Cheia de junho de 2025 › indicadores › obitos (`eventos.json`) | HISTÓRICO | Agência Brasil — Defesa Civil confirma quarta morte (23/06/2025) | [link](https://agenciabrasil.ebc.com.br/geral/noticia/2025-06/defesa-civil-confirma-quarta-morte-apos-chuvas-no-rio-grande-do-sul) | 2025-06-23 |
| Cheia de junho de 2025 › picos › nivel (`eventos.json`) | HISTÓRICO | ANA — telemetria Cais Mauá C6 (87450004), máximo em 25/06/2025 08h00 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=10/06/2025&dataFim=10/07/2025) | 2025-06-25T08:00 |
| Cheia de junho de 2025 › picos › nivel (`eventos.json`) | HISTÓRICO | ANA/SGB — telemetria da estação Estrela (86879300), máximo em 19/06/2025 11h15 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=10/06/2025&dataFim=10/07/2025) | 2025-06-19T11:15 |
| Cheia de junho de 2025 › picos › nivel (`eventos.json`) | HISTÓRICO | ANA/SGB — telemetria da estação Estrela (86879300), 2º pico em 30/06/2025 06h30 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=10/06/2025&dataFim=10/07/2025) | 2025-06-30T06:30 |
| Cheias de julho de 2026 no Vale do Taquari › indicadores › municipios_afetados (`eventos.json`) | ATUAL | Defesa Civil RS — boletim de 23/07/2026, via DGABC | [link](https://www.dgabc.com.br/Noticia/4336999/chuva-no-rs-mais-de-1200-pessoas-estao-desabrigadas-e-quase-200-cidades-registram-danos) | 2026-07-23 |
| Cheias de julho de 2026 no Vale do Taquari › indicadores › desabrigados (`eventos.json`) | ATUAL | Defesa Civil RS — boletim de 23/07/2026, via DGABC | [link](https://www.dgabc.com.br/Noticia/4336999/chuva-no-rs-mais-de-1200-pessoas-estao-desabrigadas-e-quase-200-cidades-registram-danos) | 2026-07-23 |
| Cheias de julho de 2026 no Vale do Taquari › indicadores › desalojados (`eventos.json`) | ATUAL | Defesa Civil RS — boletim de 23/07/2026 (manhã), via DGABC | [link](https://www.dgabc.com.br/Noticia/4336999/chuva-no-rs-mais-de-1200-pessoas-estao-desabrigadas-e-quase-200-cidades-registram-danos) | 2026-07-23 |
| Cheias de julho de 2026 no Vale do Taquari › picos › nivel (`eventos.json`) | ATUAL | ANA/SGB — telemetria da estação Estrela (86879300), máximo em 23/07/2026 00h45 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=01/07/2026&dataFim=03/11/2026) | 2026-07-23T00:45 |
| Cheias de julho de 2026 no Vale do Taquari › picos › nivel (`eventos.json`) | ATUAL | ANA/SGB — telemetria da estação Estrela (86879300), máximo em 29/07/2026 20h15 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=01/07/2026&dataFim=03/11/2026) | 2026-07-29T20:15 |
| Cheias de julho de 2026 no Vale do Taquari › municipios › desabrigados (`eventos.json`) | ATUAL | Defesa Civil RS — relatório do Aviso Hidrometeorológico 10/2026 (24/07/2026) | [link](https://static.poder360.com.br/uploads/2026/07/relatorio-defesa-civil-rs-24jul.pdf) | 2026-07-22 |
| Cheias de julho de 2026 no Vale do Taquari › municipios › desabrigados (`eventos.json`) | ATUAL | Defesa Civil de Eldorado do Sul, via Jornal do Brasil (13/07/2026) | [link](https://www.jb.com.br/brasil/2026/07/1060273-temporal-em-eldorado-do-sul-deixa-720-desabrigados-e-causa-danos-no-rs.html) | 2026-07-13 |
| Cheias de setembro de 2026 no Vale do Taquari › indicadores › municipios_afetados (`eventos.json`) | ATUAL | Defesa Civil RS — boletins de setembro/2026 | [link](https://www.defesacivil.rs.gov.br/avisos-e-boletins) | 2026-09-22 |
| Cheias de setembro de 2026 no Vale do Taquari › indicadores › desabrigados (`eventos.json`) | ATUAL | Defesa Civil RS — boletins de setembro/2026 | [link](https://www.defesacivil.rs.gov.br/avisos-e-boletins) | 2026-09-22 |
| Cheias de setembro de 2026 no Vale do Taquari › indicadores › desalojados (`eventos.json`) | ATUAL | Defesa Civil RS — boletins de setembro/2026 | [link](https://www.defesacivil.rs.gov.br/avisos-e-boletins) | 2026-09-22 |
| Cheias de setembro de 2026 no Vale do Taquari › indicadores › fora_de_casa (`eventos.json`) | ATUAL | Jornal Força do Vale (22/09/2026) | [link](https://jornalforcadovale.com.br/enchentes/vale-taquari-467-pessoas-desabrigadas-enchente/) | 2026-09-22 |
| Cheias de setembro de 2026 no Vale do Taquari › picos › nivel (`eventos.json`) | ATUAL | ANA/SGB — telemetria da estação Estrela (86879300), máximo em 22/09/2026 12h15 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=01/07/2026&dataFim=03/11/2026) | 2026-09-22T12:15 |
| Cheias de setembro de 2026 no Vale do Taquari › picos › nivel (`eventos.json`) | ATUAL | ANA/SGB — telemetria da estação Estrela (86879300), máximo em 30/09/2026 06h00 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=01/07/2026&dataFim=03/11/2026) | 2026-09-30T06:00 |
| Cheias de setembro de 2026 no Vale do Taquari › municipios › desabrigados (`eventos.json`) | ATUAL | Jornal do Comércio (22/09/2026) | [link](https://www.jornaldocomercio.com/jornal-cidades/2026/09/1264200-rio-taquari-baixa-apos-pico-de-2446-metros-e-limpeza-comeca-em-lajeado.html) | 2026-09-22 |
| pisos › ccd (`frete.json`) | ATUAL | ANTT — Res. 6.076/2026, Tabela A, carga geral, 2 eixos | [link](https://www.legisweb.com.br/legislacao/?id=489672) | 2026-01-19 |
| pisos › cc (`frete.json`) | ATUAL | ANTT — Res. 6.076/2026, Tabela A, carga geral, 2 eixos | [link](https://www.legisweb.com.br/legislacao/?id=489672) | 2026-01-19 |
| pisos › ccd (`frete.json`) | ATUAL | ANTT — Res. 6.076/2026, Tabela A, carga geral, 3 eixos | [link](https://www.legisweb.com.br/legislacao/?id=489672) | 2026-01-19 |
| pisos › cc (`frete.json`) | ATUAL | ANTT — Res. 6.076/2026, Tabela A, carga geral, 3 eixos | [link](https://www.legisweb.com.br/legislacao/?id=489672) | 2026-01-19 |
| pisos › ccd (`frete.json`) | ATUAL | ANTT — Res. 6.076/2026, Tabela A, carga geral, 4 eixos | [link](https://www.legisweb.com.br/legislacao/?id=489672) | 2026-01-19 |
| pisos › cc (`frete.json`) | ATUAL | ANTT — Res. 6.076/2026, Tabela A, carga geral, 4 eixos | [link](https://www.legisweb.com.br/legislacao/?id=489672) | 2026-01-19 |
| media_moradores_domicilio_rs (`municipios.json`) | HISTÓRICO | IBGE — Censo Demográfico 2022 (SIDRA, tabela 4712) | [link](https://apisidra.ibge.gov.br/values/t/4712/n3/43/v/all/p/2022) | 2022-08-01 |
| Porto Alegre › populacao (`municipios.json`) | HISTÓRICO | IBGE — Censo Demográfico 2022 (SIDRA, tabela 4709) | [link](https://apisidra.ibge.gov.br/values/t/4709/n6/in%20n3%2043/v/93/p/2022) | 2022-08-01 |
| kcal_100g › arroz (`nutricao.json`) | HISTÓRICO | TACO — arroz tipo 1, cru | [link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/arroz-tipo-1-cru) | 2011 |
| kcal_100g › feijao (`nutricao.json`) | HISTÓRICO | TACO — feijão preto, cru | [link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/feijao-preto-cru) | 2011 |
| kcal_100g › oleo (`nutricao.json`) | HISTÓRICO | TACO — óleo de soja | [link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/oleo-de-soja) | 2011 |
| kcal_100g › farinha (`nutricao.json`) | HISTÓRICO | TACO — farinha de trigo | [link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/farinha-de-trigo) | 2011 |
| kcal_100g › acucar (`nutricao.json`) | HISTÓRICO | TACO — açúcar refinado | [link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/acucar-refinado) | 2011 |
| kcal_100g › leite (`nutricao.json`) | HISTÓRICO | TACO — leite de vaca integral | [link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/leite-de-vaca-integral) | 2011 |
| pix_sos_rs › arrecadado (`orcamento.json`) | HISTÓRICO | Governo do RS — painel da campanha Pix SOS Rio Grande do Sul | [link](https://sosenchentes.rs.gov.br/sobre-o-pix) | 2024-05-01/2024-12-31 |
| pix_sos_rs › destinado (`orcamento.json`) | HISTÓRICO | Governo do RS — painel da campanha Pix SOS Rio Grande do Sul | [link](https://sosenchentes.rs.gov.br/sobre-o-pix) | 2024-05-01/2024-12-31 |
| pix_sos_rs › familias_beneficiadas (`orcamento.json`) | HISTÓRICO | Governo do RS — Plano Rio Grande, Pix SOS Rio Grande do Sul (22/07/2024) | [link](https://planoriogrande.rs.gov.br/pix-sos-rio-grande-do-sul) | 2024-07-03 |
| pix_sos_rs › valor_por_familia (`orcamento.json`) | HISTÓRICO | Governo do RS — Plano Rio Grande, Pix SOS Rio Grande do Sul (22/07/2024) | [link](https://planoriogrande.rs.gov.br/pix-sos-rio-grande-do-sul) | 2024-07-03 |
| pix_sos_rs › total_familias (`orcamento.json`) | HISTÓRICO | Governo do RS — Plano Rio Grande, Pix SOS Rio Grande do Sul (22/07/2024) | [link](https://planoriogrande.rs.gov.br/pix-sos-rio-grande-do-sul) | 2024-07-03 |
| pix_sos_rs › mei_rs_calamidades (`orcamento.json`) | HISTÓRICO | Governo do RS — Plano Rio Grande, Pix SOS Rio Grande do Sul (22/07/2024) | [link](https://planoriogrande.rs.gov.br/pix-sos-rio-grande-do-sul) | 2024-07-22 |
| cesta_dieese_total (`precos.json`) | ATUAL | DIEESE — cesta básica de Porto Alegre (setembro/2026) | [link](https://www.dieese.org.br/analisecestabasica/2026/202609cestabasica.pdf) | 2026-09 |
| Arroz agulhinha › preco (`precos.json`) | ATUAL | DIEESE — Pesquisa Nacional da Cesta Básica, preço médio em Porto Alegre (09/2026) | [link](https://www.dieese.org.br/cesta/) | 2026-09 |
| Água mineral sem gás 5 L › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Água mineral sem gás 5 L | [link](https://secure.atacadao.com.br/agua-mineral-crystal-sem-gas-63831/p) | 2026-11-03 |
| Sabonete em barra 85 g › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Sabonete em barra 85 g | [link](https://secure.atacadao.com.br/sabonete-siene-erva-doce-74266/p) | 2026-11-03 |
| Creme dental 90 g (pacote com 4) › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Creme dental 90 g (pacote com 4) | [link](https://secure.atacadao.com.br/creme-dental-colgate-total-original-mint-8890/p) | 2026-11-03 |
| Escova de dente (pacote com 2) › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Escova de dente (pacote com 2) | [link](https://secure.atacadao.com.br/escova-dental-colgate-pro-cuidado-sensitive-13604/p) | 2026-11-03 |
| Papel higiênico folha dupla 30 m (12 rolos) › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Papel higiênico folha dupla 30 m (12 rolos) | [link](https://secure.atacadao.com.br/papel-higienico-bulnez-folha-dupla-30m-13794/p) | 2026-11-03 |
| Absorvente com abas (16 un) › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Absorvente com abas (16 un) | [link](https://secure.atacadao.com.br/absorvente-diana-suave-com-abas-62142/p) | 2026-11-03 |
| Sabão em barra 800 g › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Sabão em barra 800 g | [link](https://secure.atacadao.com.br/sabao-em-pedaco-ype-neutro-3396/p) | 2026-11-03 |
| Água sanitária 1 L › preco (`precos.json`) | ATUAL | Atacadão — catálogo online (preço de referência coletado em 03/11/2026) — Água sanitária 1 L | [link](https://secure.atacadao.com.br/agua-sanitaria-tay-3309/p) | 2026-11-03 |
| Cobertor de solteiro › preco (`precos.json`) | ATUAL | Atacadão — catálogo online | [link](https://secure.atacadao.com.br/cobertor-luster-corttex-casal-96392/p) | 2026-11-03 |
| Chuva acima da média no trimestre (até) › dado (`previsao.json`) | PREVISÃO | INMET/INPE — Prognóstico climático de primavera 2026 | [link](https://portal.inmet.gov.br/uploads/notastecnicas/Prognostico_Primavera_2026.pdf) | 2026-10-01/2026-12-31 |
| Probabilidade de El Niño muito forte em OND › dado (`previsao.json`) | PREVISÃO | INMET/INPE — Prognóstico de primavera 2026, citando NOAA/CPC | [link](https://portal.inmet.gov.br/uploads/notastecnicas/Prognostico_Primavera_2026.pdf) | 2026-10-01/2026-12-31 |
| Probabilidade de El Niño muito forte › dado (`previsao.json`) | PREVISÃO | Boletim de Consenso Climático RS (set/2026), citando NOAA/CPC | [link](https://wp.ufpel.edu.br/cppmet/files/2026/09/Boletim_climatico_consenso_OND.pdf) | 2026-10-01/2026-12-31 |
| e-lajeado__e-estrela › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da BR-386 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| e-canoas-386__e-esteio-448 › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da BR-116 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| e-esteio-448__e-poa-448 › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da BR-448 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| e-poa-448__e-poa-norte › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da BR-290 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| e-poa-norte__e-ponte-guaiba › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da BR-116/BR-290 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| e-lajeado__e-encantado › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da ERS-130 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| e-estrela__e-colinas › km (`rede-viaria.json`) | ATUAL | OpenStreetMap — comprimento da geometria da ERS-129 | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| q-poa-aramy__e-guaiba › km (`rede-viaria.json`) | ATUAL | Estimativa: distância em linha reta × 1,3 (último trecho urbano) | [link](https://www.openstreetmap.org/) | 2026-11-03 |
| Guaíba — Cais Mauá (Porto Alegre) › cota_alerta (`rios.json`) | HISTÓRICO | Defesa Civil de Porto Alegre — cota de alerta do Guaíba no Cais Mauá | [link](https://www.jornaldocomercio.com/geral/2025/06/1207737-defesa-civil-informa-que-guaiba-esta-em-cota-de-alerta-mas-sem-previsao-de-inundacao.html) | 2025-06 |
| Guaíba — Cais Mauá (Porto Alegre) › cota_inundacao (`rios.json`) | HISTÓRICO | Defesa Civil RS, via O Timoneiro (24/06/2025): cota de inundação do Cais Mauá | [link](https://jornaltimoneiro.com.br/index.php/2025/06/24/chuvas-mais-de-7-mil-pessoas-desalojadas-quatro-mortos-e-146-municipios-afetados-no-rs/) | 2025-06-24 |
| Guaíba — Cais Mauá (Porto Alegre) › nivel_normal (`rios.json`) | ATUAL | ANA — telemetria Cais Mauá C6 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=01/07/2026&dataFim=03/11/2026) | 2026 |
| Guaíba — Cais Mauá (Porto Alegre) › nivel_atual (`rios.json`) | ATUAL | ANA — telemetria Guaíba — Cais Mauá C6 (87450004), leitura de 12/11/2026 13:00 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=10/07/2026&dataFim=12/11/2026) | 2026-11-12T13:00 |
| Rio Taquari — Estrela/Lajeado › cota_alerta (`rios.json`) | ATUAL | Defesa Civil de Lajeado — cota de alerta do Taquari | [link](https://www.lajeado.rs.gov.br/) | 2026 |
| Rio Taquari — Estrela/Lajeado › cota_inundacao (`rios.json`) | ATUAL | Prefeitura de Lajeado / Grupo A Hora — cota de inundação do Taquari em Lajeado | [link](https://grupoahora.net.br/conteudos/2026/07/28/defesa-civil-emite-alerta-para-risco-de-inundacao-do-taquari/) | 2026-07-28 |
| Rio Taquari — Estrela/Lajeado › nivel_normal (`rios.json`) | HISTÓRICO | Jornal do Comércio — nível normal do Taquari em Lajeado | [link](https://www.jornaldocomercio.com/geral/2024/05/1152737-rio-taquari-atinge-pela-primeira-vez-na-historia-marca-de-30-metros.html) | 2024-05 |
| Rio Taquari — Estrela/Lajeado › nivel_atual (`rios.json`) | ATUAL | ANA — telemetria Rio Taquari — Estrela/Lajeado (86879300), leitura de 12/11/2026 14:00 | [link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=10/07/2026&dataFim=12/11/2026) | 2026-11-12T14:00 |
| leptospirose › indicadores › notificados (`saude.json`) | HISTÓRICO | SES-RS, via Agência Brasil (19/06/2024) | [link](https://agenciabrasil.ebc.com.br/saude/noticia/2024-06/rio-grande-do-sul-confirma-20a-morte-por-leptospirose-apos-enchentes) | 2024-06-19 |
| leptospirose › indicadores › confirmados (`saude.json`) | HISTÓRICO | SES-RS, via Agência Brasil (19/06/2024) | [link](https://agenciabrasil.ebc.com.br/saude/noticia/2024-06/rio-grande-do-sul-confirma-20a-morte-por-leptospirose-apos-enchentes) | 2024-06-19 |
| leptospirose › indicadores › obitos (`saude.json`) | HISTÓRICO | SES-RS, via Agência Brasil (19/06/2024) | [link](https://agenciabrasil.ebc.com.br/saude/noticia/2024-06/rio-grande-do-sul-confirma-20a-morte-por-leptospirose-apos-enchentes) | 2024-06-19 |
| leptospirose › indicadores › casos_2023_ano (`saude.json`) | HISTÓRICO | SES-RS, via Agência Brasil (19/06/2024) | [link](https://agenciabrasil.ebc.com.br/saude/noticia/2024-06/rio-grande-do-sul-confirma-20a-morte-por-leptospirose-apos-enchentes) | 2023 |
| leptospirose › indicadores › confirmados (`saude.json`) | ATUAL | SES-RS / CEVS — informes epidemiológicos de leptospirose | [link](https://saude.rs.gov.br/) | 2026-07-17/2026-10-31 |
| VUC (Veículo Urbano de Carga) › capacidade_kg (`veiculos.json`) | ATUAL | Bsoft — o que é VUC (capacidade de carga de até 3 t) | [link](https://bsoft.com.br/blog/vuc) | 2026 |
| Caminhão toco › capacidade_kg (`veiculos.json`) | ATUAL | Chiptronic — tipos de caminhão mais usados | [link](https://chiptronic.com.br/blog/tipos-de-caminhao-mais-usados) | 2026 |
| Caminhão truck › capacidade_kg (`veiculos.json`) | ATUAL | Consulta de Placa — caminhão truck: quanto pode carregar | [link](https://consultadeplaca.net/blog/caminhao-truck) | 2026 |

<!-- fontes:fim -->

## A CONFIRMAR

Números que não puderam ser confirmados na fonte oficial aparecem em amarelo na interface. Nenhum deles foi preenchido com estimativa.

<!-- a-confirmar:inicio -->

- **EMEF Aramy Silva (abrigo temporário) › pessoas › 2024-05** (`abrigos.json`) — conferir em: Prefeitura de Porto Alegre — SMED ([link](https://prefeitura.poa.br/smed/noticias/quatro-escolas-municipais-atuam-como-abrigos-temporarios))
- **EMEF Grande Oriente do RS (abrigo temporário) › pessoas › 2024-05** (`abrigos.json`) — conferir em: Prefeitura de Porto Alegre — SMED ([link](https://prefeitura.poa.br/smed/noticias/quatro-escolas-municipais-atuam-como-abrigos-temporarios))
- **Cheias de setembro de 2026 no Vale do Taquari › indicadores › municipios_afetados** (`eventos.json`) — conferir em: Defesa Civil RS — boletins de setembro/2026 ([link](https://www.defesacivil.rs.gov.br/avisos-e-boletins))
- **Cheias de setembro de 2026 no Vale do Taquari › indicadores › desabrigados** (`eventos.json`) — conferir em: Defesa Civil RS — boletins de setembro/2026 ([link](https://www.defesacivil.rs.gov.br/avisos-e-boletins))
- **Cheias de setembro de 2026 no Vale do Taquari › indicadores › desalojados** (`eventos.json`) — conferir em: Defesa Civil RS — boletins de setembro/2026 ([link](https://www.defesacivil.rs.gov.br/avisos-e-boletins))
- **kcal_100g › acucar** (`nutricao.json`) — conferir em: TACO — açúcar refinado ([link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/acucar-refinado))
- **kcal_100g › leite** (`nutricao.json`) — conferir em: TACO — leite de vaca integral ([link](https://www.tabelatacoonline.com.br/tabela-nutricional/taco/leite-de-vaca-integral))
- **Cobertor de solteiro › preco** (`precos.json`) — conferir em: Atacadão — catálogo online ([link](https://secure.atacadao.com.br/cobertor-luster-corttex-casal-96392/p))
- **Colchonete › preco** (`precos.json`) — conferir em: Atacadão — catálogo online ([link](https://secure.atacadao.com.br/colchonete-camping-ortobom-mochila-unidade-24248/p))
- **Guaíba — Cais Mauá (Porto Alegre) › cota_alerta** (`rios.json`) — conferir em: Defesa Civil de Porto Alegre — cota de alerta do Guaíba no Cais Mauá ([link](https://www.jornaldocomercio.com/geral/2025/06/1207737-defesa-civil-informa-que-guaiba-esta-em-cota-de-alerta-mas-sem-previsao-de-inundacao.html))
- **Guaíba — Cais Mauá (Porto Alegre) › nivel_normal** (`rios.json`) — conferir em: ANA — telemetria Cais Mauá C6 ([link](https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=87450004&dataInicio=01/07/2026&dataFim=03/11/2026))
- **Rio Taquari — Estrela/Lajeado › cota_alerta** (`rios.json`) — conferir em: Defesa Civil de Lajeado — cota de alerta do Taquari ([link](https://www.lajeado.rs.gov.br/))
- **leptospirose › indicadores › confirmados** (`saude.json`) — conferir em: SES-RS / CEVS — informes epidemiológicos de leptospirose ([link](https://saude.rs.gov.br/))

<!-- a-confirmar:fim -->

## Critérios de aceite

| Critério                                                          | Situação                                                | Como foi verificado                                                                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todo número tem fonte, data e selo de camada                      | ✅                                                      | `validar-dados` no CI (zod + regras); `Numero` mostra fonte/link/datas no hover/toque; valores derivados levam o selo CALCULADO com a procedência de cada insumo |
| Cabeçalho mostra a última atualização dos dados                   | ✅                                                      | "Dados atualizados em DD/MM/AAAA HH:mm" lido de `data/meta.json`                                                                                                 |
| SIMULADO só em estoques, parceiros, relatos e eventos hipotéticos | ✅                                                      | `validar-dados` reprova SIMULADO fora de `data/simulado/`; o inventário dos Bastidores mostra 54 dos 241 números nessa camada                                    |
| Seletor Case / Atual / Prontidão e todos os módulos respondem     | ✅                                                      | testes do motor nos 3 cenários + screenshots de cada tela                                                                                                        |
| Mudar um parâmetro de uma área altera as outras                   | ✅                                                      | store único → `simular()`; teste do motor: bloquear um trecho muda ETA → urgência → metas de arrecadação → semáforo da Logística                                 |
| Carta de Crise recalcula em < 1 s e pode ser desfeita             | ✅                                                      | teste do motor (aplica em < 1 s; desfazer volta exatamente ao estado anterior); a etapa 10 da apresentação mostra o tempo medido (poucos ms)                     |
| Todo 3D carrega dado e tem equivalente 2D                         | ✅                                                      | cada cena tem Painel2D; Bastidores 3D ↔ seção "Bastidores e fontes"                                                                                              |
| Um único contexto WebGL                                           | ✅                                                      | Playwright: 1 renderer, 0 perdas de contexto e 1 canvas após percorrer as 13 etapas e alternar 2D/3D                                                             |
| 60 fps no modo alta (GPU integrada) ou sugestão do modo leve      | ⚠️ a medir na máquina da banca                          | `PerformanceMonitor` sugere o modo médio/2D quando o fps cai; pós-processamento só no alta e carregado sob demanda; DPR até 1,75                                 |
| Publicado na Vercel e funcionando offline (PWA)                   | ⏳ falta importar o repositório na Vercel (passo acima) | offline testado com Playwright no build de produção: recarregar sem rede abre o app e o 3D                                                                       |
| CI verde e Action de atualização funcionando                      | ✅                                                      | GitHub Actions `ci` (lint, typecheck, validar-dados, testes, build) e `atualizar-dados` (diária + manual)                                                        |
| Link no LinkedIn mostra imagem e título (Open Graph)              | ✅ no código / ⏳ após o deploy                         | `og:title`, `og:description`, `og:image` 1200×630 (`public/og.jpg`)                                                                                              |
| Nenhuma empresa real como doadora nem dado pessoal real           | ✅                                                      | nomes de parceiros validados pelo padrão fictício; rodapé LGPD; rastreio sem dado de família                                                                     |
| Modo Apresentação percorre o pitch só com o teclado               | ✅                                                      | Playwright: 13 etapas com → e saída com Esc, estado restaurado                                                                                                   |

## Privacidade

Nenhuma informação pessoal real é usada (LGPD). Os parceiros têm nomes fictícios e os relatos são ilustrativos. O rastreio de kits por QR code não contém nenhum dado de família. Empresas reais aparecem só como **fonte de preço** (ex.: catálogo online de um atacado), nunca como doadoras.

## Licenças dos dados

- Copernicus DEM GLO-30 © DLR/Airbus (licença Copernicus).
- OpenStreetMap © colaboradores do OSM (ODbL).
- IBGE, ANA, Defesa Civil RS, INMET e ANTT: dados públicos.
- Manual Esfera © Sphere Association.

O código está sob licença MIT.
