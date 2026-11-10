import { useFlag } from '../../config/flags';
import { Painel2DPanorama } from './Painel2D';
import { PanoramaV2 } from './PanoramaV2';

/** Visão geral: a versão da rodada 2, ou o Panorama da v1 com a flag `panoramaV2` desligada. */
export function Panorama() {
  return useFlag('panoramaV2') ? <PanoramaV2 /> : <Painel2DPanorama />;
}
