<script setup lang="ts">
/** マップコンポーネント */
import { onMounted, onUnmounted, ref, type PropType, type Ref } from 'vue';
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
const props = defineProps({
  zoom: { type: Number, default: 8 },
  /** 最小ズームアウト値 */
  minZoom: { type: Number, default: 4 },
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
