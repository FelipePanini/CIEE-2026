/** Ícones monocromáticos (traço, 24×24) desenhados para o dock e a barra. Herdam a cor do texto. */
import type { ReactNode } from 'react';

const TRACOS: Record<string, ReactNode> = {
  panorama: (
    <>
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z" />
      <path d="M9 4v13M15 7v13" />
    </>
  ),
  'linha-do-tempo': <path d="M3 17l5-6 4 3 5-8 4 5M3 21h18" />,
  urgencia: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  arrecadacao: (
    <>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  rotas: (
    <>
      <path d="M2 7h11v9H2zM13 10h5l3 3v3h-8z" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  quadra: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  gastos: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6.5 9.5v5M17.5 9.5v5" />
    </>
  ),
  administracao: (
    <>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5" cy="18" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M12 7.2V12M12 12l-5.6 4.2M12 12l5.6 4.2" />
    </>
  ),
  parceiros: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16.5" cy="10" r="2.4" />
      <path d="M2.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6M14.5 14.6c3-.5 5.6.9 6.6 4" />
    </>
  ),
  fontes: <path d="M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5" />,
  carta: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M12 8l2.5 4-2.5 4-2.5-4z" />
    </>
  ),
  apresentar: <path d="M7 4.5v15l12-7.5z" />,
  mais: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
  painel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M14 4v16" />
    </>
  ),
};

export function Icone({ nome, tamanho = 20 }: { nome: string; tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {TRACOS[nome] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
