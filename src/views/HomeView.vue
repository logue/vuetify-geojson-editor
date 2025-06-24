<script setup lang="ts">
import { useGlobalStore, useMapCursorStore, useGeoJsonEditorStore } from '@/store';
import { computed, nextTick, onMounted, ref, watch, type Ref, type WritableComputedRef } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

// コンポーネント
import MapComponent from '@/components/Map/MapComponent.vue';
import MapContextMenu from '@/components/Map/MapContextMenu.vue';
import MapEditorToolbar from '@/components/Map/MapEditorToolbar.vue';
// ヘルパ
import { getFeatureStyle, setFeaturesStyle } from '@/helpers/FeatureUtility';

/** グローバルストア */
const globalStore = useGlobalStore();
/** マップカーソルストア */
const mapCursorStore = useMapCursorStore();
/** GeoJsonエディタストア */
const geoJsonEditorStore = useGeoJsonEditorStore();

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

/** 編集用レイヤ */
const editorLayer: VectorLayer<VectorSource> = new VectorLayer<VectorSource>({
  // @ts-ignore
  title: 'Editor Layer',
  source: new VectorSource({
    features: geoJsonEditorStore.features
  }),
  style: f => getFeatureStyle(f),
  zIndex: 10,
  properties: {
    id: 'editorLayer'
  }
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
  // 記入用レイヤをマップに追加
  map.addLayer(editorLayer);

  // 初期選択
  loading.value = false;
});

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
    <map-component ref="mapComponent" @contextmenu="mapContextMenu?.show" />
    <!-- コンテキストメニュー -->
    <map-context-menu v-if="mapComponent" ref="mapContextMenu" :map="mapComponent.map" />
  </v-container>
</template>
