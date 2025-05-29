<script setup lang="ts">
/** マップコンポーネント */
import { useMapCursor } from '@/store';
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  type PropType,
  type Ref,
  type ShallowRef,
  type WritableComputedRef
} from 'vue';
import { useRoute } from 'vue-router';

import { compact } from 'es-toolkit';
// openlayers
import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Map from 'ol/Map';
import View from 'ol/View';
import { Attribution, MousePosition, Zoom, ZoomSlider, ScaleLine } from 'ol/control';
import { createStringXY } from 'ol/coordinate';
import { singleClick } from 'ol/events/condition';
//import MVT from 'ol/format/MVT';
import Point from 'ol/geom/Point';
import { Interaction, PinchRotate, Select } from 'ol/interaction';
import { Tile, Vector as VectorLayer } from 'ol/layer';
import { transform } from 'ol/proj';
import { OSM, Vector as VectorSource } from 'ol/source';
//import VectorTileLayer from 'ol/layer/VectorTile';
//import VectorTileSource from 'ol/source/VectorTile';
// ol-ext
import Notification from 'ol-ext/control/Notification';
import ProgressBar from 'ol-ext/control/ProgressBar';
import Scale from 'ol-ext/control/Scale';

import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';

// ヘルパ
import { pinStyle } from '@/helpers/FeatureUtility';

// import featureAnimation from 'ol-ext/featureanimation/FeatureAnimation';
// import Bounce from 'ol-ext/featureanimation/Bounce';
// import Drop from 'ol-ext/featureanimation/Drop';

interface Emits {
  /** 準備完了 */
  (event: 'ready', value: HTMLDivElement): void;
  /** コンテキストメニュー */
  (event: 'contextmenu', value: MouseEvent): void;
}

/** プロップ */
const props = defineProps({
  zoom: { type: Number, default: 6 },
  /** 最小ズームアウト値 */
  minZoom: { type: Number, default: 0 },
  /** 最大ズームイン値 */
  maxZoom: { type: Number, default: 18 },
  /** 表示限界領域（↓←↑→） */
  extentLimit: {
    type: Array as PropType<Extent | undefined>,
    default: () => undefined
  },
  /** 中心座標 */
  center: {
    type: Array as PropType<Coordinate>,
    default: () => [139.766667, 35.681111]
  },
  /** コンテキストメニューを表示する */
  contextMenu: { type: Boolean, default: true },
  /** ローディングのテキスト */
  loadingMessage: { type: String, default: 'Now Loading...' }
});

const emit = defineEmits<Emits>();

/** Route */
const route = useRoute();
/** マップのカーソルストア */
const mapCursorStore = useMapCursor();

/** マップのDOM */
const ol: Ref<InstanceType<typeof HTMLDivElement> | undefined> = ref();

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

/* Query String */
const query = route?.query as Record<string, string>;

// 現在地を上書き
if (query.x && query.y) {
  currentPosition.value = [parseFloat(query.y), parseFloat(query.x)];
} else if (props.center) {
  currentPosition.value = props.center;
}

// 初期ズーム値
currentZoom.value = query.zoom ? parseInt(query.zoom) : props.zoom;

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
  minZoom: props.minZoom,
  maxZoom: props.maxZoom,
  extent: props.extentLimit
});

/** ジオロケーション設定 */
const geolocation = new Geolocation();
geolocation.setProjection(view.getProjection());

// トラッキング開始
geolocation.setTracking(true);

geolocation.on('change:position', () => {
  const coordinates = geolocation.getPosition();
  cursorFeature.setGeometry(coordinates ? new Point(coordinates) : undefined);
});

/** カーソルレイヤ */
const cursorLayer = new VectorLayer({
  zIndex: 999,
  style: pinStyle,
  visible: true,
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
      new ProgressBar({ label: props.loadingMessage }),
      new Scale({}),
      new ScaleLine(),
      notification
    ],
    view,
    layers: compact([
      new Tile({
        zIndex: 0,
        properties: { id: 'osm' },
        source: new OSM(),
        visible: true
      }),
      /*
      new VectorTileLayer({
        source: new VectorTileSource({
          format: new MVT(),
          url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf',
          maxZoom: 18,
          minZoom: 4,
          attributions: [
            '<a href="https://maps.gsi.go.jp/vector/" target="_blank">地理院地図Vector</a>'
          ]
        })
      }),
      */
      cursorLayer
    ])
  })
);

/** インタラクション */
const interactions: Interaction[] = map.value.getInteractions().getArray();
/** 回転を無効化 */
const pinchRotateInteraction = interactions.filter((interaction: Interaction) => {
  return interaction instanceof PinchRotate;
})[0];
pinchRotateInteraction.setActive(false);

/** カーソルピンをクリックした時 */
const cursorClick = new Select({
  condition: singleClick,
  layers: [cursorLayer]
});
cursorClick.on('select', () => {
  // cursorLayer.setVisible(false);
});
map.value.addInteraction(cursorClick);

/*
アニメーション処理
(this.cursorLayer as any).animateFeature(cursorFeature, [
  new featureAnimation(
    new Drop({
      speed: 0.8,
      side: 1,
    }),
    new Bounce({ easing: (p0: number) => p0 })
  ),
]);
*/

if (route?.query.x && route?.query.y) {
  // クエリから来た場合は初期位置にマーカーを設置
  cursorLayer.setVisible(true);
}

// マップの設定を保存
map.value.on('moveend', () => {
  /** 現在のビュー */
  const view = map.value.getView();
  /** 中心座標 */
  const center = view.getCenter() ?? props.center;
  // 現在の座標を中心座標に合わせる
  currentPosition.value = [center[0], center[1]];
  // 現在のズーム値を保存
  currentZoom.value = view.getZoom() ?? 0;
});

/** プログレスバー */
const progress = new ProgressBar({
  label: props.loadingMessage,
  layers: map.value.getAllLayers()
});
map.value.addControl(progress);

/** 読み込まれたとき */
onMounted(() => {
  if (ol.value) {
    map.value.setTarget(ol.value);
    // 準備完了通知
    emit('ready', ol.value);
  }

  /** コンテキストメニュー */
  map.value.getViewport().addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault();
    emit('contextmenu', e);
  });
});

/** 破棄時 */
onUnmounted(() => map.value.setTarget());

defineExpose({ map, notification });
</script>

<template>
  <div ref="ol" class="map-component py-0 px-0"></div>
</template>

<style src="@/styles/openlayers.scss" />
