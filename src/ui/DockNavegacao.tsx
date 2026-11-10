/** Navegação entre as telas num dock de vidro na parte de baixo (estilo macOS). */
import { MODULOS } from '../modules/registro';
import { useOperacao } from '../store';
import { GlassDock } from './vidro';
import { Icone } from './icones';

export function DockNavegacao() {
  const tela = useOperacao((s) => s.tela);
  const setTela = useOperacao((s) => s.setTela);
  return (
    <GlassDock rotulo="Módulos" className="dock-navegacao">
      {MODULOS.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setTela(m.id)}
          aria-current={tela === m.id ? 'page' : undefined}
          aria-label={m.rotulo}
          className="dock-item"
        >
          <Icone nome={m.id} tamanho={22} />
          <span className="dock-nome">{m.rotulo}</span>
        </button>
      ))}
    </GlassDock>
  );
}
