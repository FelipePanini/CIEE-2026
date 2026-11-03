/** Pós-processamento (só no modo alta): carregado sob demanda, fora do pacote principal do 3D. */
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

export default function PosProcessamento() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.35} luminanceThreshold={0.75} mipmapBlur />
      <Vignette eskil={false} offset={0.25} darkness={0.55} />
    </EffectComposer>
  );
}
