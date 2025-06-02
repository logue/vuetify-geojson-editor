<script setup lang="ts">
import { useGlobal, useMapCursor, useGeoJsonEditor } from '@/store';
import { computed, nextTick, onMounted, ref, watch, type Ref, type WritableComputedRef } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import MapBrowserEventType from 'ol/MapBrowserEventType';
import { Select } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import UndoRedo from 'ol-ext/interaction/UndoRedo';

import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type MapBrowserEvent from 'ol/MapBrowserEvent';

// コンポーネント
import MapComponent from '@/components/Map/MapComponent.vue';
import MapContextMenu from '@/components/Map/MapContextMenu.vue';
import MapEditorToolbar from '@/components/Map/MapEditorToolbar.vue';
// ヘルパ
import FeatureStatus from '@/helpers/FeatureStyles/FeatureStatus';
import { getFeatureStyle, setFeaturesStyle } from '@/helpers/FeatureUtility';

/** グローバルストア */
const globalStore = useGlobal();
/** マップカーソルストア */
const mapCursorStore = useMapCursor();
/** GeoJsonエディタストア */
const geoJsonEditorStore = useGeoJsonEditor();

/** マップ */
const mapComponent: Ref<InstanceType<typeof MapComponent> | undefined> = ref();
/** 確認モーダル */
const mapContextMenu: Ref<InstanceType<typeof MapContextMenu> | undefined> = ref();
/** ツールバー */
const mapToolbar: Ref<InstanceType<typeof MapEditorToolbar> | undefined> = ref();
/** 再描画フラグ */
const ready: Ref<boolean> = ref(false);

/** Message */
const message: WritableComputedRef<string> = computed({
  get: () => globalStore.message,
  set: v => globalStore.setMessage(v)
});

/** loading overlay visibility */
const loading: WritableComputedRef<boolean> = computed({
  get: () => globalStore.loading,
  set: v => globalStore.setLoading(v)
});

/** レイヤ */
const level: WritableComputedRef<number> = computed({
  get: () => mapCursorStore.level,
  set: l => mapCursorStore.setLevel(l)
});

/** ピン一覧 */
const features: WritableComputedRef<Feature[]> = computed({
  get: () => geoJsonEditorStore.getFeatures(),
  set: feats => geoJsonEditorStore.setFeatures(feats)
});

/** 場所レイヤー */
const locationLayer: VectorLayer<VectorSource> = new VectorLayer({
  properties: { id: 'locationLayer' },
  zIndex: 5
});

/** 編集用レイヤ */
const editorLayer: VectorLayer<VectorSource> = new VectorLayer<VectorSource>({
  source: new VectorSource({
    features: features.value
  }),
  style: f => getFeatureStyle(f),
  zIndex: 10,
  properties: {
    id: 'editorLayer'
  }
});

/**
 * 選択インタラクション
 *
 * @see {@link https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html}
 */
const selectInteraction = new Select({
  // シングルクリックのみ
  condition: (e: MapBrowserEvent) => e.type === MapBrowserEventType.SINGLECLICK,
  // 対象レイヤ
  layers: [editorLayer],
  // 許容ピクセル
  hitTolerance: 2,
  // 選択時のスタイル
  style: (f: FeatureLike) => getFeatureStyle(f, FeatureStatus.SELECTED),
  multi: false
});

/** レイヤー切替時 */
watch(
  () => level.value,
  value => {
    /** マップ */
    const map = mapComponent.value?.map;
    if (!map) {
      return;
    }
    /** 読み込まれているレイヤ */
    const layers = map.getLayers();

    layers.forEach(l => {
      if (l instanceof VectorLayer) {
        // レイヤスタイルを上書き
        setFeaturesStyle(l, value);
      }
      return l;
    });
    // 上書き
    map.setLayers(layers);
  }
);

watch(
  () => message.value,
  s => mapComponent.value?.notification.show(s)
);

/** 準備完了 */
onMounted(async () => {
  /** マップのインスタンス */
  const map = mapComponent.value?.map;
  if (!map) {
    return;
  }
  loading.value = true;
  locationLayer.setSource(new VectorSource({ features: features.value }));
  setFeaturesStyle(locationLayer, level.value);

  // 場所レイヤを追加
  map.addLayer(locationLayer);
  // 記入用レイヤをマップに追加
  map.addLayer(editorLayer);

  // 取り消し／やり直しインタラクションを登録
  map.addInteraction(new UndoRedo());

  // ピン選択を有効化
  map.addInteraction(selectInteraction);

  // 初期選択
  loading.value = false;
});

const contextmenu = (e: MouseEvent) => {
  // コンテキストメニューを表示
  mapContextMenu.value?.show(e);
};

onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.region !== from.params.region) {
    ready.value = false;
  }
  next();
  await nextTick();
  if (to.params.region !== from.params.region) {
    ready.value = true;
  }
});
</script>

<template>
  <v-container fluid class="px-0 py-0 d-flex flex-column h-100">
    <!-- ツールバー -->
    <map-editor-toolbar
      v-if="mapComponent"
      ref="mapToolbar"
      :map="mapComponent.map"
      :layer="editorLayer"
    />
    <!-- マップ -->
    <map-component ref="mapComponent" @contextmenu="contextmenu" />
    <!-- コンテキストメニュー -->
    <map-context-menu v-if="mapComponent" ref="mapContextMenu" :map="mapComponent.map" />
  </v-container>
</template>
