/** ピンのデザインなどのユーティリティー関数群 */
import { useGlobal } from '@/store';

import chroma from 'chroma-js';
// openlayers
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Icon, Style } from 'ol/style';

import type { FeatureStatusType } from '@/helpers/FeatureStyles/FeatureStatus';
import type FeatureProperties from '@/interfaces/FeatureProperties';
import type { FeatureCollection } from 'geojson';
import type { FeatureLike } from 'ol/Feature';

import FeatureStyles from '@/helpers/FeatureStyles';
import FeatureStatus from '@/helpers/FeatureStyles/FeatureStatus';
import axios from '@/plugins/axios';

/**
 * Geojsonを読み込む
 *
 * @param file - Geojsonファイルのパス
 * @returns
 */
export async function getGeoJson(file: string): Promise<FeatureCollection | null> {
  const globalStore = useGlobal();
  try {
    const ret = await axios.get(`${import.meta.env.BASE_URL}data/${file}.geojson`);
    return ret.data;
  } catch (error) {
    globalStore.setMessage(error?.toString());
  }
  return null;
}

/** ピンマーカーのスタイル */
export const pinStyle = new Style({
  image: new Icon({
    anchor: [0.5, 86],
    anchorXUnits: 'fraction',
    anchorYUnits: 'pixels',
    src: `${import.meta.env.BASE_URL}img/spotlight-poi2_hdpi.png`,
    crossOrigin: 'anonymous',
    opacity: 1,
    size: [54, 86],
    scale: 0.5
  })
});

/**
 * マーカーのスタイル設定
 *
 * @param vectorLayer - 対象ベクターレイヤー
 * @param level - 階層レベル
 * @param zoom - ズーム値
 * @param status - オーバーライドするスタイル
 */
export function setFeaturesStyle(
  vectorLayer: VectorLayer<VectorSource> | undefined,
  level = 0,
  zoom = 0,
  status: FeatureStatusType | undefined = undefined
): void {
  if (!vectorLayer) {
    return;
  }

  /** 現在のズーム値 */
  // const zoom = map.getView().getResolutionForZoom(2);
  vectorLayer.setStyle((feature: FeatureLike, resolution: number) => {
    // GeoJsonのプロパティを取得
    const props: FeatureProperties = feature.getProperties() as FeatureProperties;
    /** ジオメトリ */
    const geometry = feature.getGeometry();
    /** 現在のレイヤか */
    const isCurrentLayer = (props.level ?? 0) === level;
    /** ステータス別スタイル */
    const defaultStyle = isCurrentLayer ? FeatureStatus.ACTIVE : FeatureStatus.INACTIVE;

    /** スタイルを反映 */
    const style: Style = getFeatureStyle(
      feature,
      status ?? defaultStyle,
      vectorLayer.getProperties().id as string
    );

    if (geometry?.getType() === 'Point' && props.icon && zoom !== 0) {
      // アイコンのサイズを調整
      console.log(resolution);
      style.getImage()?.setScale(zoom / resolution);
    }
    return style;
  });
}
/**
 * マーカーの表示／非表示設定
 *
 * @param vectorLayer - 対象レイヤー
 * @param level - レイヤーレベル
 * @param checked - 表示するマーカーの種別
 */
export function setFeaturesVisibility(
  vectorLayer: VectorLayer<VectorSource> | undefined,
  level: number,
  checked: string[]
): void {
  if (!vectorLayer) {
    return;
  }
  vectorLayer.setStyle((feature, _resolution: number) => {
    // GeoJsonのプロパティを取得
    const props: FeatureProperties = feature.getProperties() as FeatureProperties;
    /** 現在のレイヤか */
    const isCurrentLevel = (props.level ?? 0) === level;

    // 表示／非表示制御
    if (checked !== null) {
      // Invisible
      return new Style({});
    }
    // Visible
    return getFeatureStyle(
      feature,
      isCurrentLevel ? FeatureStatus.ACTIVE : FeatureStatus.INACTIVE,
      vectorLayer.getProperties().id as string
    );
  });
}

/**
 * スタイルを取得
 *
 * @param feature - ピン
 * @param status - ステータス
 * @param layerId - レイヤ名
 * @returns - ピンのスタイル
 */
export function getFeatureStyle(
  feature: FeatureLike,
  status: FeatureStatusType = FeatureStatus.ACTIVE,
  layerId?: string
): Style {
  // GeoJsonのプロパティを取得
  const props: FeatureProperties = feature.getProperties() as FeatureProperties;

  /** スタイル */
  let style: Style;
  if (props.icon) {
    // アイコンモード
    style = FeatureStyles.getIconStyle(props.icon, props.color, status);

    // 注釈を入れる
    style.getText()?.setText(props.annotation?.toString());
  } else {
    // カテゴリレイヤの場合

    /** Get all type list. */
    const index = 6; // どっから6という数字が・・・？

    // ピンにカテゴリ別番号を表示する場合annotationを上書き
    if (!props.annotation) {
      props.annotation = index + 1;
      props.annotationStyle = '500 0.5rem';
    }

    // Apply marker color
    if (layerId === 'sectionLayer' && feature.getGeometry()?.getType() === 'Polygon') {
      style = FeatureStyles.getSectionPolygonStyle(props.color, status);
    } else {
      style = FeatureStyles.getStyle(props.color, status);
    }
  }

  if (status !== FeatureStatus.SELECTED) {
    // 線の太さ
    if (props.thickness) {
      style.getStroke()?.setWidth(props.thickness);
    }

    /** 塗りつぶし */
    const fill = style.getFill();
    if (props.opacity && fill) {
      /** 塗りつぶし設定 */
      const opacity = props.opacity;
      /** セットされている色 */
      const color = chroma(fill.getColor() as string);

      /** 塗りつぶしの透過度 */
      let alpha = status === FeatureStatus.ACTIVE ? opacity : opacity / 2;

      if (status === FeatureStatus.HOVER) {
        alpha = 0.25;
      }

      // スタイルに反映
      style.getFill()?.setColor(chroma(color).alpha(alpha).css());
    }
  }

  // 注釈
  if (props.annotation && !props.icon) {
    if (feature.getGeometry()?.getType() === 'Point' && typeof props.annotation !== 'number') {
      // ポイントのときで数字でない場合は背景のポイント画像を隠す
      // GeoJsonで指定されている文字列は原則的にstring型になるのでその場合はピンの画像が表示されない。
      style.getImage()?.setOpacity(0);
    }
    style.getText()?.setText(props.annotation.toString());

    if (props.annotationStyle) {
      // 注釈スタイルの上書き
      style.getText()?.setFont(`${props.annotationStyle} ${FeatureStyles.fontFace}`);
    }
  }

  return style;
}
