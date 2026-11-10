/**
 * UM único Canvas (um contexto WebGL) para o app inteiro. Trocar de tela só move a câmera
 * (transição suave de ~1 s) dentro do mesmo mundo — o renderer nunca é recriado.
 */
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CameraControls, PerformanceMonitor } from '@react-three/drei';
import { useOperacao } from '../store';
import { Bacia3D } from './Bacia3D';
import { useRelevo } from './Terreno';
import { cameraEspecial, presetDaTela, VOO_ABERTURA } from './presets';
import { CenaDoMundo, Ilhas } from './Ilhas';
import { Horizonte } from './Horizonte';
import { Contexto3D } from './Contexto3D';
import { atualizarZoom, cenaDaTela } from './zoom';
import { ILHAS, paraMundo } from './mundo';
import { useFlag } from '../config/flags';
import * as THREE from 'three';
import { CartaCrise3D } from './CartaCrise3D';
import { registrarCaptura } from './captura';
import { SincroniaCamera } from './rotulos/camera';
import { cor } from '../ui/cores';

const PosProcessamento = lazy(() => import('./PosProcessamento'));

declare global {
  interface Window {
    __cc3d?: { renderers: number; perdas: number; gl?: unknown; controles?: CameraControls };
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
  // voo até um ponto pedido pela interface (município crítico, busca de cidade…)
  const foco = useOperacao((s) => s.focoCamera);
  useEffect(() => {
    const c = ref.current;
    if (!c || !foco) return;
    const [x, z] = paraMundo(foco.lat, foco.lon);
    c.smoothTime = 0.8;
    void c.moveTo(x, 0.5, z, !reduzido);
    void c.dollyTo(foco.dist, !reduzido);
  }, [foco, reduzido]);
  // Limites por cena: a câmera não passa por baixo do terreno, não se afasta além do que a cena
  // comporta e o alvo (pan) fica preso à área do mapa.
  const contexto = useFlag('contextoBrasil');
  const cena = cenaDaTela(tela);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (cena === 'bacia') {
      c.minDistance = 10;
      c.maxDistance = contexto && !apresentando ? 1700 : 300;
      const caixa = contexto
        ? new THREE.Box3(
            new THREE.Vector3(paraMundo(-33.8, -57.7)[0], 0, paraMundo(-21.5, -44)[1]),
            new THREE.Vector3(paraMundo(-21.5, -44)[0], 30, paraMundo(-33.8, -57.7)[1]),
          )
        : new THREE.Box3(new THREE.Vector3(-70, 0, -70), new THREE.Vector3(70, 30, 70));
      c.setBoundary(caixa);
    } else {
      const o = ILHAS[cena];
      c.minDistance = 6;
      c.maxDistance = 95;
      c.setBoundary(
        new THREE.Box3(
          new THREE.Vector3(o[0] - 16, 0, o[2] - 16),
          new THREE.Vector3(o[0] + 16, 16, o[2] + 16),
        ),
      );
    }
  }, [cena, contexto, apresentando]);
  // fog exponencial proporcional à distância: o que está muito além do foco some na cor do fundo
  const cena3 = useThree((s) => s.scene);
  useFrame(() => {
    const c = ref.current;
    if (!c) return;
    // acesso para os testes de ponta a ponta (zoom e colisão de rótulos)
    if (window.__cc3d && !window.__cc3d.controles) window.__cc3d.controles = c;
    const d = c.distance;
    atualizarZoom(d);
    const fog = cena3.fog as THREE.FogExp2 | null;
    if (fog && 'density' in fog) fog.density = 0.36 / Math.max(40, d);
  });
  return <CameraControls ref={ref} makeDefault maxPolarAngle={Math.PI * 0.47} />;
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
  const contexto = useFlag('contextoBrasil');
  const rotulos = TELAS_BACIA.includes(useOperacao((s) => s.tela));
  return (
    <>
      <Horizonte />
      {contexto && <Contexto3D />}
      <CenaDoMundo nome="bacia">
        {relevo && <Bacia3D relevo={relevo} passo={passo} rotulos={rotulos} />}
      </CenaDoMundo>
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
      camera={{ fov: 38, near: 0.5, far: 9000, position: [0, 85, 95] }}
      onCreated={({ gl }) => gl.setClearColor(cor('fundo-0'))}
      aria-label="Mundo 3D da operação"
    >
      <Registro />
      <SincroniaCamera />
      <fogExp2 attach="fog" args={[cor('fundo-1'), 0.003]} />
      <hemisphereLight args={[cor('cinza-2'), cor('fundo-1'), 0.7]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-60, 90, -40]} intensity={1.5} color={cor('texto')} />
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
