import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { getVectorContext } from 'ol/render';

import { pinStyle } from './FeatureUtility';

import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import type LineString from 'ol/geom/LineString';
import type VectorLayer from 'ol/layer/Vector';
import type RenderEvent from 'ol/render/Event';
import type VectorSource from 'ol/source/Vector';

/**
 * ルートのアニメーションクラス
 *
 * @see {@link https://openlayers.org/en/latest/examples/feature-move-animation.html}
 */
export default class AnimateRoute {
  /** 対象マップ */
  private readonly map: Map;
  /** 対象レイヤー */
  private readonly vectorLayer: VectorLayer<VectorSource>;
  /** ルートのライン */
  private readonly route: LineString;
  /** ルート開始位置 */
  private readonly startPoint: Point;

  /** 現在地のピン */
  private readonly currentFeature: Feature<Point>;
  /** 現在地 */
  private readonly currentPosition: Point;

  /** アニメーション中か */
  private animating: boolean;

  /** 移動量 */
  private distance: number;
  /** 速度 */
  private readonly speed: number;
  /** 最新の時間 */
  private lastTime: number;

  /**
   * アニメーション処理
   *
   * @param map - マップ
   * @param vectorLayer - 対象レイヤ
   * @param route - 対象のラインの線
   */
  constructor(
    map: Map,
    vectorLayer: VectorLayer<VectorSource>,
    route: LineString,
    reverse = false
  ) {
    if (!route) {
      throw Error('route is not defined.');
    }
    this.map = map;
    this.vectorLayer = vectorLayer;
    this.route = route;

    this.distance = 0;
    this.speed = 1;
    this.lastTime = 0;
    this.animating = false;

    this.startPoint = new Point(
      !reverse ? this.route.getFirstCoordinate() : this.route.getLastCoordinate()
    );

    this.currentPosition = this.startPoint;
    this.currentFeature = new Feature({
      style: pinStyle,
      geometry: this.currentPosition
    });
  }

  /**
   * アニメーション処理
   *
   * @param event - イベント
   */
  private moveFeature(event: RenderEvent): void {
    if (!this.route || !event.frameState) {
      return;
    }
    console.log(this.route);
    /** 開始時間 */
    const time = event.frameState.time;
    /** 経過時間 */
    const elapsedTime = time - this.lastTime;

    this.distance = (this.distance + (this.speed * elapsedTime) / 1e6) % 2;
    this.lastTime = time;

    /** 現在の座標 */
    const currentCoordinate: Coordinate = this.route.getCoordinateAt(
      this.distance > 1 ? 2 - this.distance : this.distance
    );
    this.currentPosition.setCoordinates(currentCoordinate);

    /** ベクタに描画 */
    const vectorContext = getVectorContext(event);
    vectorContext.setStyle(pinStyle);
    vectorContext.drawGeometry(this.currentPosition);

    // マップを再描画
    this.map.render();
  }

  /** アニメーション開始 */
  public start(): void {
    this.animating = true;
    this.lastTime = Date.now();
    this.vectorLayer.on('postrender', this.moveFeature);
    this.currentFeature.setGeometry(undefined);
  }

  /** アニメーション終了 */
  public stop(): void {
    this.animating = false;
    this.currentFeature.setGeometry(this.currentPosition);
    this.vectorLayer.un('postrender', this.moveFeature);
  }

  /** 一時停止 */
  public toggle(): void {
    if (this.animating) {
      this.stop();
    } else {
      this.start();
    }
  }

  /** リセット */
  public reset(): void {
    this.stop();
    this.currentFeature.setGeometry(this.startPoint);
    this.start();
  }
}
