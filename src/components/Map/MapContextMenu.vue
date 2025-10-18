<script setup lang="ts">
import { useGlobalStore, useMapCursorStore } from '@/store';
import { computed, ref, type ComputedRef, type PropType, type Ref } from 'vue';
import { useRouter } from 'vue-router';

import { createWriteStream } from 'streamsaver';

import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import type { Size } from 'ol/size';

/** MapContextMenu */
/** プロップ */
const props = defineProps({
  /** マップ */
  map: { type: Object as PropType<Map | undefined>, default: undefined }
});

/** Route */
const router = useRouter();
/** グローバルストア */
const globalStore = useGlobalStore();
/** マップのカーソルストア */
const mapCursorStore = useMapCursorStore();

/** コンテキストメニュー */
const visibility: Ref<boolean> = ref(false);
/** コンテキストメニューの座標 */
const position: Ref<{ x: number; y: number }> = ref({ x: 0, y: 0 });
/** 現在地 */
const coordinate: Ref<Coordinate> = ref([0, 0]);

/** 現在のズーム */
const zoom: ComputedRef<number> = computed(() => mapCursorStore.zoom);

/** ピンの座標へのリンクをコピー */
const copyLink = async (): Promise<void> => {
  /** パス */
  const path = router.resolve({
    query: {
      x: coordinate.value[1]!.toFixed(6).toString(),
      y: coordinate.value[0]!.toFixed(6).toString(),
      zoom: Math.round(zoom.value).toString()
    }
  });
  await navigator.clipboard.writeText(location.origin + path.href);
  globalStore.setMessage('Copied to clipboard this coordinate link url.');
};

/**
 * 表示されているマップを画像として保存
 *
 * @param toFile - ファイルとして保存するか
 */
const toImage = async (toFile = false): Promise<void> => {
  if (!props.map) {
    return;
  }
  const map = props.map;
  globalStore.setLoading(true);
  map.once('rendercomplete', () => {
    /** マップのサイズ */
    const size: Size = map.getSize() ?? [0, 0];

    // TODO: カーソルレイヤを一時的に隠す

    /** 仮想描画Canvas */
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = size[0] || 0;
    mapCanvas.height = size[1] || 0;

    /** 描画コンテキスト */
    const mapContext = mapCanvas.getContext('2d') as CanvasRenderingContext2D;
    // 背景を塗りつぶす
    mapContext.fillStyle = '#1d3b58';
    mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

    /** 解像度調整マトリックス */
    let matrix;
    Array.prototype.forEach.call(document.querySelectorAll('.ol-layer canvas'), canvas => {
      if (canvas.width < 0) {
        return;
      }
      /** 透過度 */
      const opacity = canvas.parentNode.style.opacity;
      mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
      /** 変形 */
      const transform = canvas.style.transform;
      // Get the transform parameters from the style's transform matrix
      matrix = transform
        .match(/^matrix\(([^(]*)\)$/)[1]
        .split(',')
        .map(Number);
      // Apply the transform to the export map context
      CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
      mapContext.drawImage(canvas, 0, 0);
    });
    /** グリッド */
    const gridCanvas = document.querySelector('.ol-fixedoverlay') as HTMLCanvasElement;
    if (gridCanvas) {
      mapContext.drawImage(gridCanvas, 0, 0);
    }

    CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, [1, 0, 0, 1, 0, 0] as any);

    // Blobに変換
    mapCanvas.toBlob(
      async (blob: Blob | null): Promise<void> => {
        if (!blob) {
          return;
        }
        if (toFile) {
          /** ファイルストリーム生成 */
          const fileStream = createWriteStream('map.png', {
            size: blob.size
          });
          // レスポンスを発行
          await new Response(blob).body?.pipeTo(fileStream);
        } else {
          // クリップボードとして保存
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': Promise.resolve(blob)
            })
          ]);
          globalStore.setMessage('Copied to clipboard map image.');
        }
      },
      'image/png',
      0.9
    );
  });
  map.renderSync();
  globalStore.setLoading(false);
};

/** コンテキストメニューを表示 */
const show = (e?: MouseEvent): void => {
  if (props.map && e) {
    // 表示位置
    position.value = { x: e.clientX, y: e.clientY };
    // クリックされた場所の座標
    coordinate.value = props.map.getEventCoordinate(e);
  }
  // 表示
  visibility.value = true;
};

/** コンテキストメニューを表示 */
const hide = (): void => {
  visibility.value = false;
};

defineExpose({ show, hide, position, coordinate });
</script>

<template>
  <v-menu v-model="visibility" absolute :style="`top: ${position.y}px; left: ${position.x}px`">
    <v-list density="compact">
      <!-- 座標やズーム値 -->
      <v-list-subheader>
        <v-icon size="small">mdi-crosshairs</v-icon>
        Coordinate
        <v-icon size="small">mdi-arrow-left-right</v-icon>
        {{ coordinate[0]!.toFixed(6) }},
        <v-icon size="small">mdi-arrow-up-down</v-icon>
        {{ coordinate[1]!.toFixed(6) }}
        &nbsp;
        <v-icon size="small">mdi-magnify</v-icon>
        Zoom: {{ Math.round(zoom) }}
      </v-list-subheader>
      <!-- メニュー項目 -->
      <v-list-item
        prepend-icon="mdi-link-variant"
        title="Copy link to the clipboard"
        @click="copyLink"
      />
      <v-divider />
      <v-list-item
        prepend-icon="mdi-image-marker"
        title="Copy the map image to the clipboard"
        @click="toImage(false)"
      />
      <v-list-item
        prepend-icon="mdi-file-image-marker"
        title="Save map image to file"
        @click="toImage(true)"
      />
    </v-list>
  </v-menu>
</template>
