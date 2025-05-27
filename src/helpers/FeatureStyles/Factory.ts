import SectionPolygonSelectedStyle from './Status/SectionPolygonSelectedStyle';

import type FeatureStyleInterface from '@/interfaces/FeatureStyleInterface';
import type { MaterialColorType } from '@/types/MaterialColorType';
import type { Style } from 'ol/style';

import FeatureStatus, { type FeatureStatusType } from '@/helpers/FeatureStyles/FeatureStatus';
import ActiveStyle from '@/helpers/FeatureStyles/Status/ActiveStyle';
import DefaultStyle from '@/helpers/FeatureStyles/Status/DefaultStyle';
import HoverStyle from '@/helpers/FeatureStyles/Status/HoverStyle';
import InActiveStyle from '@/helpers/FeatureStyles/Status/InActiveStyle';
import SectionPolygonActiveStyle from '@/helpers/FeatureStyles/Status/SectionPolygonActiveStyle';
import SectionPolygonHoverStyle from '@/helpers/FeatureStyles/Status/SectionPolygonHoverStyle';
import SectionPolygonInActiveStyle from '@/helpers/FeatureStyles/Status/SectionPolygonInActiveStyle';
import SectionPolygonStyle from '@/helpers/FeatureStyles/Status/SectionPolygonStyle';
import SelectedStyle from '@/helpers/FeatureStyles/Status/SelectedStyle';

/** ピンのスタイルのファクトリークラス */
export default class Factory {
  /** フォント */
  public static readonly fontFace = "'Roboto', 'Noto Sans JP','Noto Color Emoji', sans-serif";

  /**
   * スタイルを取得
   *
   * @param color - マテリアルカラー
   * @param status - ステータス
   */
  static getStyle(
    color: MaterialColorType,
    status: FeatureStatusType = FeatureStatus.ACTIVE
  ): Style {
    let style: FeatureStyleInterface;
    switch (status) {
      // 別レイヤなどのとき
      case FeatureStatus.INACTIVE:
        style = new InActiveStyle(color, this.fontFace);
        break;
      // 選択したとき
      case FeatureStatus.SELECTED:
        style = new SelectedStyle(color, this.fontFace);
        break;
      // マウスオーバー時
      case FeatureStatus.HOVER:
        style = new HoverStyle(color, this.fontFace);
        break;
      // 通常時
      case FeatureStatus.ACTIVE:
        style = new ActiveStyle(color, this.fontFace);
        break;
      default:
        style = new DefaultStyle(color, this.fontFace);
    }

    return style.getStyle(color);
  }

  /**
   * セクションのポリゴンスタイルを取得
   *
   * @param color - マテリアルカラー
   * @param status - ステータス
   */
  static getSectionPolygonStyle(
    color: MaterialColorType,
    status: FeatureStatusType = FeatureStatus.ACTIVE
  ): Style {
    let style: FeatureStyleInterface;
    switch (status) {
      // 別レイヤ
      case FeatureStatus.INACTIVE:
        style = new SectionPolygonInActiveStyle(color, this.fontFace);
        break;
      // 選択したとき
      case FeatureStatus.SELECTED:
        style = new SectionPolygonSelectedStyle(color, this.fontFace);
        break;
      // ホーバー
      case FeatureStatus.HOVER:
        style = new SectionPolygonHoverStyle(color, this.fontFace);
        break;
      case FeatureStatus.ACTIVE:
        style = new SectionPolygonActiveStyle(color, this.fontFace);
        break;
      default:
        style = new SectionPolygonStyle(color, this.fontFace);
    }

    return style.getStyle(color);
  }

  /**
   * アイコンスタイルを取得
   *
   * @param icon - アイコン
   * @param color - テキストカラー
   * @param status - ステータス
   */
  static getIconStyle(
    icon = 'pin',
    color: MaterialColorType = 'blue-grey',
    status: FeatureStatusType = FeatureStatus.ACTIVE
  ): Style {
    let style: FeatureStyleInterface;
    switch (status) {
      // 別レイヤなどのとき
      case FeatureStatus.INACTIVE:
        style = new InActiveStyle(color, this.fontFace);
        break;
      // 選択したとき
      case FeatureStatus.SELECTED:
        style = new SelectedStyle(color, this.fontFace);
        break;
      case FeatureStatus.ACTIVE:
        style = new ActiveStyle(color, this.fontFace);
        break;
      default:
        // 通常時
        style = new ActiveStyle(color, this.fontFace);
    }

    return style.getIconStyle(icon);
  }

  /**
   * グリッドスタイル
   *
   * @param color - マテリアルカラー
   */
  static getGridStyle(color: MaterialColorType = 'light-blue'): Style {
    return new DefaultStyle(color, this.fontFace).getGridStyle();
  }
}
