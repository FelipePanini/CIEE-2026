/**
 * Fontes brutas consultadas pela coleta automática (roda numa GitHub Action com internet aberta).
 * Cada alvo vira um arquivo em data/brutos/ + uma linha no manifesto (url, status, sha256, data).
 * PDFs são convertidos em .txt (pdftotext) para manter o repositório leve; o hash do original fica no manifesto.
 */
export interface Alvo {
  id: string;
  url: string;
  /** URLs alternativas tentadas em sequência se a principal falhar (5xx/429/erro de rede). */
  espelhos?: string[];
  tipo: 'json' | 'html' | 'xml' | 'pdf' | 'csv' | 'txt';
  metodo?: 'GET' | 'POST';
  corpo?: string;
  cabecalhos?: Record<string, string>;
  nota?: string;
}

const BBOX = '-30.45,-52.45,-28.95,-50.80'; // sul, oeste, norte, leste — Vale do Taquari → RMPA
const overpass = (q: string): Alvo['corpo'] => 'data=' + encodeURIComponent(q);
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const OVERPASS_ESPELHOS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const serieANA = (id: string, codigo: string, ini: string, fim: string, nota: string): Alvo => ({
  id,
  url: `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=${codigo}&dataInicio=${ini}&dataFim=${fim}`,
  tipo: 'xml',
  nota,
});

