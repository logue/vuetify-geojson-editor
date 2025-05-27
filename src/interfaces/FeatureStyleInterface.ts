import type { MaterialColorType } from '@/types/MaterialColorType';
import type { Style } from 'ol/style';

/** ピンのスタイルのインターフェース */
export default interface FeatureStyleInterface {
  /** ピンのスタイル型を返す */
  getStyle: (color: MaterialColorType) => Style;
  /** アイコンのスタイル型を返す */
  getIconStyle: (icon: string) => Style;
  /** グリッドのスタイル型を返す */
  getGridStyle: (color: MaterialColorType) => Style;
}
