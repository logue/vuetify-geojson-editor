import chroma from 'chroma-js';
import { camelCase } from 'lodash';
import { Style, Circle, Text, Fill, Stroke, Icon } from 'ol/style';
import colors from 'vuetify/lib/util/colors.mjs';

import type FeatureStyleInterface from '@/interfaces/FeatureStyleInterface';
import type { MaterialColorType } from '@/types/MaterialColorType';

/** ピンのスタイル */
export default abstract class AbstractFeatureStyle implements FeatureStyleInterface {
  /** カラーセット */
  protected colorSet: Record<string, string>;
  /** フォント */
  protected fontFace: string;

  /** ポイントのサイズ */
  protected pointSize!: number;
  /** ポイントの塗りつぶし色 */
  protected pointFillColor!: string;
  /** ポイントの塗りつぶし量 */
  protected pointFillOpacity!: number;
  /** ポイントの外枠の色 */
  protected pointStrokeColor!: string;
  /** ポイントの塗りつぶし量 */
  protected pointStrokeOpacity!: number;
  /** ポイントの線の太さ */
  protected pointStrokeWidth!: number;
  /** ライン、ポリゴンの塗りつぶし色 */
  protected fillColor!: string;
  /** ライン、ポリゴンの塗りつぶし量 */
  protected fillOpacity!: number;
  /** ライン、ポリゴンの外枠の色 */
  protected strokeColor!: string;
  /** ライン、ポリゴンの塗りつぶし量 */
  protected strokeOpacity!: number;
  /** ラインの太さ */
  protected strokeWidth!: number;
  /** テキストカラー */
  protected textColor!: string;
  /** テキストの書式設定 */
  protected textStyle!: string;
  /** テキストの塗りつぶし量 */
  protected textOpacity!: number;
  /** テキストの外枠の色 */
  protected textStrokeColor!: string;
  /** テキストの外枠の塗りつぶし量 */
  protected textStrokeOpacity!: number;
  /** テキストの外枠の太さ */
  protected textStrokeWidth!: number;
  /** アイコンの透過率 */
  protected iconOpacity!: number;
  /** アイコンのテキストのスタイル */
  protected iconTextStyle!: string;
  /** グリッドカラー */
  protected gridColor!: string;
  /** グリッドの透過度 */
  protected gridOpacity!: number;
  /** グリッドのテキストの書式設定 */
  protected gridTextStyle!: string;

  /**
   * コンストラクタ
   *
   * @param color - マテリアルカラー
   * @param fontFace - 使用フォント
   */
  constructor(
    color: MaterialColorType = 'light-blue',
    fontFace = "'Roboto', 'Noto Sans JP','Noto Color Emoji', sans-serif"
  ) {
    // @ts-expect-error
    this.colorSet = colors[camelCase(color)];
    this.fontFace = fontFace;
  }

  /**
   * ピンのスタイル型を返す
   */
  public getStyle(): Style {
    return new Style({
      // ポリゴン向け設定
      fill: new Fill({
        color: chroma(this.fillColor).alpha(this.fillOpacity).css()
      }),
      // ライン向け設定
      stroke: new Stroke({
        color: chroma(this.strokeColor).alpha(this.strokeOpacity).css(),
        width: this.strokeWidth
      }),
      // ポイント向け設定
      image: new Circle({
        // Marker size
        radius: this.pointSize,
        // Marker Border color
        stroke: new Stroke({
          // Brown and blueGrey and Grey does not have accent color
          color: chroma(this.pointStrokeColor).alpha(this.pointStrokeOpacity).css(),
          width: this.pointStrokeWidth
        }),
        // Marker fill color
        fill: new Fill({
          color: chroma(this.pointFillColor).alpha(this.pointFillOpacity).css()
        })
      }),
      // 注釈向け設定
      text: new Text({
        // Text font
        font: this.textStyle,
        // Text color
        fill: new Fill({
          color: chroma(this.textColor).alpha(this.textOpacity).css()
        }),
        // Text outline color and blur size.
        stroke: new Stroke({
          color: chroma(this.textStrokeColor).alpha(this.textStrokeOpacity).css(),
          width: this.textStrokeWidth
        }),
        overflow: true,
        text: ''
      })
    });
  }

  /**
   * アイコンピンのスタイルを取得
   *
   * @param icon - アイコン
   */
  getIconStyle(icon: string): Style {
    return new Style({
      // アイコン
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: `${import.meta.env.BASE_URL}img/markers/${icon}.png`,
        scale: 0.75,
        opacity: this.iconOpacity
      }),
      // 注釈向け設定
      text: new Text({
        offsetX: 0,
        offsetY: 10,
        // Text font
        font: this.textStyle,
        // Text color
        fill: new Fill({
          color: chroma(this.textColor).alpha(this.textOpacity).css()
        }),
        // Text outline color and blur size.
        stroke: new Stroke({
          color: chroma(this.textStrokeColor).alpha(this.textStrokeOpacity).css(),
          width: this.textStrokeWidth
        }),
        overflow: true,
        text: ''
      })
    });
  }

  /**
   * ラベルのスタイル
   *
   * @param offset - ピンからのオフセット値
   */
  getLabelStyle(offset: number): Style {
    return new Style({
      // 注釈向け設定
      text: new Text({
        // Text font
        font: this.textStyle,
        // Text color
        fill: new Fill({
          color: chroma(this.textColor).alpha(this.textOpacity).css()
        }),
        // Text outline color and blur size.
        stroke: new Stroke({
          color: chroma(this.textStrokeColor).alpha(this.textStrokeOpacity).css(),
          width: this.textStrokeWidth
        }),
        overflow: true,
        offsetY: offset,
        text: ''
      })
    });
  }

  /** グリッドのスタイルを取得 */
  getGridStyle(): Style {
    return new Style({
      // デフォルトは 0, 190, 255
      stroke: new Stroke({
        color: chroma(this.gridColor).alpha(this.gridOpacity).css()
      }),
      // Annotation(label) text
      text: new Text({
        // Text font
        font: this.gridTextStyle,
        // Text color
        fill: new Fill({
          color: chroma(this.colorSet.accent2).css()
        }),
        // Text outline color and blur size.
        stroke: new Stroke({
          color: chroma(this.colorSet.lighten1).alpha(this.textStrokeOpacity).css(),
          width: 1
        })
      })
    });
  }
}
