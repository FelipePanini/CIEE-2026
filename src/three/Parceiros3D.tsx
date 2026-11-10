/** Parceiros no mapa (tela Parceiros): marcador por tipo de ajuda e linha do match automático até o abrigo. */
import { Line } from '@react-three/drei';
import { DADOS } from '../data/carregar';
import { useOperacao, useResultado } from '../store';
import { elevacao, paraMundo, Y_POR_METRO, type Relevo } from './mundo';
import { Rotulo } from './Rotulo';
import { cor } from '../ui/cores';

const COR = {
  produto: cor('cinza-3'),
  veiculo: cor('cinza-2'),
  espaco: cor('cinza-3'),
  voluntarios: cor('cinza-1'),
} as const;

export function Parceiros3D({ relevo }: { relevo: Relevo }) {
  const ativo = useOperacao((s) => s.tela) === 'parceiros';
  const r = useResultado();
  const p3 = (lat: number, lon: number, dy = 0): [number, number, number] => {
    const [x, z] = paraMundo(lat, lon);
    return [x, Math.max(0, elevacao(relevo, lat, lon)) * Y_POR_METRO + dy, z];
  };
  return (
    <group visible={ativo}>
      {DADOS.parceiros.parceiros.map((p, i) => {
        const pos = p3(p.lat, p.lon, 1.2);
        // alterna a altura do rótulo para separar parceiros vizinhos (Estrela/Lajeado, Canoas/POA)
        const alturaRotulo = 1 + (i % 3) * 1.6;
        return (
          <group key={p.id}>
            <mesh position={pos}>
              <octahedronGeometry args={[0.6]} />
              <meshStandardMaterial
                color={COR[p.tipo_ajuda]}
                emissive={COR[p.tipo_ajuda]}
                emissiveIntensity={0.4}
              />
            </mesh>
            <Rotulo
              visivel={ativo}
              position={[pos[0], pos[1] + alturaRotulo, pos[2]]}
              center
              distanceFactor={55}
            >
              <div
                className="whitespace-nowrap rounded bg-fundo-0/80 px-1.5 py-0.5 text-[10px] text-texto"
                style={{ borderLeft: `3px solid ${COR[p.tipo_ajuda]}` }}
              >
                {p.nome}
              </div>
            </Rotulo>
          </group>
        );
      })}
      {ativo &&
        r.sugestoes.slice(0, 10).map((s, i) => {
          const pa = DADOS.parceiros.parceiros.find((x) => x.id === s.parceiro)!;
          const l = r.locais.find((x) => x.id === s.local)!;
          return (
            <Line
              key={i}
              points={[p3(pa.lat, pa.lon, 1.2), p3(l.lat, l.lon, 2.5)]}
              color={cor('atencao')}
              lineWidth={2}
              dashed
              dashSize={0.6}
              gapSize={0.4}
            />
          );
        })}
    </group>
  );
}
