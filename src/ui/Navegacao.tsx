import { useEffect } from 'react';
import { MODULOS } from '../modules/registro';
import { useOperacao } from '../store';

/** Sincroniza a tela ativa com o caminho da URL (/panorama, /rotas…). */
export function useRotaURL() {
  const tela = useOperacao((s) => s.tela);
  const setTela = useOperacao((s) => s.setTela);
  useEffect(() => {
    const ler = () => {
      const id = window.location.pathname.replace(/^\/+|\/+$/g, '') || 'panorama';
      if (MODULOS.some((m) => m.id === id)) setTela(id);
    };
    ler();
    window.addEventListener('popstate', ler);
    return () => window.removeEventListener('popstate', ler);
  }, [setTela]);
  useEffect(() => {
    const alvo = `/${tela}`;
    if (window.location.pathname !== alvo)
      window.history.pushState(null, '', alvo + window.location.search);
  }, [tela]);
}

export function Navegacao() {
  const tela = useOperacao((s) => s.tela);
  const setTela = useOperacao((s) => s.setTela);
  return (
    <nav
      aria-label="Módulos"
      className="relative z-20 flex shrink-0 gap-1 overflow-x-auto border-b border-linha bg-fundo-0/85 p-1.5 backdrop-blur md:w-40 md:flex-col md:overflow-visible md:border-b-0 md:border-r"
    >
      {MODULOS.map((m) => (
        <button
          key={m.id}
          onClick={() => setTela(m.id)}
          aria-current={tela === m.id ? 'page' : undefined}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${tela === m.id ? 'bg-claro text-fundo-0' : 'text-texto-2 hover:bg-superficie hover:text-texto'}`}
        >
          <span aria-hidden className="w-5 text-center">
            {m.icone}
          </span>
          {m.rotulo}
        </button>
      ))}
    </nav>
  );
}
