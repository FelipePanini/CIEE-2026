/**
 * UM único Canvas (um contexto WebGL) para o app inteiro. Trocar de tela só move a câmera
 * (transição suave de ~1 s) dentro do mesmo mundo — o renderer nunca é recriado.
 */
import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { useOperacao } from '../store';
import { Bacia3D } from './Bacia3D';
import { useRelevo } from './Terreno';
import { presetDaTela } from './presets';
import { Ilhas } from './Ilhas';
import { CartaCrise3D } from './CartaCrise3D';

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
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // o painel ocupa a direita: desloca o foco para o centro da área visível (proporcional à distância)
    const p = presetDaTela(tela, cenario, null);
    const dist = Math.hypot(p.pos[0] - p.alvo[0], p.pos[1] - p.alvo[1], p.pos[2] - p.alvo[2]);
    void c.setFocalOffset(recolhido || window.innerWidth < 900 ? 0 : dist * 0.11, 0, 0, !reduzido);
  }, [recolhido, reduzido, qualidade, tela, cenario]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const p = presetDaTela(tela, cenario, etapa.ativa ? etapa.etapa : null);
    c.smoothTime = 0.55;
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
      dpr={alta ? [1, 2] : 1}
      frameloop={!ativo ? 'never' : pausado ? 'demand' : 'always'}
      gl={{ antialias: alta, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
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
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.35} luminanceThreshold={0.75} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

export default Palco;
