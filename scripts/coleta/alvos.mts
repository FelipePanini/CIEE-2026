/**
 * Fontes brutas consultadas pela coleta automática (roda numa GitHub Action com internet aberta).
 * Cada alvo vira um arquivo em data/brutos/ + uma linha no manifesto (url, status, sha256, data).
 * PDFs são convertidos em .txt (pdftotext) para manter o repositório leve; o hash do original fica no manifesto.
 */
export interface Alvo {
  id: string;
  url: string;
  tipo: 'json' | 'html' | 'xml' | 'pdf' | 'csv' | 'txt';
  metodo?: 'GET' | 'POST';
  corpo?: string;
  cabecalhos?: Record<string, string>;
  nota?: string;
}

const BBOX = '-30.45,-52.45,-28.95,-50.80'; // sul, oeste, norte, leste — Vale do Taquari → RMPA
const overpass = (q: string): Alvo['corpo'] => 'data=' + encodeURIComponent(q);

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
    url: 'https://overpass-api.de/api/interpreter',
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];(way["waterway"="river"]["name"~"^Rio (Taquari|Jacuí|Caí|dos Sinos|Gravataí|Forqueta|Taquari-Antas)$"](${BBOX}););out geom;`,
    ),
    nota: 'Rios principais da bacia do Guaíba (OSM)',
  },
  {
    id: 'osm-guaiba',
    url: 'https://overpass-api.de/api/interpreter',
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];(relation["natural"="water"]["name"~"Guaíba"](-30.6,-51.5,-29.9,-51.0);way["natural"="water"]["name"~"Guaíba"](-30.6,-51.5,-29.9,-51.0););out geom;`,
    ),
  },
  {
    id: 'osm-rodovias',
    url: 'https://overpass-api.de/api/interpreter',
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];(way["highway"~"^(motorway|trunk|primary)$"]["ref"~"BR-(116|290|448|386)"](${BBOX}););out geom;`,
    ),
  },
  {
    id: 'osm-escolas',
    url: 'https://overpass-api.de/api/interpreter',
    metodo: 'POST',
    tipo: 'json',
    corpo: overpass(
      `[out:json][timeout:180];area["boundary"="administrative"]["admin_level"="8"]["name"~"^(Porto Alegre|Canoas|Eldorado do Sul|Lajeado|Estrela|Encantado)$"]->.a;(nwr["amenity"="school"]["name"](area.a););out center tags;`,
    ),
    nota: 'Escolas (OSM) para localizar as escolas-base reais',
  },
  {
    id: 'osm-abrigos-ginasios',
    url: 'https://overpass-api.de/api/interpreter',
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
];
