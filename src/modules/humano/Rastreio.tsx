/**
 * Camada humana — rastreio do kit por QR code (mock).
 * A etiqueta leva um código e um QR que abre /rastreio/KIT-AAAA-NNNN. O doador vê que a caixa chegou ao
 * abrigo; nenhum dado de família é coletado ou exibido.
 */
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { DADOS, nomeMunicipio } from '../../data/carregar';
import { useOperacao, useResultado } from '../../store';
import { codigoKit, jornadaKit, PADRAO_CODIGO, type Jornada } from '../../engine/rastreio';
import { Botao, Painel } from '../../ui/blocos';
import { SeloCamada } from '../../ui/SeloCamada';
import { cor } from '../../ui/cores';

const ANO = 2026;
const urlRastreio = (codigo: string) => `${window.location.origin}/rastreio/${codigo}`;

function useQR(texto: string) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let vivo = true;
    QRCode.toString(texto, {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: cor('fundo-0'), light: cor('texto') },
    }).then((s) => vivo && setSvg(s));
    return () => {
      vivo = false;
    };
  }, [texto]);
  return svg;
}

export function LinhaJornada({ jornada }: { jornada: Jornada }) {
  return (
    <ol className="relative flex flex-col gap-3 border-l-2 border-linha-forte pl-4">
      {jornada.etapas.map((e, i) => (
        <li key={e.id} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[1.42rem] top-0.5 grid h-4 w-4 place-items-center rounded-full text-[0.55rem] font-bold ${
              i === jornada.etapas.length - 1 ? 'bg-texto text-fundo-0' : 'bg-cinza-2 text-fundo-0'
            }`}
          >
            ✓
          </span>
          <p className="text-sm font-semibold">{e.titulo}</p>
          <p className="text-xs text-texto-2">{e.detalhe}</p>
        </li>
      ))}
    </ol>
  );
}

/** Painel da quadra: etiqueta com QR do próximo kit + prévia da jornada. */
export function EtiquetaKit() {
  const r = useResultado();
  const bilhetes = useOperacao((s) => s.bilhetes);
  const [seq, setSeq] = useState(1);
  const codigo = codigoKit(ANO, seq);
  const svg = useQR(urlRastreio(codigo));
  const jornada = jornadaKit(codigo, r, DADOS, bilhetes, nomeMunicipio);
  return (
    <Painel titulo="Rastreio do kit por QR code">
      <div className="flex flex-wrap items-start gap-4">
        <figure className="painel-claro flex w-40 flex-col items-center gap-1 p-2 text-fundo-0">
          <div
            className="w-full"
            role="img"
            aria-label={`QR code do ${codigo}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <figcaption className="font-display text-sm tracking-wide">{codigo}</figcaption>
          <span className="text-[0.6rem] uppercase">escaneie para acompanhar</span>
        </figure>
        <div className="flex min-w-[14rem] flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <SeloCamada camada="CALCULADO" texto="DEMONSTRAÇÃO · jornada do motor" />
          </div>
          {jornada ? (
            <LinhaJornada jornada={jornada} />
          ) : (
            <p className="text-xs text-texto-2">Sem abrigo com rota no cenário atual.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Botao onClick={() => setSeq((s) => s + 1)}>Próximo kit</Botao>
            <a
              href={`/rastreio/${codigo}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-texto-2 underline"
            >
              Abrir a página do doador ↗
            </a>
          </div>
        </div>
      </div>
      <p className="text-[0.68rem] text-texto-2">
        O código identifica a <strong>caixa</strong>, não quem a recebeu: nenhum nome, endereço ou
        contato de família é registrado (LGPD).
      </p>
    </Painel>
  );
}

/** Página pública aberta pelo QR (/rastreio/KIT-AAAA-NNNN), sem 3D e sem controles da operação. */
export function PaginaRastreio({ codigo }: { codigo: string }) {
  const r = useResultado();
  const bilhetes = useOperacao((s) => s.bilhetes);
  const valido = PADRAO_CODIGO.test(codigo);
  const jornada = valido ? jornadaKit(codigo, r, DADOS, bilhetes, nomeMunicipio) : null;
  return (
    <div className="min-h-full bg-fundo-1 px-4 py-8 text-texto">
      <main className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex flex-col gap-1">
          <span className="text-xs text-texto-2">Solução Distribuidora · Ação Social RS</span>
          <h1 className="font-display text-2xl">Rastreio do kit</h1>
          <p className="font-display text-lg tracking-wide text-texto">{codigo}</p>
          <SeloCamada camada="CALCULADO" texto="DEMONSTRAÇÃO" className="self-start" />
        </header>
        {jornada ? (
          <>
            <p className="text-sm">
              Obrigado! A sua doação chegou a <strong>{jornada.destino.nome}</strong>, em{' '}
              {nomeMunicipio(jornada.destino.municipio)}.
            </p>
            <LinhaJornada jornada={jornada} />
          </>
        ) : (
          <p className="text-sm text-texto-2">
            Código não encontrado. Confira se está no formato KIT-2026-0001.
          </p>
        )}
        <p className="rounded-lg bg-superficie p-3 text-xs text-texto-2">
          <strong className="text-texto">Privacidade:</strong> este rastreio mostra só o caminho da
          caixa. Nenhum dado de família é coletado ou exibido.
        </p>
        <a href="/panorama" className="text-xs text-texto-2 underline">
          Abrir a Central de Comando
        </a>
      </main>
    </div>
  );
}
