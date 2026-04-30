<script setup lang="ts">
/** マップコンポーネント */
import { onMounted, onUnmounted, ref, type Ref } from 'vue';
import { useRoute } from 'vue-router';

import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';

import { useMapSetup } from '@/composables/useMapSetup';

interface Emits {
  /** 準備完了 */
  (event: 'ready', value: HTMLDivElement): void;
  /** コンテキストメニュー */
  (event: 'contextmenu', value: MouseEvent): void;
}

/** プロップ */
const props = withDefaults(
  defineProps<{
    zoom?: number;
    /** 最小ズームアウト値 */
    minZoom?: number;
    /** 最大ズームイン値 */
    maxZoom?: number;
    /** 表示限界領域（↓←↑→） */
    extentLimit?: Extent;
    /** 中心座標 */
    center?: Coordinate;
    /** コンテキストメニューを表示する */
    contextMenu?: boolean;
    /** ローディングのテキスト */
    loadingMessage?: string;
  }>(),
  {
    zoom: 8,
    minZoom: 4,
    maxZoom: 18,
    extentLimit: undefined,
    center: () => [139.766667, 35.681111] as Coordinate,
    contextMenu: true,
    loadingMessage: 'Now Loading...'
  }
);

const emit = defineEmits<Emits>();

/** Route */
const route = useRoute();

/** マップのDOM */
const ol: Ref<InstanceType<typeof HTMLDivElement> | undefined> = ref();

/** マップセットアップ */
const { map, notification, setupMoveEndHandler, setFromQuery } = useMapSetup({
  zoom: props.zoom,
  minZoom: props.minZoom,
  maxZoom: props.maxZoom,
  extentLimit: props.extentLimit,
  center: props.center,
  loadingMessage: props.loadingMessage
});

/* Query String */
const query = route?.query as Record<string, string>;

// クエリパラメータから初期設定
setFromQuery(query);

// マップの移動終了イベントを設定
setupMoveEndHandler(props.center);

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
