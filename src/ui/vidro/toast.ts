/**
 * Toast de vidro. No modo "refracao" usa o `toast()` do liquidglass preso ao palco; nos outros
 * modos (ou se a biblioteca não carregou) usa um toast simples com o mesmo desenho.
 */
import { vidroCarregado } from './carregar';

type Icone = 'check' | 'info' | 'alert' | 'bell';

function regiaoSimples(): HTMLElement {
  let r = document.getElementById('toasts-simples');
  if (!r) {
    r = document.createElement('div');
    r.id = 'toasts-simples';
    r.setAttribute('aria-live', 'polite');
    r.className = 'vidro-toasts';
    document.body.append(r);
  }
  return r;
}

export function toastVidro(mensagem: string, icone: Icone = 'info', duracaoMs = 4200) {
  if (typeof document === 'undefined') return;
  const lib = vidroCarregado();
  const palco = document.getElementById('palco-toasts') ?? document.body;
  if (lib && document.documentElement.dataset.vidro === 'refracao') {
    lib.toast(mensagem, { icon: icone, duration: duracaoMs, container: palco });
    return;
  }
  const t = document.createElement('div');
  t.setAttribute('role', 'status');
  t.className = 'vidro-toast vidro-simples';
  t.textContent = mensagem;
  regiaoSimples().prepend(t);
  const fechar = () => t.remove();
  t.addEventListener('click', fechar);
  window.setTimeout(fechar, duracaoMs);
}
