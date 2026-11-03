# Valores "A CONFIRMAR"

Gerado por `npm run validar-dados`. Cada item abaixo aparece na interface em amarelo, com o selo da camada,
até ser confirmado na fonte oficial. Não preencha com estimativa: atualize o JSON com valor, fonte, url e datas.

| Arquivo | Campo | Fonte a consultar | Observação |
|---|---|---|---|
| `abrigos.json` | `abrigos[2].pessoas.2024-05` | Prefeitura de Porto Alegre — SMED | A Prefeitura não divulgou a lotação por escola; o motor usa a média por abrigo da capital. |
| `abrigos.json` | `abrigos[3].pessoas.2024-05` | Prefeitura de Porto Alegre — SMED | A Prefeitura não divulgou a lotação por escola; o motor usa a média por abrigo da capital. |
| `eventos.json` | `eventos[3].indicadores.municipios_afetados` | Defesa Civil RS — boletins de setembro/2026 | Total de municípios afetados em setembro/2026 não localizado nos boletins consultados. |
| `eventos.json` | `eventos[3].indicadores.desabrigados` | Defesa Civil RS — boletins de setembro/2026 | Ver "fora de casa": a reportagem regional não separa desabrigados de desalojados. |
| `eventos.json` | `eventos[3].indicadores.desalojados` | Defesa Civil RS — boletins de setembro/2026 |  |
| `nutricao.json` | `kcal_100g.acucar` | TACO — açúcar refinado | Não confirmado na fonte; o kit não conta essas calorias. |
| `nutricao.json` | `kcal_100g.leite` | TACO — leite de vaca integral | Não confirmado na fonte; o kit não conta essas calorias. |
| `precos.json` | `produtos[15].preco` | Atacadão — catálogo online | Item indisponível no catálogo consultado (preço zerado). Coletar em outro supermercado com loja, data e link. |
| `precos.json` | `produtos[16].preco` | Atacadão — catálogo online | Item indisponível no catálogo consultado (preço zerado). |
| `rios.json` | `estacoes[0].cota_alerta` | Defesa Civil de Porto Alegre — cota de alerta do Guaíba no Cais Mauá | Valor numérico da cota de alerta não confirmado na fonte. |
| `rios.json` | `estacoes[0].nivel_normal` | ANA — telemetria Cais Mauá C6 | Sem referência oficial de "nível normal"; o painel usa a série recente como base. |
| `rios.json` | `estacoes[1].cota_alerta` | Defesa Civil de Lajeado — cota de alerta do Taquari | Valor numérico da cota de alerta não confirmado na fonte. |
| `saude.json` | `leptospirose[1].indicadores.confirmados` | SES-RS / CEVS — informes epidemiológicos de leptospirose | Não foram localizados números de leptospirose associados às cheias de 2026. |
