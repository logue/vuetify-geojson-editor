/** マップコンテキストメニュー用Composable */
import { useGlobalStore, useMapCursorStore } from '@/store';
import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { useRouter } from 'vue-router';

import { createWriteStream } from 'streamsaver';

import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import type { Size } from 'ol/size';

/**
 * マップのコンテキストメニュー機能を提供するComposable
 */
export function useMapContextMenu(map: Ref<Map | undefined>) {
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

  /**
   * ピンの座標へのリンクをコピー
   */
  const copyLink = async (): Promise<void> => {
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
    if (!map.value) {
      return;
    }
    const mapInstance = map.value;
    globalStore.setLoading(true);

    mapInstance.once('rendercomplete', () => {
      const size: Size = mapInstance.getSize() ?? [0, 0];

      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = size[0] || 0;
      mapCanvas.height = size[1] || 0;

      const mapContext = mapCanvas.getContext('2d') as CanvasRenderingContext2D;
      mapContext.fillStyle = '#1d3b58';
      mapContext.fillRect(0, 0, mapCanvas.width, mapCanvas.height);

      let matrix;
      Array.prototype.forEach.call(document.querySelectorAll('.ol-layer canvas'), canvas => {
        if (canvas.width < 0) {
          return;
        }
        const opacity = canvas.parentNode.style.opacity;
        mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
        const transform = canvas.style.transform;
        matrix = transform
          .match(/^matrix\(([^(]*)\)$/)[1]
          .split(',')
          .map(Number);
        CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
        mapContext.drawImage(canvas, 0, 0);
      });

      const gridCanvas = document.querySelector('.ol-fixedoverlay') as HTMLCanvasElement;
      if (gridCanvas) {
        mapContext.drawImage(gridCanvas, 0, 0);
      }

      CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, [1, 0, 0, 1, 0, 0] as [
        number,
        number,
        number,
        number,
        number,
        number
      ]);

      mapCanvas.toBlob(
        async (blob: Blob | null): Promise<void> => {
          if (!blob) {
            return;
          }
          if (toFile) {
            const fileStream = createWriteStream('map.png', {
              size: blob.size
            });
            await new Response(blob).body?.pipeTo(fileStream);
          } else {
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

    mapInstance.renderSync();
    globalStore.setLoading(false);
  };

  /**
   * コンテキストメニューを表示
   */
  const show = (e?: MouseEvent): void => {
    if (map.value && e) {
      position.value = { x: e.clientX, y: e.clientY };
      coordinate.value = map.value.getEventCoordinate(e);
    }
    visibility.value = true;
  };

  /**
   * コンテキストメニューを非表示
   */
  const hide = (): void => {
    visibility.value = false;
  };

  return {
    visibility,
    position,
    coordinate,
    zoom,
    copyLink,
    toImage,
    show,
    hide
  };
}
