/**
 * UM único Canvas (um contexto WebGL) para o app inteiro. Trocar de tela só move a câmera
 * (transição suave de ~1 s) dentro do mesmo mundo — o renderer nunca é recriado.
 */
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, PerformanceMonitor } from '@react-three/drei';
import { useOperacao } from '../store';
import { Bacia3D } from './Bacia3D';
import { useRelevo } from './Terreno';
import { cameraEspecial, presetDaTela, VOO_ABERTURA } from './presets';
import { Ilhas } from './Ilhas';
import { CartaCrise3D } from './CartaCrise3D';
import { registrarCaptura } from './captura';

const PosProcessamento = lazy(() => import('./PosProcessamento'));

declare global {
  interface Window {
    __cc3d?: { renderers: number; perdas: number; gl?: unknown };
  }
}

function CameraRig() {
  const ref = useRef<CameraControls>(null);
  const tela = useOperacao((s) => s.tela);
  const cenario = useOperacao((s) => s.entrada.cenario);
  const etapa = useOperacao((s) => s.apresentacao);
  const reduzido = useOperacao((s) => s.movimentoReduzido);
  const recolhido = useOperacao((s) => s.painelRecolhido);
  const qualidade = useOperacao((s) => s.qualidade);
  const size = useThree((s) => s.size);
  const apresentando = etapa.ativa;
  const etapaAtual = etapa.etapa;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // o painel ocupa a direita: desloca o foco para o centro da área visível. Na distância d, a largura
    // visível é 2·d·tan(fov/2)·aspecto; o centro livre fica f/2 dessa largura à esquerda (f = fração do painel).
    const p = presetDaTela(tela, cenario, null);
    const dist = Math.hypot(p.pos[0] - p.alvo[0], p.pos[1] - p.alvo[1], p.pos[2] - p.alvo[2]);
    const painel = document.querySelector('[data-modo="3d"]')?.getBoundingClientRect().width ?? 544;
    const f = size.width > 0 ? painel / size.width : 0;
    const semPainel = recolhido || apresentando || window.innerWidth < 900 || f > 0.6;
    const meiaAltura = Math.tan(((38 / 2) * Math.PI) / 180);
    const aspecto = size.width / Math.max(1, size.height);
    // na apresentação o texto fica embaixo à esquerda: empurra o 3D um pouco para a direita
    const especial = cameraEspecial(apresentando ? etapaAtual : null);
    const desloc = apresentando
      ? especial === 'encerramento' || window.innerWidth < 900
        ? 0
        : (tela === 'fontes' ? -0.3 : -0.16) * dist * meiaAltura * aspecto
      : semPainel
        ? 0
        : f * dist * meiaAltura * aspecto;
    void c.setFocalOffset(desloc, 0, 0, !reduzido);
  }, [
    recolhido,
    reduzido,
    qualidade,
    tela,
    cenario,
    size.width,
    size.height,
    apresentando,
    etapaAtual,
  ]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const k = etapa.ativa ? etapa.etapa : null;
    const p = presetDaTela(tela, cenario, k);
    const especial = cameraEspecial(k);
    if (especial === 'abertura' && !reduzido) {
      // voo de abertura: salta para o alto e desce devagar sobre a bacia
      const { inicio } = VOO_ABERTURA;
      c.smoothTime = 2.2;
      void c
        .setLookAt(...inicio.pos, ...inicio.alvo, false)
        .then(() => c.setLookAt(...p.pos, ...p.alvo, true));
      return;
    }
    c.smoothTime = especial === 'encerramento' ? 1.6 : etapa.ativa ? 0.9 : 0.55;
    void c.setLookAt(...p.pos, ...p.alvo, !reduzido);
  }, [tela, cenario, etapa, reduzido]);
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={4}
      maxDistance={260}
      maxPolarAngle={Math.PI * 0.47}
    />
  );
}

function Registro() {
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  useEffect(() => {
    // card do LinkedIn: renderiza o quadro atual e lê o PNG na mesma tarefa (sem preserveDrawingBuffer)
    registrarCaptura(() => {
      const { gl: r, scene, camera } = get();
      r.render(scene, camera);
      return r.domElement.toDataURL('image/png');
    });
    return () => registrarCaptura(null);
  }, [get]);
  useEffect(() => {
    const w = (window.__cc3d ??= { renderers: 0, perdas: 0 });
    w.renderers += 1;
    Object.defineProperty(w, 'gl', { value: gl, enumerable: false, configurable: true });
    const perda = () => {
      w.perdas += 1;
    };
    gl.domElement.addEventListener('webglcontextlost', perda);
    return () => gl.domElement.removeEventListener('webglcontextlost', perda);
  }, [gl]);
  return null;
}

const TELAS_BACIA = ['panorama', 'linha-do-tempo', 'rotas', 'arrecadacao', 'parceiros'];

function Mundo({ passo }: { passo: number }) {
  const relevo = useRelevo();
  const rotulos = TELAS_BACIA.includes(useOperacao((s) => s.tela));
  return (
    <>
      {relevo && <Bacia3D relevo={relevo} passo={passo} rotulos={rotulos} />}
      <Ilhas />
    </>
  );
}

export function Palco({ ativo = true }: { ativo?: boolean }) {
  const qualidade = useOperacao((s) => s.qualidade);
  const pausado = useOperacao((s) => s.animacoesPausadas);
  const sugerir = useOperacao((s) => s.setSugestaoModoLeve);
  const alta = qualidade === 'alta';
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={alta ? [1, 1.75] : 1}
      frameloop={!ativo ? 'never' : pausado ? 'demand' : 'always'}
      gl={{ antialias: alta, powerPreference: 'high-performance' }}
      camera={{ fov: 38, near: 0.5, far: 900, position: [0, 85, 95] }}
      onCreated={({ gl }) => gl.setClearColor('#0b1e26')}
      aria-label="Mundo 3D da operação"
    >
      <Registro />
      <fog attach="fog" args={['#0b1e26', 160, 520]} />
      <hemisphereLight args={['#b5dcdb', '#102a35', 0.7]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-60, 90, -40]} intensity={1.5} color="#fff2e0" />
      <PerformanceMonitor
        onDecline={() => ativo && qualidade === 'alta' && sugerir(true)}
        flipflops={2}
      />
      <Suspense fallback={null}>
        <Mundo passo={alta ? 2 : 3} />
      </Suspense>
      <CameraRig />
      <CartaCrise3D />
      {alta && (
        <Suspense fallback={null}>
          <PosProcessamento />
        </Suspense>
      )}
    </Canvas>
  );
}

export default Palco;
