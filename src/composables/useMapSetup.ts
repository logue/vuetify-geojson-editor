/** マップセットアップ用Composable */
import { useMapCursorStore } from '@/store';
import { computed, shallowRef, type ShallowRef, type WritableComputedRef } from 'vue';

// openlayers
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Map from 'ol/Map';
import View from 'ol/View';
import { Attribution, MousePosition, Zoom, ZoomSlider, ScaleLine } from 'ol/control';
import { createStringXY } from 'ol/coordinate';
import { singleClick } from 'ol/events/condition';
import MVT from 'ol/format/MVT';
import Point from 'ol/geom/Point';
import { Interaction, PinchRotate, Select } from 'ol/interaction';
import { Tile, Vector as VectorLayer } from 'ol/layer';
import VectorTileLayer from 'ol/layer/VectorTile';
import { transform } from 'ol/proj';
import { OSM, Vector as VectorSource, XYZ } from 'ol/source';
import VectorTileSource from 'ol/source/VectorTile';
// ol-ext
import LayerPopup from 'ol-ext/control/LayerPopup';
import Notification from 'ol-ext/control/Notification';
import ProgressBar from 'ol-ext/control/ProgressBar';
import Scale from 'ol-ext/control/Scale';

import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';

// ヘルパ
import { stylingVectorTile } from '@/helpers/FeatureStyles/stylingVectorTile';
import { pinStyle } from '@/helpers/FeatureUtility';

export interface MapSetupOptions {
  /** ズーム値 */
  zoom?: number;
  /** 最小ズームアウト値 */
  minZoom?: number;
  /** 最大ズームイン値 */
  maxZoom?: number;
  /** 表示限界領域（↓←↑→） */
  extentLimit?: Extent;
  /** 中心座標 */
  center?: Coordinate;
  /** ローディングのテキスト */
  loadingMessage?: string;
}

/**
 * OpenLayersマップのセットアップと管理を行うComposable
 */
