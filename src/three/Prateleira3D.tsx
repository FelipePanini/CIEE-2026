/**
 * Ilha "prateleira do abrigo": pilhas de galões, caixas, fardos, cobertores e rolos cuja altura é igual
 * aos dias de cobertura na chegada da reposição. A pilha fica vermelha abaixo do prazo crítico.
 * "A água acaba antes do papel higiênico — e dá para ver isso."
 */
import { useOperacao, useResultado } from '../store';
import { ITENS, itemPorId } from '../engine/urgencia';
import { ILHAS } from './mundo';
import { Rotulo } from './Rotulo';

const ALT_DIA = 0.55; // unidades por dia de cobertura
const MAX_DIAS = 14;
const COR_ITEM = {
  agua: '#2fa8a3',
  alimentos: '#c89a63',
  higiene: '#8f7ae0',
  cobertores: '#bd8413',
  papel_roupas: '#f3efe6',
} as const;

function Unidade({ item, y, cor }: { item: keyof typeof COR_ITEM; y: number; cor: string }) {
  if (item === 'agua' || item === 'papel_roupas')
    return (
      <mesh position={[0, y, 0]}>
        <cylinderGeometry
          args={[item === 'agua' ? 0.42 : 0.3, item === 'agua' ? 0.42 : 0.3, ALT_DIA * 0.9, 14]}
        />
        <meshStandardMaterial color={cor} />
      </mesh>
    );
  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry
        args={[item === 'cobertores' ? 1.3 : 1, ALT_DIA * 0.88, item === 'higiene' ? 0.7 : 0.9]}
      />
      <meshStandardMaterial color={cor} />
    </mesh>
  );
}

export function Prateleira3D() {
  const r = useResultado();
  const rotulos = useOperacao((s) => s.tela) === 'urgencia';
  const sel = useOperacao((s) => s.abrigoSelecionado);
  const locais = r.locais.filter((l) => l.pessoasN > 0);
  const local =
    locais.find((l) => l.id === sel) ??
    [...locais].sort((a, b) => b.urgenciaMax - a.urgenciaMax)[0];
  if (!local) return null;
  return (
    <group position={ILHAS.prateleira}>
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[16, 0.2, 4]} />
        <meshStandardMaterial color="#17343d" />
      </mesh>
      {/* estrutura da estante */}
      {[-7.8, 7.8].map((x) => (
        <mesh key={x} position={[x, 4, -1.6]}>
          <boxGeometry args={[0.25, 8, 0.25]} />
          <meshStandardMaterial color="#8cc7c5" />
        </mesh>
      ))}
      {local.urgencias.map((u, i) => {
        const x = -6 + i * 3;
        const dias = Math.min(MAX_DIAS, u.coberturaNaChegada.valor);
        const n = Math.max(0, Math.round(dias));
        const critico = u.critico;
        const cor = critico ? '#ef6a4b' : COR_ITEM[u.item];
        return (
          <group key={u.item} position={[x, 0, 0]}>
            {Array.from({ length: n }, (_, k) => (
              <Unidade key={k} item={u.item} y={ALT_DIA / 2 + k * ALT_DIA} cor={cor} />
            ))}
            {n === 0 && (
              <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[1, 0.1, 0.9]} />
                <meshStandardMaterial color="#ef6a4b" emissive="#ef6a4b" emissiveIntensity={0.8} />
              </mesh>
            )}
            {/* marca do prazo crítico */}
            <mesh position={[0, u.prazo * ALT_DIA, 0]}>
              <boxGeometry args={[1.7, 0.05, 1.3]} />
              <meshBasicMaterial color="#f3efe6" transparent opacity={0.8} />
            </mesh>
            <Rotulo
              visivel={rotulos}
              position={[0, Math.max(n, u.prazo) * ALT_DIA + 1.1, 0]}
              center
              distanceFactor={18}
              zIndexRange={[5, 0]}
              className="pointer-events-none select-none"
            >
              <div
                className={`whitespace-nowrap rounded px-2 py-1 text-center text-[12px] leading-tight ${critico ? 'bg-coral-500 text-navy-950' : 'bg-navy-950/85 text-creme-100'}`}
              >
                <strong>{itemPorId(u.item).nome}</strong>
                <div>
                  {u.coberturaNaChegada.valor >= 999
                    ? 'coberto'
                    : `${u.coberturaNaChegada.valor.toFixed(1).replace('.', ',')} dias`}{' '}
                  · prazo {u.prazo} d
                </div>
              </div>
            </Rotulo>
          </group>
        );
      })}
      <Rotulo
        visivel={rotulos}
        position={[0, 9.6, 0]}
        center
        distanceFactor={22}
        zIndexRange={[5, 0]}
        className="pointer-events-none select-none"
      >
        <div className="whitespace-nowrap text-center [text-shadow:0_2px_6px_#0b1e26]">
          <div className="font-display text-[18px] text-creme-100">Prateleira: {local.nome}</div>
          <div className="text-[12px] text-creme-200">
            {Math.round(local.pessoasN)} pessoas · altura da pilha = dias de cobertura (
            {ITENS.length} itens)
          </div>
        </div>
      </Rotulo>
    </group>
  );
}