const inventarioANA = (municipio: string): Alvo => ({
  id: `ana-inventario-${municipio.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  url:
    'https://telemetriaws1.ana.gov.br/ServiceANA.asmx/HidroInventario?codEstDE=&codEstATE=&tpEst=1&nmEst=&nmRio=&codSubBacia=&codBacia=&nmMunicipio=' +
    encodeURIComponent(municipio) +
    '&nmEstado=RIO%20GRANDE%20DO%20SUL&sgResp=&sgOper=&telemetrica=1',
  tipo: 'xml',
  nota: 'Inventário de estações fluviométricas telemétricas da ANA no município',
});

export const ALVOS: Alvo[] = [
  // IBGE — Censo 2022
  {
    id: 'ibge-sidra-4709-populacao-rs',
    url: 'https://apisidra.ibge.gov.br/values/t/4709/n6/in%20n3%2043/v/93/p/2022',
    tipo: 'json',
    nota: 'População residente por município do RS — Censo 2022 (tabela SIDRA 4709)',
  },
  {
    id: 'ibge-sidra-4712-domicilios-rs',
    url: 'https://apisidra.ibge.gov.br/values/t/4712/n3/43/v/all/p/2022',
    tipo: 'json',
    nota: 'Domicílios e média de moradores — RS — Censo 2022 (tabela SIDRA 4712)',
  },
  // ANA — telemetria (nível dos rios)
  inventarioANA('LAJEADO'),
  inventarioANA('ESTRELA'),
  inventarioANA('PORTO ALEGRE'),
  inventarioANA('MUÇUM'),
  inventarioANA('ENCANTADO'),
  {
    id: 'ana-telemetria-86879300-estrela',
    url: 'https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=86879300&dataInicio=01/07/2026&dataFim=03/11/2026',
    tipo: 'xml',
    nota: 'Série telemétrica Rio Taquari em Estrela/Lajeado (86879300)',
  },
  // SGB — SACE
  { id: 'sgb-sace-taquari-ultimo-boletim', url: 'https://www.sgb.gov.br/sace/taquari/ultimo_boletim.php', tipo: 'html' },
  { id: 'sgb-sace-index', url: 'https://www.sgb.gov.br/sace/', tipo: 'html' },
  // Defesa Civil RS
  { id: 'defesacivil-avisos-e-boletins', url: 'https://www.defesacivil.rs.gov.br/avisos-e-boletins', tipo: 'html' },
  { id: 'defesacivil-home', url: 'https://www.defesacivil.rs.gov.br/', tipo: 'html' },
  { id: 'sosenchentes-situacao-municipios', url: 'https://sosenchentes.rs.gov.br/situacao-nos-municipios', tipo: 'html' },
  {
    id: 'poder360-relatorio-defesa-civil-24jul2026',
    url: 'https://static.poder360.com.br/uploads/2026/07/relatorio-defesa-civil-rs-24jul.pdf',
    tipo: 'pdf',
    nota: 'Relatório da Defesa Civil RS de 24/07/2026 (cópia publicada pelo Poder360)',
  },
  // INMET / previsão
  {
    id: 'inmet-prognostico-primavera-2026',
    url: 'https://portal.inmet.gov.br/uploads/notastecnicas/Prognostico_Primavera_2026.pdf',
    tipo: 'pdf',
  },
  {
    id: 'ufpel-consenso-ond-2026',
    url: 'https://wp.ufpel.edu.br/cppmet/files/2026/09/Boletim_climatico_consenso_OND.pdf',
    tipo: 'pdf',
  },
  // DIEESE — cesta básica
  { id: 'dieese-cesta-2026-09', url: 'https://www.dieese.org.br/analisecestabasica/2026/202609cestabasica.pdf', tipo: 'pdf' },
  { id: 'dieese-cesta-2026-10', url: 'https://www.dieese.org.br/analisecestabasica/2026/202610cestabasica.pdf', tipo: 'pdf' },
  // ANTT — piso mínimo de frete
  { id: 'antt-pisos-minimos', url: 'https://www.gov.br/antt/pt-br/assuntos/cargas/pisos-minimos-de-frete', tipo: 'html' },
  // Manual Esfera
  { id: 'esfera-handbook-2018-en', url: 'https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf', tipo: 'pdf' },
  // OpenStreetMap (Overpass) — geometria
  {
    id: 'osm-rios',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];(way["waterway"="river"]["name"~"^Rio (Taquari|Jacuí|Caí|dos Sinos|Gravataí|Forqueta|Taquari-Antas)$"](${BBOX}););out geom;`,
    ),
    nota: 'Rios principais da bacia do Guaíba (OSM)',
  },
  {
    id: 'osm-guaiba',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];(relation["natural"="water"]["name"~"Guaíba"](-30.6,-51.5,-29.9,-51.0);way["natural"="water"]["name"~"Guaíba"](-30.6,-51.5,-29.9,-51.0););out geom;`,
    ),
  },
  {
    id: 'osm-rodovias',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];(way["highway"~"^(motorway|trunk|primary)$"]["ref"~"BR-(116|290|448|386)"](${BBOX}););out geom;`,
    ),
  },
  {
    id: 'osm-escolas',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];area["boundary"="administrative"]["admin_level"="8"]["name"~"^(Porto Alegre|Canoas|Eldorado do Sul|Lajeado|Estrela|Encantado)$"]->.a;(nwr["amenity"="school"]["name"](area.a););out center tags;`,
    ),
    nota: 'Escolas (OSM) para localizar as escolas-base reais',
  },
  {
    id: 'osm-abrigos-ginasios',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];area["boundary"="administrative"]["admin_level"="8"]["name"~"^(Porto Alegre|Canoas|Eldorado do Sul|Lajeado|Estrela)$"]->.a;(nwr["leisure"="sports_centre"]["name"](area.a);nwr["name"~"Parque do Imigrante"](area.a););out center tags;`,
    ),
  },
  // PIX SOS RS — arrecadação e destinação
  { id: 'sosenchentes-sobre-o-pix', url: 'https://sosenchentes.rs.gov.br/sobre-o-pix', tipo: 'html' },
  { id: 'planoriogrande-pix', url: 'https://planoriogrande.rs.gov.br/pix-sos-rio-grande-do-sul', tipo: 'html' },
  // ANTT — texto da resolução de pisos (cópia LegisWeb)
  { id: 'legisweb-antt-6076-2026', url: 'https://www.legisweb.com.br/legislacao/?id=489672', tipo: 'html' },
  // Manual Esfera (português, se existir)
  { id: 'esfera-manual-2018-pt', url: 'https://spherestandards.org/wp-content/uploads/Manual-Esfera-2018-PT.pdf', tipo: 'pdf' },
  // ANA — séries adicionais (picos de 2024/2025 e nível atual do Guaíba)
  serieANA('ana-telemetria-87450004-caismaua-2026', '87450004', '01/07/2026', '03/11/2026', 'Guaíba — Cais Mauá C6, jul–nov/2026'),
  serieANA('ana-telemetria-87450004-caismaua-2024', '87450004', '25/04/2024', '15/06/2024', 'Guaíba — Cais Mauá C6, enchente de 2024'),
  serieANA('ana-telemetria-87450004-caismaua-2025', '87450004', '10/06/2025', '10/07/2025', 'Guaíba — Cais Mauá C6, cheia de jun/2025'),
  serieANA('ana-telemetria-86879300-estrela-2024', '86879300', '25/04/2024', '20/05/2024', 'Taquari — Estrela/Lajeado, enchente de 2024'),
  serieANA('ana-telemetria-86879300-estrela-2025', '86879300', '10/06/2025', '10/07/2025', 'Taquari — Estrela/Lajeado, cheia de jun/2025'),
  // Bloqueios de rodovias (jul/2026)
  {
    id: 'poder360-bloqueios-2026-07-22',
    url: 'https://static.poder360.com.br/uploads/2026/07/bloqueios-2026-07-22.pdf',
    tipo: 'pdf',
    nota: 'Boletim de bloqueios em rodovias do RS — 22/07/2026 (cópia publicada pelo Poder360)',
  },
  {
    id: 'viasul-br386-2026-07',
    url: 'https://rodovias.motiva.com.br/viasul/noticias/2026/julho/viasul-registra-bloqueios-pontuais-preventivos-na-br-386-e-freew/',
    tipo: 'html',
  },
  // DIEESE — banco de dados por produto (exploração da página de consulta)
  { id: 'dieese-cesta-index', url: 'https://www.dieese.org.br/cesta/', tipo: 'html' },
  { id: 'dieese-cesta-produto', url: 'https://www.dieese.org.br/cesta/produto', tipo: 'html' },
  // Manual Esfera via Internet Archive (o site original bloqueia robôs)
  {
    id: 'esfera-handbook-2018-en-arquivo',
    url: 'https://web.archive.org/web/2024id_/https://spherestandards.org/wp-content/uploads/Sphere-Handbook-2018-EN.pdf',
    tipo: 'pdf',
  },
  // Preços de higiene/limpeza em supermercados online (catálogo público VTEX)
  ...['sabonete%2085g', 'creme%20dental%2090g', 'escova%20dental', 'papel%20higienico%2012%20rolos', 'absorvente', 'sabao%20em%20barra', 'agua%20sanitaria%202l', 'agua%20mineral%205l', 'cobertor%20solteiro'].flatMap((q) => [
    {
      id: `vtex-carrefour-${q.replace(/%20/g, '-')}`,
      url: `https://mercado.carrefour.com.br/api/catalog_system/pub/products/search?ft=${q}&_from=0&_to=4`,
      tipo: 'json' as const,
      nota: 'Catálogo público do Carrefour Mercado (VTEX) — preço de referência',
    },
    {
      id: `vtex-atacadao-${q.replace(/%20/g, '-')}`,
      url: `https://www.atacadao.com.br/api/catalog_system/pub/products/search?ft=${q}&_from=0&_to=4`,
      tipo: 'json' as const,
      nota: 'Catálogo público do Atacadão (VTEX) — preço de referência',
    },
  ]),
  // DIEESE — preço médio por produto em Porto Alegre (formulário "por cidade")
  {
    id: 'dieese-preco-medio-poa-2026-09',
    url: 'https://www.dieese.org.br/cesta/cidade',
    metodo: 'POST',
    tipo: 'html',
    corpo: 'farinha=true&cidades=5&tipoDado=4&produtos=0&dataInicial=082026&dataFinal=092026',
    nota: 'DIEESE — preço médio de cada produto da cesta em Porto Alegre, ago–set/2026',
  },
  {
    id: 'dieese-gasto-mensal-poa-2026-09',
    url: 'https://www.dieese.org.br/cesta/cidade',
    metodo: 'POST',
    tipo: 'html',
    corpo: 'farinha=true&cidades=5&tipoDado=5&produtos=0&dataInicial=082026&dataFinal=092026',
    nota: 'DIEESE — gasto mensal por produto em Porto Alegre, ago–set/2026',
  },
  ...['escova%20de%20dente', 'cobertor', 'colchonete'].map((q) => ({
    id: `vtex-atacadao-${q.replace(/%20/g, '-')}`,
    url: `https://www.atacadao.com.br/api/catalog_system/pub/products/search?ft=${q}&_from=0&_to=4`,
    tipo: 'json' as const,
    nota: 'Catálogo público do Atacadão (VTEX) — preço de referência',
  })),
  // OSM — bairros (localização dos parceiros fictícios) e locais de abrigo citados em boletins
  {
    id: 'osm-bairros',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];area["boundary"="administrative"]["admin_level"="8"]["name"~"^(Porto Alegre|Canoas|Eldorado do Sul|Lajeado|Estrela|Encantado|Montenegro|Guaíba)$"]->.a;(node["place"~"^(suburb|neighbourhood|quarter)$"](area.a);relation["boundary"="administrative"]["admin_level"="10"](area.a););out center tags;`,
    ),
  },
  {
    id: 'osm-ulbra-canoas',
    url: OVERPASS,
    espelhos: OVERPASS_ESPELHOS,
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(`[out:json][timeout:120];nwr["amenity"="university"]["name"~"ULBRA|Luterana",i](-29.99,-51.25,-29.85,-51.10);out center tags;`),
  },
];