export function useMapSetup(options: MapSetupOptions = {}) {
  const {
    zoom = 8,
    minZoom = 4,
    maxZoom = 18,
    extentLimit,
    center = [139.766667, 35.681111],
    loadingMessage = 'Now Loading...'
  } = options;

  /** マップのカーソルストア */
  const mapCursorStore = useMapCursorStore();

  /** 現在のズーム */
  const currentZoom: WritableComputedRef<number> = computed({
    get: () => mapCursorStore.zoom,
    set: z => mapCursorStore.setZoom(z)
  });

  /** 現在地 */
  const currentPosition: WritableComputedRef<Coordinate> = computed({
    get: () => mapCursorStore.coordinate,
    set: coordinate => mapCursorStore.setCoordinate(coordinate)
  });

  // 初期位置の設定
  if (center) {
    currentPosition.value = center;
  }
  currentZoom.value = zoom;

  /** カーソル */
  const cursorFeature: Feature<Point> = new Feature({
    geometry: new Point(currentPosition.value),
    name: 'cursor'
  });

  /** ビュー */
  const view: View = new View({
    center: transform(currentPosition.value, 'EPSG:4326', 'EPSG:3857'),
    projection: 'EPSG:3857',
    zoom: currentZoom.value,
    minZoom,
    maxZoom,
    extent: extentLimit
  });

  /** ジオロケーション設定 */
  const geolocation = new Geolocation();
  geolocation.setProjection(view.getProjection());
  geolocation.setTracking(true);

  geolocation.on('change:position', () => {
    const coordinates = geolocation.getPosition();
    cursorFeature.setGeometry(coordinates ? new Point(coordinates) : undefined);
  });

  /** カーソルレイヤ */
  const cursorLayer = new VectorLayer({
    // @ts-ignore
    title: '現在地',
    zIndex: 999,
    style: pinStyle,
    visible: false,
    source: new VectorSource({
      features: [cursorFeature]
    }),
    properties: {
      id: 'cursorLayer'
    }
  });

  /** 通知 */
  const notification = new Notification();

  /** マップをセットアップ */
  const map: ShallowRef<Map> = shallowRef(
    new Map({
      controls: [
        new Zoom(),
        new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: 'EPSG:4326'
        }),
        new ZoomSlider(),
        new Attribution({ collapsible: false }),
        new ProgressBar({ label: loadingMessage }),
        new Scale({}),
        new ScaleLine(),
        new LayerPopup(),
        notification
      ],
      view,
      layers: [
        new Tile({
          // @ts-ignore
          title: 'OpenStreetMap',
          baseLayer: true,
          zIndex: 1,
          properties: { id: 'osm' },
          source: new OSM(),
          visible: true
        }),
        new Tile({
          // @ts-ignore
          title: '国土地理院標準地図',
          baseLayer: true,
          zIndex: 1,
          properties: { id: 'gsi' },
          source: new XYZ({
            url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
            attributions: [
              '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>'
            ]
          }),
          visible: false
        }),
        new VectorTileLayer({
          // @ts-ignore
          title: '国土地理院ベクトルタイル',
          baseLayer: true,
          zIndex: 2,
          properties: { id: 'gsi-vector' },
          source: new VectorTileSource({
            format: new MVT(),
            url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf',
            maxZoom: 17,
            minZoom: 4,
            attributions: [
              '<a href="https://maps.gsi.go.jp/vector/" target="_blank">地理院地図Vector</a>'
            ]
          }),
          renderBuffer: 100,
          style: stylingVectorTile,
          visible: false
        }),
        new Tile({
          // @ts-ignore
          title: '全国最新写真（シームレス）',
          baseLayer: true,
          zIndex: 0,
          properties: { id: 'seamlessphoto' },
          source: new XYZ({
            url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
            attributions: [
              '<a href="https://maps.gsi.go.jp/development/ichiran.html#seamlessphoto" target="_blank">国土地理院</a>'
            ]
          }),
          visible: false
        }),
        cursorLayer
      ]
    })
  );

  /** インタラクション */
  const interactions: Interaction[] = map.value.getInteractions().getArray();

  /** 回転を無効化 */
  const pinchRotateInteraction = interactions.find((interaction: Interaction) => {
    return interaction instanceof PinchRotate;
  });
  pinchRotateInteraction?.setActive(false);

  /** カーソルピンをクリックした時 */
  const cursorClick = new Select({
    condition: singleClick,
    layers: [cursorLayer]
  });
  map.value.addInteraction(cursorClick);

  /** プログレスバー */
  const progress = new ProgressBar({
    label: loadingMessage,
    layers: map.value.getAllLayers()
  });
  map.value.addControl(progress);

  /**
   * マップの移動終了イベントを設定
   */
  const setupMoveEndHandler = (centerCoordinate: Coordinate) => {
    map.value.on('moveend', () => {
      const view = map.value.getView();
      const mapCenter = view.getCenter() ?? centerCoordinate;
      currentPosition.value = [mapCenter[0] || 0, mapCenter[1] || 0];
      currentZoom.value = view.getZoom() ?? 0;
    });
  };

  /**
   * カーソルレイヤーの表示/非表示を設定
   */
  const setCursorVisible = (visible: boolean) => {
    cursorLayer.setVisible(visible);
  };

  /**
   * クエリパラメータから初期位置とズームを設定
   */
  const setFromQuery = (query: Record<string, string>) => {
    if (query.x && query.y) {
      currentPosition.value = [Number.parseFloat(query.y), Number.parseFloat(query.x)];
      setCursorVisible(true);
    }
    if (query.zoom) {
      currentZoom.value = Number.parseInt(query.zoom);
    }
  };

  return {
    map,
    view,
    notification,
    cursorLayer,
    currentZoom,
    currentPosition,
    setupMoveEndHandler,
    setCursorVisible,
    setFromQuery
  };
}
